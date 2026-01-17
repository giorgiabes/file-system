import FilePath from "../FilePath";

describe("FilePath", () => {
  describe("create", () => {
    it("should create valid absolute path", () => {
      const path = FilePath.create("/documents/file.txt");
      expect(path.toString()).toBe("/documents/file.txt");
    });

    it("should throw error for relative path", () => {
      expect(() => FilePath.create("documents/file.txt")).toThrow(
        "Path must be absolute (sart with /)",
      );
    });

    it("should throw error for path with ..", () => {
      expect(() => FilePath.create("/documents/../secrets")).toThrow(
        "Path cannot contain .. (directory traversal",
      );
    });

    it("should throw error for path with null byte", () => {
      expect(() => FilePath.create("/documents/file\0.txt")).toThrow(
        "Path cannot contain null bytes",
      );
    });

    it("should accept root path", () => {
      const path = FilePath.create("/");
      expect(path.toString()).toBe("/");
    });
  });

  describe("equals", () => {
    it("should return true for equal paths", () => {
      const path1 = FilePath.create("/documents/file.txt");
      const path2 = FilePath.create("/documents/file.txt");
      expect(path1.equals(path2)).toBe(true);
    });

    it("should return false for different paths", () => {
      const path1 = FilePath.create("/documents/file1.txt");
      const path2 = FilePath.create("/documents/file2.txt");
      expect(path1.equals(path2)).toBe(false);
    });
  });
});
