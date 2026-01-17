import { Pool } from "pg";
import { IMetadataRepository } from "@file-system/core/dist/interfaces/IMetadataRepository";
import FileNode from "@file-system/core/dist/domain/entities/FileNode";
import DirectoryNode from "@file-system/core/dist/domain/entities/DirectoryNode";
import FilePath from "@file-system/core/dist/domain/value-objects/FilePath";
import ContentHash from "@file-system/core/dist/domain/value-objects/ContentHash";

export class PostgresRepository implements IMetadataRepository {
  private currentTenantId: string | null = null;

  constructor(private pool: Pool) {}

  setTenant(tenantId: string): void {
    this.currentTenantId = tenantId;
  }

  private ensureTenant(): string {
    if (!this.currentTenantId) {
      throw new Error("Tenant not set");
    }
    return this.currentTenantId;
  }

  async createNode(node: FileNode | DirectoryNode): Promise<void> {
    const tenantId = this.ensureTenant();
    const path = node.getPath().toString();
    const createdAt = node.getCreatedAt();
    const modifiedAt = node.getModifiedAt();

    if (node instanceof FileNode) {
      const contentHash = node.getContentHash().toString();
      const size = node.getSize();
      const mimeType = node.getMimeType();

      await this.pool.query(
        `
        INSERT INTO
        fs_nodes (tenant_id, path, type, content_hash, size, mime_type, created_at, modified_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        `,
        [
          tenantId,
          path,
          "file",
          contentHash,
          size,
          mimeType,
          createdAt,
          modifiedAt,
        ],
      );
    } else {
      await this.pool.query(
        `
        INSERT INTO fs_nodes (tenant_id, path, type, created_at, modified_at)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [tenantId, path, "directory", createdAt, modifiedAt],
      );
    }
  }

  async getNodeByPath(path: string): Promise<FileNode | DirectoryNode | null> {
    const tenantId = this.ensureTenant();

    const result = await this.pool.query(
      `
      SELECT path, type, content_hash, size, mime_type, created_at, modified_at
      FROM fs_nodes
      WHERE tenant_id = $1 AND path = $2
      `,
      [tenantId, path],
    );

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    const filePath = FilePath.create(row.path);

    if (row.type === "file") {
      const contentHash = ContentHash.fromString(row.content_hash);
      const fileNode = new FileNode(
        filePath,
        contentHash,
        row.size,
        row.mime_type,
      );

      (fileNode as any).createdAt = row.created_at;
      (fileNode as any).modifiedAt = row.modified_at;

      return fileNode;
    } else {
      const dirNode = new DirectoryNode(filePath);

      (dirNode as any).createdAt = row.created_at;
      (dirNode as any).modifiedAt = row.modified_at;

      return dirNode;
    }
  }

  async updateNode(node: FileNode | DirectoryNode): Promise<void> {
    const tenantId = this.ensureTenant();
    const path = node.getPath().toString();
    const modifiedAt = node.getModifiedAt();

    if (node instanceof FileNode) {
      const contentHash = node.getContentHash().toString();
      const size = node.getSize();
      const mimeType = node.getMimeType();

      await this.pool.query(
        `
        UPDATE fs_nodes 
        SET content_hash = $1, size = $2, mime_type = $3, modified_at = $4
        WHERE tenant_id = $5 AND path = $6
        `,
        [contentHash, size, mimeType, modifiedAt, tenantId, path],
      );
    } else {
      await this.pool.query(
        `
        UPDATE fs_nodes 
        SET modified_at = $1
        WHERE tenant_id = $2 AND path = $3
        `,
        [modifiedAt, tenantId, path],
      );
    }
  }

  async deleteNode(path: string): Promise<void> {
    const tenantId = this.ensureTenant();
    await this.pool.query(
      `
      DELETE FROM fs_nodes WHERE tenant_id = $1 AND path = $2
      `,
      [tenantId, path],
    );
  }

  async listChildren(
    directoryPath: string,
  ): Promise<(FileNode | DirectoryNode)[]> {
    const tenantId = this.ensureTenant();
    const pattern = directoryPath === "/" ? "/%" : `${directoryPath}/%`;
    const depth =
      directoryPath === "/" ? 1 : (directoryPath.match(/\//g) || []).length + 1;

    const result = await this.pool.query(
      `
      SELECT path, type, content_hash, size, mime_type, created_at, modified_at
      FROM fs_nodes
      WHERE tenant_id = $1 
        AND path LIKE $2
        AND path != $3
        AND (LENGTH(path) - LENGTH(REPLACE(path, '/', ''))) = $4
      ORDER BY type DESC, path ASC
      `,
      [tenantId, pattern, directoryPath, depth],
    );

    const nodes: (FileNode | DirectoryNode)[] = [];

    for (const row of result.rows) {
      const filePath = FilePath.create(row.path);

      if (row.type === "file") {
        const contentHash = ContentHash.fromString(row.content_hash);
        const fileNode = new FileNode(
          filePath,
          contentHash,
          row.size,
          row.mime_type,
        );
        (fileNode as any).createdAt = row.created_at;
        (fileNode as any).modifiedAt = row.modified_at;
        nodes.push(fileNode);
      } else {
        const dirNode = new DirectoryNode(filePath);
        (dirNode as any).createdAt = row.created_at;
        (dirNode as any).modifiedAt = row.modified_at;
        nodes.push(dirNode);
      }
    }

    return nodes;
  }

  async incrementBlobRefCount(contentHash: string): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO blobs (content_hash, reference_count, size, created_at, last_accessed_at)
      VALUES ($1, 1, 0, NOW(), NOW())
      ON CONFLICT (content_hash) 
      DO UPDATE SET 
        reference_count = blobs.reference_count + 1,
        last_accessed_at = NOW()
      `,
      [contentHash],
    );
  }

  async decrementBlobRefCount(contentHash: string): Promise<number> {
    const client = await this.pool.connect();

    try {
      await client.query("BEGIN");

      const result = await client.query(
        `
        UPDATE blobs 
        SET reference_count = reference_count - 1,
            last_accessed_at = NOW()
        WHERE content_hash = $1
        RETURNING reference_count
        `,
        [contentHash],
      );

      await client.query("COMMIT");

      if (result.rows.length === 0) {
        return 0;
      }

      return result.rows[0].reference_count;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getOrphanBlobs(): Promise<string[]> {
    const result = await this.pool.query(
      `
      SELECT content_hash 
      FROM blobs 
      WHERE reference_count = 0
      ORDER BY last_accessed_at ASC
      LIMIT 1000
      `,
    );
    return result.rows.map((row) => row.content_hash);
  }
}
