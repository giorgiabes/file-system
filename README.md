# Content-Addressable File Storage System

A production-ready multi-tenant file storage system with intelligent content deduplication, built using Domain-Driven Design principles and TypeScript.

## 🎯 Overview

This project implements a cloud file system similar to Dropbox, but with a unique approach to storage optimization. Using content-addressable storage (SHA-256 hashing), the system stores identical files only once, regardless of how many users upload them - saving up to 90% of storage space.

**Key Innovation:** If 10 users upload the same document, it's stored once on disk. Only metadata differs.

## ✨ Features

### Core Functionality

- ✅ **Content Deduplication** - SHA-256 based storage (like Git internally)
- ✅ **Multi-tenant Isolation** - Complete data separation between users
- ✅ **JWT Authentication** - Secure token-based auth with bcrypt password hashing
- ✅ **Reference Counting** - Automatic garbage collection for orphaned blobs
- ✅ **File Operations** - Upload, download, delete, copy, move
- ✅ **Directory Management** - Create, delete, copy, move (recursive)
- ✅ **MIME Type Detection** - Automatic file type identification
- ✅ **Scalable Architecture** - Sharded blob storage, indexed database

### Technical Highlights

- 🏗️ **Domain-Driven Design** - Clean separation: Core → Infrastructure → API
- 🔌 **Pluggable Storage** - Swap PostgreSQL for MongoDB, local storage for S3
- 🎨 **Full-stack TypeScript** - Type safety across entire application
- 📦 **Monorepo Structure** - Organized workspace packages
- 🔒 **Security First** - SQL injection prevention, tenant isolation, secure auth

## 🏛️ Architecture

### Layered Architecture (DDD)

```
┌─────────────────────────────────────────────┐
│            API Layer (Express)              │
│  Controllers, Middleware, Routes, Auth      │
└─────────────────┬───────────────────────────┘
                  │ depends on
┌─────────────────▼───────────────────────────┐
│         Infrastructure Layer                │
│  PostgresRepository, LocalBlobStorage       │
└─────────────────┬───────────────────────────┘
                  │ implements
┌─────────────────▼───────────────────────────┐
│          Core Domain Layer                  │
│  Entities, Value Objects, Services          │
│  (No framework dependencies)                │
└─────────────────────────────────────────────┘
```

### Project Structure

```
file-system/
├── packages/
│   ├── core/                    # Domain logic (725 lines)
│   │   ├── domain/
│   │   │   ├── value-objects/   # ContentHash, FilePath, TenantId
│   │   │   ├── entities/        # FileNode, DirectoryNode
│   │   │   └── errors/          # Custom domain errors
│   │   ├── interfaces/          # IFsProvider, IMetadataRepository, IBlobStorage
│   │   └── services/            # FileSystemService, OrphanCleanupService
│   │
│   ├── infrastructure/          # Data access (445 lines)
│   │   ├── metadata/            # PostgresRepository, migrations
│   │   └── storage/             # LocalBlobStorage (sharded)
│   │
│   ├── api/                     # HTTP layer (587 lines)
│   │   ├── controllers/         # AuthController, FileSystemController
│   │   ├── middleware/          # auth, tenant, errorHandler
│   │   ├── routes/              # Route definitions
│   │   └── server.ts            # Main application
│   │
│   └── frontend/                # UI layer (842 lines)
│       ├── pages/               # Login, Register, FileBrowser
│       ├── services/            # API client
│       └── styles/              # CSS
│
├── blobs/                       # Content-addressable storage
│   └── [ab]/[c1]/[hash]        # Sharded by first 4 chars
└── .env                         # Environment configuration
```

## 🔑 Key Concepts

### Content-Addressable Storage

```typescript
// File content determines storage location
const hash = SHA256(fileContent); // "abc123def456..."
const path = `/blobs/ab/c1/abc123def456...`;

// Same content = Same location = Deduplication!
```

### Reference Counting

```sql
-- Track how many files point to each blob
blobs:
  content_hash: "abc123..."
  reference_count: 2  -- Two files using this content

-- When reference_count reaches 0, blob can be deleted
```

### Multi-Tenancy

```typescript
// Every query automatically filtered by tenant
repository.setTenant(tenantId);
// SQL: WHERE tenant_id = $1

// Users can NEVER access other tenants' data
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL (or Neon account)
- npm or yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/giorgiabes/file-system.git
cd file-system
```

2. **Install dependencies**

```bash
npm install
```

3. **Set up environment variables**

Create `.env` file in the root:

```env
DATABASE_URL=postgresql://user:password@host:5432/dbname
JWT_SECRET=your-super-secret-jwt-key-change-in-production
BLOB_STORAGE_PATH=./blobs
PORT=3000
NODE_ENV=development
```

4. **Run database migrations**

