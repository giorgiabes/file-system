import { FileSystemService } from "../FileSystemService";
import { IMetadataRepository } from "../../interfaces/IMetadataRepository";
import { IBlobStorage } from "../../interfaces/IBlobStorage";
import FileNode from "../../domain/entities/FileNode";
import DirectoryNode from "../../domain/entities/DirectoryNode";
import FilePath from "../../domain/value-objects/FilePath";
import ContentHash from "../../domain/value-objects/ContentHash";
import {
  FileNotFoundError,
  DirectoryNotFoundError,
} from "../../domain/errors/FsErrors";

// Mock implementations
class MockRepository implements IMetadataRepository {
  private nodes = new Map<string, FileNode | DirectoryNode>();
  private tenantId = "test-tenant";

  setTenant(tenantId: string): void {
    this.tenantId = tenantId;
  }

  async createNode(node: FileNode | DirectoryNode): Promise<void> {
    this.nodes.set(node.getPath().toString(), node);
  }

  async getNodeByPath(path: string): Promise<FileNode | DirectoryNode | null> {
    return this.nodes.get(path) || null;
  }

  async updateNode(node: FileNode | DirectoryNode): Promise<void> {
    this.nodes.set(node.getPath().toString(), node);
  }

  async deleteNode(path: string): Promise<void> {
    this.nodes.delete(path);
  }

  async listChildren(
    directoryPath: string,
  ): Promise<(FileNode | DirectoryNode)[]> {
    const children: (FileNode | DirectoryNode)[] = [];
    const prefix = directoryPath === "/" ? "/" : directoryPath + "/";

    for (const [path, node] of this.nodes.entries()) {
      if (path.startsWith(prefix) && path !== directoryPath) {
        // Count slashes to get depth
        const pathDepth = (path.match(/\//g) || []).length;
        const expectedDepth =
          directoryPath === "/"
            ? 1
            : (directoryPath.match(/\//g) || []).length + 1;

        if (pathDepth === expectedDepth) {
          children.push(node);
        }
      }
    }
    return children;
  }

  async incrementBlobRefCount(contentHash: string): Promise<void> {}
  async decrementBlobRefCount(contentHash: string): Promise<number> {
    return 0;
  }
  async getOrphanBlobs(): Promise<string[]> {
    return [];
  }
}

class MockBlobStorage implements IBlobStorage {
  private blobs = new Map<string, Buffer>();

  async write(contentHash: string, content: Buffer): Promise<void> {
    this.blobs.set(contentHash, content);
  }

  async read(contentHash: string): Promise<Buffer> {
    const blob = this.blobs.get(contentHash);
    if (!blob) throw new Error("Blob not found");
    return blob;
  }

  async exists(contentHash: string): Promise<boolean> {
    return this.blobs.has(contentHash);
  }

  async delete(contentHash: string): Promise<void> {
    this.blobs.delete(contentHash);
  }

  async deleteMany(contentHashes: string[]): Promise<void> {
    contentHashes.forEach((hash) => this.blobs.delete(hash));
  }
}

describe("FileSystemService", () => {
  let service: FileSystemService;
  let repository: MockRepository;
  let blobStorage: MockBlobStorage;

  beforeEach(() => {
    repository = new MockRepository();
    blobStorage = new MockBlobStorage();
    service = new FileSystemService(repository, blobStorage);
    repository.setTenant("test-tenant");
  });

  describe("createDirectory", () => {
    it("should create root directory", async () => {
      await service.createDirectory("/");
      const node = await repository.getNodeByPath("/");
      expect(node).toBeInstanceOf(DirectoryNode);
    });

    it("should create nested directory when parent exists", async () => {
      await service.createDirectory("/");
      await service.createDirectory("/documents");
      const node = await repository.getNodeByPath("/documents");
      expect(node).toBeInstanceOf(DirectoryNode);
    });

    it("should throw error when parent does not exist", async () => {
      await expect(
        service.createDirectory("/documents/photos"),
      ).rejects.toThrow(DirectoryNotFoundError);
    });
  });

  describe("writeFile and readFile", () => {
    it("should write and read file", async () => {
      await service.createDirectory("/");
      const content = Buffer.from("Hello World");

      await service.writeFile("/test.txt", content);
      const readContent = await service.readFile("/test.txt");

      expect(readContent.toString()).toBe("Hello World");
    });

    it("should throw error when reading non-existent file", async () => {
      await expect(service.readFile("/nonexistent.txt")).rejects.toThrow(
        FileNotFoundError,
      );
    });
  });

  describe("deleteFile", () => {
    it("should delete existing file", async () => {
      await service.createDirectory("/");
      await service.writeFile("/test.txt", Buffer.from("test"));
      await service.deleteFile("/test.txt");

      await expect(service.readFile("/test.txt")).rejects.toThrow(
        FileNotFoundError,
      );
    });
  });

  describe("listDirectory", () => {
    it("should list directory contents", async () => {
      await service.createDirectory("/");
      await service.writeFile("/file1.txt", Buffer.from("content1"));
      await service.writeFile("/file2.txt", Buffer.from("content2"));
      await service.createDirectory("/folder");

      const items = await service.listDirectory("/");

      expect(items.length).toBe(3);
    });
  });

  describe("copyFile", () => {
    it("should copy file to new location", async () => {
      await service.createDirectory("/");
      await service.writeFile("/original.txt", Buffer.from("content"));
      await service.copyFile("/original.txt", "/copy.txt");

      const originalContent = await service.readFile("/original.txt");
      const copiedContent = await service.readFile("/copy.txt");

      expect(copiedContent.toString()).toBe(originalContent.toString());
    });
  });

  describe("moveFile", () => {
    it("should move file to new location", async () => {
      await service.createDirectory("/");
      const content = Buffer.from("content");
      await service.writeFile("/original.txt", content);

      // Get hash before moving
      const originalNode = (await repository.getNodeByPath(
        "/original.txt",
      )) as FileNode;
      const hash = originalNode.getContentHash().toString();

      await service.moveFile("/original.txt", "/moved.txt");

      // Original should not exist
      const originalExists = await repository.getNodeByPath("/original.txt");
      expect(originalExists).toBeNull();

      // Moved file should exist with same hash
    });
  });
});
