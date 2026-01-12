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
