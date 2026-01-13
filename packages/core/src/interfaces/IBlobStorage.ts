export interface IBlobStorage {
  /**
   * Write blob content to storage
   * @param contentHash - The hash identifying the blob
   * @param content - The actual content to store
   */
  write(contentHash: string, content: Buffer): Promise<void>;

  /**
   * Read blob content from storage
   * @param contentHash - The hash identifying the blob
   * @returns The blob content
   */
  read(contentHash: string): Promise<Buffer>;

  /**
   * Check if blob exists in storage
   * @param contentHash - The hash identifying the blob
   */
  exists(contentHash: string): Promise<boolean>;

  /**
   * Delete a blob from storage
   * @param contentHash - The hash identifying the blob
   */
  delete(contentHash: string): Promise<void>;

  /**
   * Delete multiple blobs from storage
   * @param contentHashes - Array of hashes to delete
   */
  deleteMany(contentHashes: string[]): Promise<void>;
}
