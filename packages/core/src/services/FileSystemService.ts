/**
 * FileSystemService implements IFsProvider and contains
 * all the file system logic.
 */

import { IFsProvider } from "../interfaces/IFsProvider";
import { IMetadataRepository } from "../interfaces/IMetadataRepository";
import { IBlobStorage } from "../interfaces/IBlobStorage";
import FilePath from "../domain/value-objects/FilePath";
import ContentHash from "../domain/value-objects/ContentHash";
import FileNode from "../domain/entities/FileNode";
import mime from "mime-types";
import DirectoryNode from "../domain/entities/DirectoryNode";
import {
  FileNotFoundError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  DirectoryNotEmptyError,
} from "../domain/errors/FsErrors";

export class FileSystemService implements IFsProvider {
  constructor(
    private repository: IMetadataRepository,
    private blobStorage: IBlobStorage
  ) {}

  /**
   * This method creates a new directory
   *
   * Business logic
   * 1. Validate the path
   * 2. Check if directory already exists
   * 3. If exists throw FileAlreadyExistsError
   * 4. Create parent directory path(e.g. /docs/images -> /docs)
   * 5. Check if parent exists (except for root /)
   * 6. If parent doesn't exist, throw DirectoryNotFoundError
   * 7. Create new DirectoryNode
   * 8. Save to repository
   *
   * @param path
   */
  async createDirectory(path: string): Promise<void> {
    // 1. Validate path
    const filePath = FilePath.create(path);

    // 2. Check if already exists
    const existing = await this.repository.getNodeByPath(path);
    if (existing) {
      throw new FileAlreadyExistsError(`Path already exists: ${path}`);
    }

    // 3. Check parent directory exists (unless creating root)
    if (path !== "/") {
      const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
      const parent = await this.repository.getNodeByPath(parentPath);
      if (!parent) {
        throw new DirectoryNotFoundError(
          `Parent directory not found: ${parentPath}`
        );
      }
    }

    // 4. Create and save directory node
    const directory = new DirectoryNode(filePath);
    await this.repository.createNode(directory);
  }

  /**
   * This method writes file and (IMPORTANT) handles deduplications
   *
   * Business logic
   * 1. Validate path
   * 2. Calculate content hash
   * 3. Check if blob already exists (DEDUPLICATION)
   * 4. If blob doesn't exist, write it
   * 5. Increment blob reference count
   * 6. Check if file metadata already exists
   * 7. If exists, update it (and decrement old blob reference)
   * 8. if new, create it (and check parent directory exists)
   */
  async writeFile(path: string, content: Buffer): Promise<void> {
    // 1. Validate path
    const filePath = FilePath.create(path);

    // 2. Calculate content hash
    const contentHash = ContentHash.fromContent(content);
    const hashString = contentHash.toString();

    // 3. Check if blob already exists (deduplication!)
    const blobExists = await this.blobStorage.exists(hashString);
    if (!blobExists) {
      // 4. Write blob if it doesn't exist
      await this.blobStorage.write(hashString, content);
    }

    // 5. Check if file already exists
    const existing = await this.repository.getNodeByPath(path);

    if (existing instanceof FileNode) {
      // Update existing file
      const oldHash = existing.getContentHash().toString();

      // Update file node
      existing.updateContent(contentHash, content.length);
      await this.repository.updateNode(existing);

      // Update blob references
      await this.repository.incrementBlobRefCount(hashString);
      const oldRefCount = await this.repository.decrementBlobRefCount(oldHash);

      // Delete old blob if no references
      if (oldRefCount === 0) {
        await this.blobStorage.delete(oldHash);
      }
    } else if (existing instanceof DirectoryNode) {
      throw new FileAlreadyExistsError(`Path is a directory: ${path}`);
    } else {
      // Create new file
      // Check parent directory exists
      const parentPath = path.substring(0, path.lastIndexOf("/")) || "/";
      const parent = await this.repository.getNodeByPath(parentPath);
      if (!parent) {
        throw new DirectoryNotFoundError(
          `Parent directory not found: ${parentPath}`
        );
      }

      // Create file node
      const mimeType = mime.lookup(path) || "application/octet-stream";
      const fileNode = new FileNode(
        filePath,
        contentHash,
        content.length,
        mimeType
      );
      await this.repository.createNode(fileNode);

      // Increment blob reference
      await this.repository.incrementBlobRefCount(hashString);
    }
  }
  async readFile(path: string): Promise<Buffer> {
    // 1. Get file node
    const node = await this.repository.getNodeByPath(path);

    // 2. Check if exists and is a file
    if (!node) {
      throw new FileNotFoundError(`File not found: ${path}`);
    }
    if (node instanceof DirectoryNode) {
      throw new FileNotFoundError(`Path is a directory: ${path}`);
    }

    // 3. Read blob content
    const contentHash = node.getContentHash().toString();
    return await this.blobStorage.read(contentHash);
  }

  async deleteFile(path: string): Promise<void> {
    // 1. Get file node
    const node = await this.repository.getNodeByPath(path);

    // 2. Check if exists and is a file
    if (!node) {
      throw new FileNotFoundError(`File not found: ${path}`);
    }
    if (node instanceof DirectoryNode) {
      throw new FileNotFoundError(`Path is a directory: ${path}`);
    }

    // 3. Delete from database
    await this.repository.deleteNode(path);

    // 4. Decrement blob reference
    const contentHash = node.getContentHash().toString();
    const refCount = await this.repository.decrementBlobRefCount(contentHash);

    // 5. Delete blob if no references
    if (refCount === 0) {
      await this.blobStorage.delete(contentHash);
    }
  }

  async deleteDirectory(path: string): Promise<void> {
    // 1. Get directory node
    const node = await this.repository.getNodeByPath(path);

    // 2. Check if exists and is directory
    if (!node) {
      throw new DirectoryNotFoundError(`Directory not found: ${path}`);
    }
    if (node instanceof FileNode) {
      throw new DirectoryNotFoundError(`Path is a file: ${path}`);
    }

    // 3. Check if directory is empty
    const children = await this.repository.listChildren(path);
    if (children.length > 0) {
      throw new DirectoryNotEmptyError(`Directory not empty: ${path}`);
    }

    // 4. Delete directory
    await this.repository.deleteNode(path);
  }

  async listDirectory(path: string): Promise<(FileNode | DirectoryNode)[]> {
    // 1. Get directory node
    const node = await this.repository.getNodeByPath(path);

    // 2. Check if exists and is directory
    if (!node) {
      throw new DirectoryNotFoundError(`Directory not found: ${path}`);
    }
    if (node instanceof FileNode) {
      throw new DirectoryNotFoundError(`Path is file: ${path}`);
    }

    // 3. List children
    return await this.repository.listChildren(path);
  }

  async getInfo(path: string): Promise<FileNode | DirectoryNode> {
    const node = await this.repository.getNodeByPath(path);
    if (!node) {
      throw new FileNotFoundError(`Path not found: ${path}`);
    }
    return node;
  }

  async copyFile(source: string, destination: string): Promise<void> {
    // 1. Read source file
    const content = await this.readFile(source);

    // 2. Write to destination
    await this.writeFile(destination, content);
  }

  async moveFile(source: string, destination: string): Promise<void> {
    // 1. Copy file
    await this.copyFile(source, destination);

    // 2. Delete source
    await this.deleteFile(source);
  }

  async setWorkingDirectory(path: string): Promise<void> {
    // DOTO: I'll implement this later
    throw new Error("Not implemented for now");
  }

  async getWorkingDirectory(): Promise<string> {
    // TODO: I'll implement this later
    return "/";
  }
}
