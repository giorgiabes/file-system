/**
 * Defines all file system operations (like a traditional
 * filesystem API)
 */
import FileNode from "../domain/entities/FileNode";
import DirectoryNode from "../domain/entities/DirectoryNode";

export interface IFsProvider {
  // Directory operations
  createDirectory(path: string): Promise<void>;
  deleteDirectory(path: string): Promise<void>;
  listDirectory(path: string): Promise<(FileNode | DirectoryNode)[]>;

  // File operations
  writeFile(path: string, content: Buffer): Promise<void>;
  readFile(path: string): Promise<Buffer>;
  deleteFile(path: string): Promise<void>;
  copyFile(source: string, destination: string): Promise<void>;
  moveFile(source: string, destination: string): Promise<void>;

  // Info operations
  getInfo(path: string): Promise<FileNode | DirectoryNode>;

  // Working directory
  setWorkingDirectory(path: string): Promise<void>;
  getWorkingDirectory(): Promise<string>;
}
