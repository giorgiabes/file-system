import { OrphanCleanupService } from "../OrphanCleanupService";
import { IMetadataRepository } from "../../interfaces/IMetadataRepository";
import { IBlobStorage } from "../../interfaces/IBlobStorage";

class MockRepository implements IMetadataRepository {
  private orphanBlobs: string[] = [];

  setTenant(tenantId: string): void {}
  async createNode(): Promise<void> {}
  async getNodeByPath(): Promise<null> {
    return null;
  }
  async updateNode(): Promise<void> {}
  async deleteNode(): Promise<void> {}
  async listChildren(): Promise<[]> {
    return [];
  }
  async incrementBlobRefCount(): Promise<void> {}
  async decrementBlobRefCount(): Promise<number> {
    return 0;
  }

  async getOrphanBlobs(): Promise<string[]> {
    const result = [...this.orphanBlobs];
    this.orphanBlobs = [];
    return result;
  }

  // Test helper
  setOrphanBlobs(blobs: string[]) {
    this.orphanBlobs = blobs;
  }
}

class MockBlobStorage implements IBlobStorage {
  private blobs = new Set<string>();

  async write(hash: string): Promise<void> {
    this.blobs.add(hash);
  }

  async read(): Promise<Buffer> {
    return Buffer.from("");
  }
  async exists(hash: string): Promise<boolean> {
    return this.blobs.has(hash);
  }

  async delete(hash: string): Promise<void> {
    this.blobs.delete(hash);
  }

  async deleteMany(hashes: string[]): Promise<void> {
    hashes.forEach((hash) => this.blobs.delete(hash));
  }

  // Test helper
  getBlobCount(): number {
    return this.blobs.size;
  }

  addBlob(hash: string): void {
    this.blobs.add(hash);
  }
}

describe("OrphanCleanupService", () => {
  let service: OrphanCleanupService;
  let repository: MockRepository;
  let blobStorage: MockBlobStorage;

  beforeEach(() => {
    repository = new MockRepository();
    blobStorage = new MockBlobStorage();
    service = new OrphanCleanupService(repository, blobStorage);
  });

  describe("cleanup", () => {
    it("should delete orphaned blobs", async () => {
      // Arrange: Add orphan blobs
      blobStorage.addBlob("orphan1");
      blobStorage.addBlob("orphan2");
      blobStorage.addBlob("orphan3");
      repository.setOrphanBlobs(["orphan1", "orphan2", "orphan3"]);

      expect(blobStorage.getBlobCount()).toBe(3);

      // Act: Run cleanup
      const deletedCount = await service.cleanup();

      // Assert: All orphans deleted
      expect(deletedCount).toBe(3);
      expect(blobStorage.getBlobCount()).toBe(0);
    });

    it("should return 0 when no orphans exist", async () => {
      repository.setOrphanBlobs([]);

      const deletedCount = await service.cleanup();

      expect(deletedCount).toBe(0);
    });

    it("should handle large number of orphans", async () => {
      // Create 5000 orphan blobs
      const orphans: string[] = [];
      for (let i = 0; i < 5000; i++) {
        const hash = `orphan${i}`;
        orphans.push(hash);
        blobStorage.addBlob(hash);
      }
      repository.setOrphanBlobs(orphans);

      const deletedCount = await service.cleanup();

      expect(deletedCount).toBe(5000);
      expect(blobStorage.getBlobCount()).toBe(0);
    });
  });

  describe("cleanupInBatches", () => {
    it("should cleanup in multiple batches", async () => {
      // Add 2500 orphans
      const orphans: string[] = [];
      for (let i = 0; i < 2500; i++) {
        const hash = `orphan${i}`;
        orphans.push(hash);
        blobStorage.addBlob(hash);
      }
      repository.setOrphanBlobs(orphans);

      const totalDeleted = await service.cleanupInBatches(1000);

      expect(totalDeleted).toBe(2500);
    });
  });
});
