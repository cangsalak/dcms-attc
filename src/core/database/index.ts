import { DatabaseAdapter, DatabaseDialect } from "./types";
import { SqliteAdapter } from "./adapters/sqlite";
import { PostgresAdapter } from "./adapters/postgres";
import { MysqlAdapter } from "./adapters/mysql";

let globalAdapter: DatabaseAdapter | null = null;
let isMigrated = false;

export function detectDatabaseDialect(): DatabaseDialect {
  const explicitType = (process.env.DB_TYPE || "").toLowerCase();
  if (explicitType === "mysql") return "mysql";
  if (explicitType === "postgres" || explicitType === "postgresql") return "postgres";
  if (explicitType === "sqlite") return "sqlite";

  const dbUrl = (process.env.DATABASE_URL || "").toLowerCase();
  if (dbUrl.startsWith("mysql://")) return "mysql";
  if (dbUrl.startsWith("postgres://") || dbUrl.startsWith("postgresql://")) return "postgres";

  // Default to lightweight SQLite (requires 0 external database servers)
  return "sqlite";
}

export function getDatabaseAdapter(): DatabaseAdapter {
  if (globalAdapter) {
    return globalAdapter;
  }

  const dialect = detectDatabaseDialect();

  if (dialect === "postgres") {
    globalAdapter = new PostgresAdapter();
  } else if (dialect === "mysql") {
    globalAdapter = new MysqlAdapter();
  } else {
    globalAdapter = new SqliteAdapter();
  }

  return globalAdapter;
}

/**
 * Auto-migrate schemas for all supported databases (SQLite, MySQL, PostgreSQL)
 */
export async function ensureDatabaseReady(): Promise<DatabaseAdapter> {
  const db = getDatabaseAdapter();
  if (isMigrated) return db;

  const isPostgres = db.dialect === "postgres";
  const isMysql = db.dialect === "mysql";

  // 1. Users table
  const createUsersSql = isMysql
    ? `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT 'admin123',
        role VARCHAR(64) NOT NULL,
        department VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL,
        avatar TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );`
    : `CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL DEFAULT 'admin123',
        role VARCHAR(64) NOT NULL,
        department VARCHAR(128) NOT NULL,
        status VARCHAR(32) NOT NULL,
        avatar TEXT,
        created_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
      );`;

  await db.execute(createUsersSql);

  // Ensure password column exists if table was created previously without it
  try {
    await db.execute("ALTER TABLE users ADD COLUMN password VARCHAR(255) DEFAULT 'admin123'");
  } catch {
    // Column already exists
  }

  // 2. Installed Modules table
  const createModulesSql = `CREATE TABLE IF NOT EXISTS installed_modules (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    version VARCHAR(32) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    installed_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
  );`;

  await db.execute(createModulesSql);

  // 3. Files & Uploads table
  const createFilesSql = `CREATE TABLE IF NOT EXISTS files (
    id VARCHAR(64) PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(128) NOT NULL,
    size_bytes BIGINT NOT NULL,
    url TEXT NOT NULL,
    folder_id VARCHAR(64) DEFAULT 'root',
    uploaded_by VARCHAR(64),
    uploaded_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
  );`;

  await db.execute(createFilesSql);

  // Ensure folder_id column exists if table was created previously without it
  try {
    await db.execute("ALTER TABLE files ADD COLUMN folder_id VARCHAR(64) DEFAULT 'root'");
  } catch {
    // Column already exists
  }

  // 4. Folders table (Hierarchical Directory System)
  const createFoldersSql = `CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) DEFAULT 'root',
    created_by VARCHAR(64),
    created_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
  );`;

  await db.execute(createFoldersSql);

  // Seed default admin user if empty
  const countUsers = await db.query<{ count: number | string }>(
    `SELECT COUNT(*) as count FROM users`
  );
  const total = Number(countUsers[0]?.count || 0);

  if (total === 0) {
    await db.execute(
      `INSERT INTO users (id, name, email, role, department, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "usr-001",
        "ผู้ดูแลระบบสูงสุด (Super Admin)",
        "admin@dcms.local",
        "Super Admin",
        "Executive & Tech",
        "active",
        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
      ]
    );

    await db.execute(
      `INSERT INTO users (id, name, email, role, department, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "usr-002",
        "ชนิกานต์ วงศ์สุวรรณ",
        "chanikan.w@dcms.local",
        "Admin",
        "Data Operations",
        "active",
        "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80",
      ]
    );
  }

  isMigrated = true;
  return db;
}
