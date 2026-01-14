import { IBlobStorage } from "@file-system/core/dist/interfaces/IBlobStorage";
import * as fs from "fs/promises";
import * as path from "path";

export class LocalBlobStorage implements IBlobStorage {
  constructor(private basePath: string) {}

  private getFilePath(contentHash: string): string {
    // Shard: abc123... -> /blobs/ab/c1/abc123...
    const dir1 = contentHash.substring(0, 2);
    const dir2 = contentHash.substring(2, 4);
    return path.join(this.basePath, dir1, dir2, contentHash);
  }

  async write(contentHash: string, content: Buffer): Promise<void> {
    const filePath = this.getFilePath(contentHash);

    // Create parent directories if thy don't exist
    // Gets the directory path (e.g., /blobs/ab/c1)
    const dir = path.dirname(filePath);
    // Creates all parent directories (like mkdir -p)
    await fs.mkdir(dir, { recursive: true });

    // Write the file
    await fs.writeFile(filePath, content);
  }

  async read(contentHash: string): Promise<Buffer> {
    const filePath = this.getFilePath(contentHash);
    return await fs.readFile(filePath);
  }

  async exists(contentHash: string): Promise<boolean> {
    const filePath = this.getFilePath(contentHash);
    try {
      await fs.access(filePath); // check if file exists (throws error if not)
      return true;
    } catch (error) {
      return false;
    }
  }

  async delete(contentHash: string): Promise<void> {
    const filePath = this.getFilePath(contentHash);
    try {
      await fs.unlink(filePath);
    } catch (error: any) {
      // Ignore error if file doesn't exist
      if (error.code !== "ENOENT") {
        throw error;
      }
    }
  }

  async deleteMany(contentHashes: string[]): Promise<void> {
    // Delete all blobs in parallel
    await Promise.all(contentHashes.map((hash) => this.delete(hash)));
  }
}
