/**
 * File: FileNode.ts
 *
 * Purpose: Represents a file with metadata
 */
import FilePath from "../value-objects/FilePath";
import ContentHash from "../value-objects/ContentHash";

class FileNode {
  private readonly path: FilePath; // (identity - never changes)
  private contentHash: ContentHash; // (can change if file updated)
  private size: number;
  private mimeType: string;
  private createdAt: Date;
  private modifiedAt: Date;

  constructor(
    path: FilePath,
    contentHash: ContentHash,
    size: number,
    mimeType: string = "application/octet-stream"
  ) {
    this.path = path;
    this.contentHash = contentHash;
    this.size = size;
    this.mimeType = mimeType;
    this.createdAt = new Date();
    this.modifiedAt = new Date();
  }

  getPath(): FilePath {
    return this.path;
  }

  getContentHash(): ContentHash {
    return this.contentHash;
  }

  getSize(): number {
    return this.size;
  }

  getMimeType(): string {
    return this.mimeType;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getModifiedAt(): Date {
    return this.modifiedAt;
  }

  updateContent(newHash: ContentHash, newSize: number): void {
    this.contentHash = newHash;
    this.size = newSize;
    this.modifiedAt = new Date();
  }

  touch(): void {
    this.modifiedAt = new Date();
  }
}

export default FileNode;
