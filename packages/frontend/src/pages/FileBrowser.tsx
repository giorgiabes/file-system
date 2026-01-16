import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  listDirectory,
  uploadFile,
  downloadFile,
  deleteFile,
  deleteDirectory,
  createDirectory,
  type FileItem,
} from "../services/api";

function FileBrowser() {
  const [currentPath, setCurrentPath] = useState("/");
  const [items, setItems] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const loadFiles = async (path: string) => {
    setLoading(true);
    setError("");
    try {
      const response = await listDirectory(path);
      setItems(response.data.items);
      setCurrentPath(path);
    } catch (err: unknown) {
      const error = err as {
        response?: { status?: number; data?: { error?: string } };
      };
      if (error.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/login");
      } else {
        setError(error.response?.data?.error || "Failed to load directory");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = async () => {
        try {
          const content = btoa(reader.result as string);
          const fileName = prompt("Enter file name:", file.name);
          if (!fileName) return;

          const filePath =
            currentPath === "/" ? `/${fileName}` : `${currentPath}/${fileName}`;
          await uploadFile(filePath, content);
          loadFiles(currentPath);
        } catch (err: unknown) {
          const error = err as { response?: { data?: { error?: string } } };
          setError(error.response?.data?.error || "Upload failed");
        }
      };
      reader.readAsBinaryString(file);
    };
    input.click();
  };

  const handleDelete = async (item: FileItem) => {
    if (!confirm(`Delete ${item.name}?`)) return;

    try {
      if (item.type === "file") {
        await deleteFile(item.path);
      } else {
        await deleteDirectory(item.path);
      }
      loadFiles(currentPath);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Delete failed");
    }
  };

  const handleCreateDirectory = async () => {
    const dirName = prompt("Enter directory name:");
    if (!dirName) return;

    try {
      const dirPath =
        currentPath === "/" ? `/${dirName}` : `${currentPath}/${dirName}`;
      await createDirectory(dirPath);
      loadFiles(currentPath);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Create directory failed");
    }
  };

  const handleDownload = async (item: FileItem) => {
    try {
      const response = await downloadFile(item.path);
      const content = atob(response.data.content);

      const blob = new Blob([content]);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = item.name;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      setError(error.response?.data?.error || "Download failed");
    }
  };

  const handleNavigate = (item: FileItem) => {
    if (item.type === "directory") {
      loadFiles(item.path);
    }
  };

  const handleBreadcrumbClick = (path: string) => {
    loadFiles(path);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  const getBreadcrumbs = () => {
    const parts = currentPath.split("/").filter(Boolean);
    const breadcrumbs = [{ name: "Root", path: "/" }];

    let path = "";
    for (const part of parts) {
      path += `/${part}`;
      breadcrumbs.push({ name: part, path });
    }

    return breadcrumbs;
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="file-browser">
      <header className="header">
        <h1>File System</h1>
        <button onClick={handleLogout} className="logout-btn">
          Logout
        </button>
      </header>

      <div className="breadcrumbs">
        {getBreadcrumbs().map((crumb, index) => (
          <span key={crumb.path}>
            {index > 0 && <span className="separator"> / </span>}
            <button
              onClick={() => handleBreadcrumbClick(crumb.path)}
              className="breadcrumb-btn"
            >
              {crumb.name}
            </button>
          </span>
        ))}
      </div>

      <div className="toolbar">
        <button onClick={handleUpload} className="btn btn-primary">
          📤 Upload File
        </button>
        <button onClick={handleCreateDirectory} className="btn btn-primary">
          📁 New Folder
        </button>
        <button onClick={() => loadFiles(currentPath)} className="btn">
          🔄 Refresh
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading">Loading...</div>
      ) : (
        <div className="file-list">
          {items.length === 0 ? (
            <div className="empty-state">
              <p>📂 This directory is empty</p>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Size</th>
                  <th>Modified</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.path}>
                    <td>
                      <button
                        onClick={() => handleNavigate(item)}
                        className="file-name"
                      >
                        {item.type === "directory" ? "📁" : "📄"} {item.name}
                      </button>
                    </td>
                    <td>{item.type}</td>
                    <td>
                      {item.type === "file" ? formatSize(item.size) : "-"}
                    </td>
                    <td>{formatDate(item.modifiedAt)}</td>
                    <td>
                      <div className="actions">
                        {item.type === "file" && (
                          <button
                            onClick={() => handleDownload(item)}
                            className="action-btn"
                            title="Download"
                          >
                            ⬇️
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(item)}
                          className="action-btn delete"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

export default FileBrowser;