```bash
npm run migrate -w @file-system/infrastructure
```

5. **Build packages**

```bash
# Build core
cd packages/core && npm run build

# Build infrastructure
cd ../infrastructure && npm run build

# Build API
cd ../api && npm run build
```

6. **Start the application**

Terminal 1 - Backend:

```bash
cd packages/api
npm run dev
```

Terminal 2 - Frontend:

```bash
cd packages/frontend
npm run dev
```

7. **Access the application**

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

## 📊 API Endpoints

### Authentication

```
POST   /api/auth/register    - Create account
POST   /api/auth/login       - Login
```

### Files

```
POST   /api/fs/files         - Upload file
GET    /api/fs/files         - Download file
DELETE /api/fs/files         - Delete file
POST   /api/fs/files/copy    - Copy file
POST   /api/fs/files/move    - Move file
```

### Directories

```
POST   /api/fs/directories           - Create directory
GET    /api/fs/directories           - List directory
DELETE /api/fs/directories           - Delete directory
POST   /api/fs/directories/copy      - Copy directory (recursive)
POST   /api/fs/directories/move      - Move directory (recursive)
```

### Info

```
GET    /api/fs/info          - Get file/directory metadata
```

## 🧪 Example Usage

### Register and Upload File

```bash
# Register
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123", "name": "John Doe"}'

# Response: { "token": "eyJhbGc..." }

# Upload file
curl -X POST http://localhost:3000/api/fs/files \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"path": "/documents/report.pdf", "content": "BASE64_ENCODED_CONTENT"}'
```

### Deduplication in Action

```bash
# User A uploads file
POST /api/fs/files { path: "/userA/doc.txt", content: "Hello World" }
# Creates: /blobs/ab/c1/abc123... (12 bytes)

# User B uploads SAME content, different path
POST /api/fs/files { path: "/userB/document.txt", content: "Hello World" }
# Reuses: /blobs/ab/c1/abc123... (0 new bytes!)

# Result: 12 bytes used instead of 24 bytes (50% savings)
```

## 🛠️ Technology Stack

### Backend

- **TypeScript** - Type safety
- **Node.js** - Runtime
- **Express** - Web framework
- **PostgreSQL** - Metadata storage
- **JSON Web Tokens** - Authentication
- **bcrypt** - Password hashing
- **mime-types** - MIME type detection

### Frontend

- **React** - UI library
- **TypeScript** - Type safety
- **Vite** - Build tool
- **React Router** - Navigation
- **Axios** - HTTP client

### DevOps

- **ts-node-dev** - Development server
- **Neon** - Serverless PostgreSQL

## 📈 Performance & Scalability

### Current Optimizations

- ✅ Database indexes on (tenant_id, path)
- ✅ Sharded blob storage (prevents directory overflow)
- ✅ Reference counting for efficient cleanup
- ✅ Base64 encoding for binary transfer

### Future Enhancements

- 🔄 Redis caching for metadata
- 🔄 S3 integration for blob storage
- 🔄 Pagination for large directories
- 🔄 CDN for frequently accessed files
- 🔄 Database sharding by tenant_id

## 🏗️ Design Patterns Used

- **Repository Pattern** - Abstract data access
- **Factory Pattern** - Value object creation
- **Dependency Injection** - Service composition
- **Middleware Pattern** - Request processing
- **Strategy Pattern** - Pluggable storage

## 🔒 Security Features

- **Password Hashing** - bcrypt with 10 rounds
- **JWT Tokens** - 7-day expiration
- **SQL Injection Prevention** - Parameterized queries
- **Tenant Isolation** - Row-level security
- **CORS** - Configurable origins
- **Input Validation** - Path and hash validation

## 📝 Code Statistics

```
Total Lines: ~2,600
├── Core:            725 lines (28%)
├── Infrastructure:  445 lines (17%)
├── API:             587 lines (23%)
└── Frontend:        842 lines (32%)

Files: ~40
Packages: 4
Dependencies: Minimal (focused on quality)
```

## 🎓 Learning Resources

This project demonstrates:

- Domain-Driven Design (DDD)
- SOLID principles
- Clean Architecture
- Content-Addressable Storage
- Multi-tenancy patterns
- TypeScript best practices
- Full-stack development

## 🤝 Contributing

This is a portfolio/educational project. Feel free to:

- Fork and experiment
- Open issues for discussions
- Suggest improvements

## 📄 License

MIT License - See LICENSE file for details

## 👨‍💻 Author

**Giorgi Abesadze**

- GitHub: [@giorgiabes](https://github.com/giorgiabes)
- Role: Backend Developer

## 🙏 Acknowledgments

- Inspired by Git's content-addressable storage
- Built as a technical assignment demonstration
- Implements production-ready patterns and practices

---

**⭐ If you found this project interesting, please star the repository!**
