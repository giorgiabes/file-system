import { useState, useEffect } from 'react';
import { downloadFile, type FileItem } from '../services/api';
import './FilePreview.css';

interface FilePreviewProps {
  file: FileItem;
  onClose: () => void;
}

function FilePreview({ file, onClose }: FilePreviewProps) {
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    loadFileContent();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadFileContent = async () => {
    try {
      const response = await downloadFile(file.path);
      setContent(response.data.content);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || 'Failed to load file');
    } finally {
      setLoading(false);
    }
  };

  const renderPreview = () => {
    if (loading) return <div className="preview-loading">Loading...</div>;
    if (error) return <div className="preview-error">{error}</div>;

    const mimeType = file.mimeType || '';

    // Images
    if (mimeType.startsWith('image/')) {
      return <img src={`data:${mimeType};base64,${content}`} alt={file.name} className="preview-image" />;
    }

    // Text files
    if (mimeType.startsWith('text/') || 
        ['application/json', 'application/javascript', 'application/xml'].includes(mimeType)) {
      const decoded = atob(content);
      return <pre className="preview-text">{decoded}</pre>;
    }

    // PDF
    if (mimeType === 'application/pdf') {
      return (
        <iframe
          src={`data:application/pdf;base64,${content}`}
          className="preview-pdf"
          title={file.name}
        />
      );
    }

    // Unsupported
    return (
      <div className="preview-unsupported">
        <p>Preview not available for this file type</p>
        <p>MIME Type: {mimeType}</p>
        <p>Size: {formatSize(file.size)}</p>
      </div>
    );
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  return (
    <div className="preview-overlay" onClick={onClose}>
      <div className="preview-modal" onClick={(e) => e.stopPropagation()}>
        <div className="preview-header">
          <h2>{file.name}</h2>
          <button onClick={onClose} className="preview-close">×</button>
        </div>

        <div className="preview-content">
          {renderPreview()}
        </div>

        <div className="preview-footer">
          <p>Type: {file.mimeType || 'Unknown'}</p>
          <p>Size: {formatSize(file.size)}</p>
          <p>Modified: {new Date(file.modifiedAt).toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}

export default FilePreview;