-- Big Label Maker Database Schema

-- ClipArt table for storing custom clipart metadata
CREATE TABLE IF NOT EXISTS clipart (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL CHECK (mime_type IN ('image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp')),
    tags TEXT DEFAULT '',  -- Comma-separated tags for search
    file_size INTEGER NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Create index for search performance
CREATE INDEX IF NOT EXISTS idx_clipart_name ON clipart(name);
CREATE INDEX IF NOT EXISTS idx_clipart_tags ON clipart(tags);
CREATE INDEX IF NOT EXISTS idx_clipart_created_at ON clipart(created_at);

-- Label designs table (optional - for saving designs)
CREATE TABLE IF NOT EXISTS label_designs (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    design_data TEXT NOT NULL,  -- JSON blob containing full design state
    thumbnail TEXT,  -- Base64 encoded preview image
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_designs_name ON label_designs(name);
CREATE INDEX IF NOT EXISTS idx_designs_updated ON label_designs(updated_at);
