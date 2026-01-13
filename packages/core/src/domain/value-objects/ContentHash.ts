/**
 * File: ContentHash.ts
 *
 * Purpose: Represents a SHA-256 hash that identifies file content. Two
 * files with identical content will have same hash (this enables
 * deduplication)
 *
 * How it will be used:
 * // When uploading a file:
 * const content = Buffer.from("Hello World");
 * const hash = ContentHash.fromContent(content); // Calculates SHA-256
 *
 * // When reading from database:
 * const hash2 = ContentHash.fromString("a591a6d40bf420404a011733cfb7b190...");
 * // Check if two files are identical:
 * if (hash.equals(hash2)) {
 *  console.log("Same content! No need to store twice");
 * }
 */

import crypto from "crypto";

class ContentHash {
  private value: string;

  private constructor(hash: string) {
    this.value = hash;
  }

  static fromString(hash: string): ContentHash {
    if (!/^[a-f0-9]{64}$/.test(hash)) {
      throw new Error("Invalid hash format");
    }
    return new ContentHash(hash);
  }

  static fromContent(content: Buffer): ContentHash {
    const hash = crypto.createHash("sha256").update(content).digest("hex");
    return new ContentHash(hash);
  }

  toString(): string {
    return this.value;
  }

  equals(other: ContentHash): boolean {
    return this.value === other.value;
  }
}

export default ContentHash;
