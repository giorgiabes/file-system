import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Interceptor - runs before EVERY request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface FileItem {
  name: string;
  path: string;
  type: "file" | "dictionary";
  size: number;
  contentHash?: string; // Optional - only files have this
  createdAt: string;
  modifiedAt: string;
}

export interface AuthResponse {
  message: string;
  token: string;
  user: {
    id: string;
    email: string;
    tenantId: string;
  };
}

// Auth
export const register = (email: string, password: string, name?: string) =>
  api.post<AuthResponse>("/api/auth/register", { email, password, name });

export const login = (email: string, password: string) =>
  api.post<AuthResponse>("/api/auth/login", { email, password });

// Files
export const uploadFile = (path: string, content: string) =>
  api.post("/api/fs/files", { path, content });

export const downloadFile = (path: string) =>
  api.get<{ path: string; content: string; size: number }>("/api/fs/files", {
    params: { path },
  });

export const deleteFile = (path: string) =>
  api.delete("/api/fs/files", { params: { path } });

export const copyFile = (source: string, destination: string) =>
  api.post("/api/fs/files/copy", { source, destination });

export const moveFile = (source: string, destination: string) =>
  api.post("/api/fs/files/move", { source, destination });

// Directories
export const createDirectory = (path: string) =>
  api.post("/api/fs/directories", { path });

export const listDirectory = (path: string) =>
  api.get<{ path: string; items: FileItem[]; count: number }>(
    "/api/fs/directories",
    { params: { path } }
  );

export const deleteDirectory = (path: string) =>
  api.delete("/api/fs/directories", { params: { path } });

// Info
export const getInfo = (path: string) =>
  api.get<FileItem>("/api/fs/info", { params: { path } });

export default api;
