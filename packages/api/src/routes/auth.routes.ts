import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

export function createAuthRoutes(authController: AuthController): Router {
  const router = Router();

  router.post("/register", authController.register);
  router.post("/login", authController.login);

  return router;
}
