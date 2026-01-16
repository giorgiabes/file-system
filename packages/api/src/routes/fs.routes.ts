import { Router } from "express";
import { FileSystemController } from "../controllers/FileSystemController";

export function createFsRoutes(fsController: FileSystemController): Router {
  const router = Router();

  // File operations
  router.post("/files", fsController.uploadFile);
  router.get("/files", fsController.downloadFile);
  router.delete("/files", fsController.deleteFile);
  router.post("/files/copy", fsController.copyFile);
  router.post("/files/move", fsController.moveFile);

  // Directory operations
  router.post("/directories", fsController.createDirectory);
  router.get("/directories", fsController.listDirectory);
  router.delete("/directories", fsController.deleteDirectory);

  // Info
  router.get("/info", fsController.getInfo);

  return router;
}
