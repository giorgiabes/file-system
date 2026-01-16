import express from "express";
import helmet from "helmet";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";

// Core
import { FileSystemService } from "@file-system/core/dist/services/FileSystemService";

// Infrastructure
import { PostgresRepository } from "@file-system/infrastructure/dist/metadata/PostgresRepository";
import { LocalBlobStorage } from "@file-system/infrastructure/dist/storage/LocalBlobStorage";

// API
import { createDatabasePool } from "./config/database";
import { logger } from "./config/logger";
import { authMiddleware } from "./middleware/auth";
import { createTenantMiddleware } from "./middleware/tenant";
import { errorHandler } from "./middleware/errorHandler";
import { AuthController } from "./controllers/AuthController";
import { FileSystemController } from "./controllers/FileSystemController";
import { createAuthRoutes } from "./routes/auth.routes";
import { createFsRoutes } from "./routes/fs.routes";

// Load environment variables
dotenv.config({ path: path.join(__dirname, "../../../.env") });

// ===== Dependency Injection =====

// 1. Create infrastructure
const databasePool = createDatabasePool();
const repository = new PostgresRepository(databasePool);
const blobStorage = new LocalBlobStorage(
  process.env.BLOB_STORAGE_PATH || "./blobs"
);

// 2. Create services
const fileSystemService = new FileSystemService(repository, blobStorage);

// 3. Create controllers
const authController = new AuthController(databasePool);
const fsController = new FileSystemController(fileSystemService);

// ===== Express Setup =====

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || "*", credentials: true }));
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ extended: true, limit: "100mb" }));

// Health check (public)
app.get("/health", async (req, res) => {
  try {
    await databasePool.query("SELECT 1");
    res.json({
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
    });
  } catch (error) {
    res.status(503).json({
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      database: "disconnected",
    });
  }
});

// Public routes (no auth)
app.use("/api/auth", createAuthRoutes(authController));

// Protected routes (require auth)
app.use(authMiddleware);
app.use(createTenantMiddleware(repository));
app.use("/api/fs", createFsRoutes(fsController));

// Error handling (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);
  logger.info(`Environment: ${process.env.NODE_ENV || "development"}`);
  logger.info(`Database: Connected`);
  logger.info(`Blob storage: ${process.env.BLOB_STORAGE_PATH || "./blobs"}`);
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  logger.info("SIGTERM received, shutting down gracefully");
  await databasePool.end();
  process.exit(0);
});
