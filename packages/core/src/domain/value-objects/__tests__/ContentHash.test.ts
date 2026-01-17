import ContentHash from "../ContentHash";

describe("ContentHash", () => {
  describe("fromContent", () => {
    it("should generate SHA-256 hash from content", () => {
      // Arrange
      const content = Buffer.from("Hello World");

      // Act
      const hash = ContentHash.fromContent(content);

      // Assert
      expect(hash.toString()).toBe(
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
    });
  });

  describe("fromString", () => {
    it("should create hash from valid string", () => {
      const hashString =
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e";
      const hash = ContentHash.fromString(hashString);
      expect(hash.toString()).toBe(hashString);
    });

    it("should throw error for invalid hash format", () => {
      expect(() => ContentHash.fromString("invalid")).toThrow(
        "Invalid hash format",
      );
    });
  });

  describe("equals", () => {
    it("should return true for equal hashes", () => {
      const hash1 = ContentHash.fromString(
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
      const hash2 = ContentHash.fromString(
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
      expect(hash1.equals(hash2)).toBe(true);
    });

    it("should return false for different hashes", () => {
      const hash1 = ContentHash.fromString(
        "a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
      const hash2 = ContentHash.fromString(
        "b591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
      );
      expect(hash1.equals(hash2)).toBe(false);
    });
  });
});
