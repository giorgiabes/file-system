-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- File system nodes (files and directories)
CREATE TABLE IF NOT EXISTS fs_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('file', 'directory')),
  content_hash VARCHAR(64),
  size BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  modified_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (tenant_id, path)
);

-- Blobs (content storage)
CREATE TABLE IF NOT EXISTS blobs (
  content_hash VARCHAR(64) PRIMARY KEY,
  reference_count INTEGER DEFAULT 0 CHECK (reference_count >= 0),
  size BIGINT,
  created_at TIMESTAMP DEFAULT NOW(),
  last_accessed_at TIMESTAMP DEFAULT NOW()
);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_fs_nodes_tenant_path ON fs_nodes(tenant_id, path);
CREATE INDEX IF NOT EXISTS idx_fs_nodes_parent ON fs_nodes(tenant_id, path text_pattern_ops);
CREATE INDEX IF NOT EXISTS idx_blobs_orphans ON blobs(reference_count) WHERE reference_count = 0;
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_tenant ON users(tenant_id);