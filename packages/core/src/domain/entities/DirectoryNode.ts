/**
 * File: DirectoryNode.ts
 *
 * Purpose: Represents a directory (folder)
 *
 * Directories are simpler than files - thay don't have
 * content or size, just a path and timestamps.
 */
import FilePath from "../value-objects/FilePath";

class DirectoryNode {
  private readonly path: FilePath;
  private createdAt: Date;
  private modifiedAt: Date;

  constructor(path: FilePath) {
    this.path = path;
    this.createdAt = new Date();
    this.modifiedAt = new Date();
  }

  getPath(): FilePath {
    return this.path;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  getModifiedAt(): Date {
    return this.modifiedAt;
  }

  touch(): void {
    this.modifiedAt = new Date();
  }

  isRoot(): boolean {
    return this.path.toString() === "/";
  }
}

export default DirectoryNode;
