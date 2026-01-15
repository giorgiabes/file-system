import { Request, Response, NextFunction } from "express";
import {
  DomainError,
  FileNotFoundError,
  DirectoryNotFoundError,
  FileAlreadyExistsError,
  DirectoryNotEmptyError,
  InvalidPathError,
  InvalidHashError,
} from "@file-system/core/dist/domain/errors/FsErrors";
import { logger } from "../config/logger";

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  logger.error("Error:", {
    message: err.message,
    stack: err.stack,
    path: req.path,
  });

  // Domain errors (business logic errors)
  if (
    err instanceof FileNotFoundError ||
    err instanceof DirectoryNotFoundError
  ) {
    return res.status(404).json({ error: err.message });
  }

  if (err instanceof FileAlreadyExistsError) {
    return res.status(409).json({ error: err.message });
  }

  if (err instanceof DirectoryNotEmptyError) {
    return res.status(400).json({ error: err.message });
  }

  if (err instanceof InvalidPathError || err instanceof InvalidHashError) {
    return res.status(400).json({ error: err.message });
  }

  // Generic domain error
  if (err instanceof DomainError) {
    return res.status(400).json({ error: err.message });
  }

  // Unknown error
  return res.status(500).json({ error: "Internal server error" });
}
