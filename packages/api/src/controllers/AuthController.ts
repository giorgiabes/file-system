import { Request, Response } from "express";
import { Pool } from "pg";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";

export class AuthController {
  constructor(private pool: Pool) {}

  register = async (req: Request, res: Response) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      // Check if user exists
      const existingUser = await this.pool.query(
        "SELECT id FROM users WHERE email = $1",
        [email]
      );

      if (existingUser.rows.length > 0) {
        return res.status(409).json({ error: "User already exists" });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create tenant
      const tenantId = crypto.randomUUID();
      const tenantName = name || email.split("@")[0];

      await this.pool.query("INSERT INTO tenants (id, name) VALUES ($1, $2)", [
        tenantId,
        tenantName,
      ]);

      // Create root directory for tenant
      await this.pool.query(
        "INSERT INTO fs_nodes (tenant_id, path, type) VALUES ($1, $2, $3)",
        [tenantId, "/", "directory"]
      );

      // Create user
      const userId = crypto.randomUUID();
      await this.pool.query(
        "INSERT INTO users (id, email, password_hash, tenant_id) VALUES ($1, $2, $3, $4)",
        [userId, email, passwordHash, tenantId]
      );

      // Generate JWT
      const token = jwt.sign(
        { userId, tenantId, email, role: "admin" },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      res.status(201).json({
        message: "User registered successfully",
        token,
        user: { id: userId, email, tenantId },
      });
    } catch (error: any) {
      console.error("Registration error:", error);
      res.status(500).json({ error: "Registration failed" });
    }
  };

  login = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password required" });
    }

    try {
      // Find user
      const result = await this.pool.query(
        "SELECT id, email, password_hash, tenant_id FROM users WHERE email = $1",
        [email]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      const user = result.rows[0];

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);

      if (!validPassword) {
        return res.status(401).json({ error: "Invalid credentials" });
      }

      // Generate JWT
      const token = jwt.sign(
        {
          userId: user.id,
          tenantId: user.tenant_id,
          email: user.email,
          role: "admin",
        },
        process.env.JWT_SECRET || "secret",
        { expiresIn: "7d" }
      );

      res.json({
        message: "Login successful",
        token,
        user: { id: user.id, email: user.email, tenantId: user.tenant_id },
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Login failed" });
    }
  };
}
