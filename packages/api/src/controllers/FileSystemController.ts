/**
 * FileSystemController handles all file system operations
 * (upload, download, delete, etc.)
 */
import { Request, Response, NextFunction } from "express";
import { IFsProvider } from "@file-system/core/dist/interfaces/IFsProvider";
import FileNode from "@file-system/core/dist/domain/entities/FileNode";

export class FileSystemController {
  constructor(private fsService: IFsProvider) {}

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path, content } = req.body;

      if (!path || !content) {
        return res.status(400).json({ error: "Path and content required" });
      }

      const buffer = Buffer.from(content, "base64");
      await this.fsService.writeFile(path, buffer);

      res.json({
        message: "File uploaded successfully",
        path,
      });
    } catch (error) {
      next(error);
    }
  };

  downloadFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "Path required" });
      }

      const content = await this.fsService.readFile(path);

      res.json({
        path,
        content: content.toString("base64"),
        size: content.length,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "Path required" });
      }

      await this.fsService.deleteFile(path);

      res.json({ message: "File deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  createDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.body;

      if (!path) {
        return res.status(400).json({ error: "Path required" });
      }

      await this.fsService.createDirectory(path);

      res.json({
        message: "Directory created successfully",
        path,
      });
    } catch (error) {
      next(error);
    }
  };

  listDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "Path required" });
      }

      const items = await this.fsService.listDirectory(path);

      const result = items.map((item) => ({
        name: item.getPath().toString().split("/").pop() || "/",
        path: item.getPath().toString(),
        type: item instanceof FileNode ? "file" : "directory",
        size: item instanceof FileNode ? item.getSize() : 0,
        contentHash:
          item instanceof FileNode
            ? item.getContentHash().toString()
            : undefined,
        mimeType: item instanceof FileNode ? item.getMimeType() : undefined,
        createdAt: item.getCreatedAt(),
        modifiedAt: item.getModifiedAt(),
      }));

      res.json({
        path,
        items: result,
        count: result.length,
      });
    } catch (error) {
      next(error);
    }
  };

  deleteDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "Path required" });
      }

      await this.fsService.deleteDirectory(path);

      res.json({ message: "Directory deleted successfully" });
    } catch (error) {
      next(error);
    }
  };

  getInfo = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { path } = req.query;

      if (!path || typeof path !== "string") {
        return res.status(400).json({ error: "Path required" });
      }

      const item = await this.fsService.getInfo(path);

      const result = {
        name: item.getPath().toString().split("/").pop() || "/",
        path: item.getPath().toString(),
        type: item instanceof FileNode ? "file" : "directory",
        size: item instanceof FileNode ? item.getSize() : 0,
        contentHash:
          item instanceof FileNode
            ? item.getContentHash().toString()
            : undefined,
        mimeType: item instanceof FileNode ? item.getMimeType() : undefined,
        createdAt: item.getCreatedAt(),
        modifiedAt: item.getModifiedAt(),
      };

      res.json(result);
    } catch (error) {
      next(error);
    }
  };

  copyFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source, destination } = req.body;

      if (!source || !destination) {
        return res
          .status(400)
          .json({ error: "Source and destination required" });
      }

      await this.fsService.copyFile(source, destination);

      res.json({ message: "File copied successfully" });
    } catch (error) {
      next(error);
    }
  };

  moveFile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source, destination } = req.body;

      if (!source || !destination) {
        return res
          .status(400)
          .json({ error: "Source and destination required" });
      }

      await this.fsService.moveFile(source, destination);

      res.json({ message: "File moved successfully" });
    } catch (error) {
      next(error);
    }
  };
  copyDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source, destination } = req.body;

      if (!source || !destination) {
        return res
          .status(400)
          .json({ error: "Source and destination required" });
      }

      await this.fsService.copyDirectory(source, destination);

      res.json({ message: "Directory copied successfully" });
    } catch (error) {
      next(error);
    }
  };

  moveDirectory = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { source, destination } = req.body;

      if (!source || !destination) {
        return res
          .status(400)
          .json({ error: "Source and destination required" });
      }

      await this.fsService.moveDirectory(source, destination);

      res.json({ message: "Directory moved successfully" });
    } catch (error) {
      next(error);
    }
  };
}
