/**
 * File: FsErrors.ts
 *
 * Custom error type for domain
 *
 * Specific errors (all extend DomainError):
 *  * FileNotFoundError      - when file doesn't exist
 *  * DirectoryNotFoundError - when directory doesn't exist
 *  * FileAlreadyExistsError - when trying to create file that exists
 *  * DirectoryNotEmptyError - when trying to delete non-empty directory
 *  * InvalidPathError       - when path format is invalid
 *  * InvalidHashError       - when hash format is invalid
 */

/**
 * All extend DomainError
 */
export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DomainError";
  }
}

/**
 * When file doesn't exist
 */
export class FileNotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "FileNotFoundError";
  }
}

/**
 * When directory doesn't exist
 */
export class DirectoryNotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "DirectoryNotFoundError";
  }
}

/**
 * When Trying to create file that exists
 */
export class FileAlreadyExistsError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "FileAlreadyExistsError";
  }
}

/**
 * When Trying to delete non-empty directory
 */
export class DirectoryNotEmptyError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "DirectoryNotEmptyError";
  }
}

/**
 * When path format is invalid
 */
export class InvalidPathError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidPathError";
  }
}

/**
 * When hash format is invalid
 */
export class InvalidHashError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = "InvalidHashError";
  }
}
