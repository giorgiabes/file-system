import FileNode from "../domain/entities/FileNode";
import DirectoryNode from "../domain/entities/DirectoryNode";

export interface IMetadataRepository {
  /**
   * Set the current tenant context for all operations
   */
  setTenant(tenantId: string): void;

  /**
   * Create a new file or directory node
   */
  createNode(node: FileNode | DirectoryNode): Promise<void>;

  /**
   * Get a node (file or directory) by its path
   * @returns The node, or null if not found
   */
  getNodeByPath(path: string): Promise<FileNode | DirectoryNode | null>;

  /**
   * Update an existing node
   */
  updateNode(node: FileNode | DirectoryNode): Promise<void>;

  /**
   * Delete a node by path
   */
  deleteNode(path: string): Promise<void>;

  /**
   * List all children of a directory
   * @param directoryPath - Path to the directory
   * @returns Array of child nodes
   */
  listChildren(directoryPath: string): Promise<(FileNode | DirectoryNode)[]>;

  /**
   * Increment reference count for a blob
   * @param contentHash - The blob's hash
   */
  incrementBlobRefCount(contentHash: string): Promise<void>;

  /**
   * Decrement reference count for a blob
   * @param contentHash - The blob's hash
   * @returns The new reference count
   */
  decrementBlobRefCount(contentHash: string): Promise<number>;

  /**
   * Get all blobs with zero references (orphaned blobs)
   * @returns Array of content hashes
   */
  getOrphanBlobs(): Promise<string[]>;
}
