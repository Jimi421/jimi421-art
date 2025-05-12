
-- Phase 1: Core Tables & Columns

-- 1.1 Users (for auth)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 1.2 Galleries + Subgalleries
CREATE TABLE IF NOT EXISTS galleries (
  id TEXT PRIMARY KEY,
  owner_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(owner_id, name)
);

CREATE TABLE IF NOT EXISTS subgalleries (
  id TEXT PRIMARY KEY,
  gallery_id TEXT NOT NULL REFERENCES galleries(id),
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(gallery_id, name)
);

-- 1.3 Images
CREATE TABLE IF NOT EXISTS images (
  id TEXT PRIMARY KEY,
  subgroup_id TEXT REFERENCES subgalleries(id),
  filename TEXT NOT NULL,
  original_name TEXT,
  mime_type TEXT,
  file_size INTEGER,
  width INTEGER,
  height INTEGER,
  uploaded_by TEXT NOT NULL REFERENCES users(id),
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  description TEXT,
  deleted_at TIMESTAMP
);

-- 1.4 Tags + Many-to-Many
CREATE TABLE IF NOT EXISTS tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS image_tags (
  image_id TEXT NOT NULL REFERENCES images(id),
  tag_id   INTEGER  NOT NULL REFERENCES tags(id),
  PRIMARY KEY (image_id, tag_id)
);

-- 1.5 Comments and Likes
CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  image_id TEXT NOT NULL REFERENCES images(id),
  user_id  TEXT NOT NULL REFERENCES users(id),
  comment  TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS likes (
  image_id TEXT NOT NULL REFERENCES images(id),
  user_id  TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (image_id, user_id)
);

-- 1.6 Audit Log
CREATE TABLE IF NOT EXISTS audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action  TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  details JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Phase 2: Indexes & Performance
CREATE INDEX IF NOT EXISTS idx_images_uploaded_at   ON images(uploaded_at);
CREATE INDEX IF NOT EXISTS idx_images_subgroup_id   ON images(subgroup_id);
CREATE INDEX IF NOT EXISTS idx_comments_image_id    ON comments(image_id);
CREATE INDEX IF NOT EXISTS idx_likes_image_user     ON likes(image_id, user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user      ON audit_logs(user_id);

-- Phase 3: Full-Text Search (FTS)
-- Requires D1’s FTS support
CREATE VIRTUAL TABLE IF NOT EXISTS images_fts USING fts5(
  filename, description, content='images', content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS images_ai AFTER INSERT ON images BEGIN
  INSERT INTO images_fts(rowid, filename, description)
  VALUES (new.rowid, new.filename, new.description);
END;

CREATE TRIGGER IF NOT EXISTS images_ad AFTER DELETE ON images BEGIN
  DELETE FROM images_fts WHERE rowid=old.rowid;
END;

CREATE TRIGGER IF NOT EXISTS images_au AFTER UPDATE ON images BEGIN
  UPDATE images_fts SET filename=new.filename, description=new.description
    WHERE rowid=new.rowid;
END;

-- Phase 4: Roles & Access Control
CREATE TABLE IF NOT EXISTS roles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS user_roles (
  user_id TEXT NOT NULL REFERENCES users(id),
  role_id TEXT NOT NULL REFERENCES roles(id),
  PRIMARY KEY(user_id, role_id)
);
