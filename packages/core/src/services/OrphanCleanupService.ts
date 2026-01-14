import { IMetadataRepository } from "../interfaces/IMetadataRepository";
import { IBlobStorage } from "../interfaces/IBlobStorage";

export class OrphanCleanupService {
  constructor(
    private repository: IMetadataRepository,
    private blobStorage: IBlobStorage
  ) {}

  /**
   * Clean up all orphaned blobs (with zero references)
   * @returns Number of blobs deleted
   */
  async cleanup(): Promise<number> {
    // 1. Get all orphaned blobs
    const orphanHashes = await this.repository.getOrphanBlobs();

    if (orphanHashes.length === 0) {
      return 0;
    }

    // 2. Delete all orphaned blobs
    await this.blobStorage.deleteMany(orphanHashes);

    // 3. Return count
    return orphanHashes.length;
  }

  /**
   * Clean up orphaned blobs in batches
   * Useful for very large numbers of orphans
   */
  async cleanupInBatches(batchSize: number = 1000): Promise<number> {
    let totalDeleted = 0;

    while (true) {
      const deleted = await this.cleanup();
      totalDeleted += deleted;

      if (deleted < batchSize) {
        // No more orphans
        break;
      }
    }

    return totalDeleted;
  }
}
