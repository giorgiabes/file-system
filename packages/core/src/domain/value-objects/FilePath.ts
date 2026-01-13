/**
 * File: FilePath.ts
 *
 * Purpose: Validates and represents file path.
 */

class FilePath {
  private value: string;

  private constructor(path: string) {
    this.value = path;
  }

  static create(path: string): FilePath {
    if (!path.startsWith("/")) {
      throw new Error("Path must be absolute (sart with /)");
    }
    if (path.includes("..")) {
      throw new Error("Path cannot contain .. (directory traversal");
    }
    if (path.includes("\0")) {
      throw new Error("Path cannot contain null bytes");
    }
    return new FilePath(path);
  }

  toString(): string {
    return this.value;
  }

  equals(other: FilePath): boolean {
    return this.value === other.value;
  }
}

export default FilePath;
