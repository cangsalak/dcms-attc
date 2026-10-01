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

  // 4. Folders table (Hierarchical Directory System with Access Permissions)
  const createFoldersSql = `CREATE TABLE IF NOT EXISTS folders (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    parent_id VARCHAR(64) DEFAULT 'root',
    owner_id VARCHAR(64),
    access_type VARCHAR(32) DEFAULT 'public',
    allowed_roles TEXT DEFAULT '["Super Admin","Admin","Manager","Member"]',
    allowed_users TEXT DEFAULT '[]',
    department VARCHAR(128) DEFAULT '',
    permission_level VARCHAR(32) DEFAULT 'read_write',
    created_by VARCHAR(64),
    created_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
  );`;

  await db.execute(createFoldersSql);

  // Migration for folders table permissions
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN owner_id VARCHAR(64)");
  } catch {}
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN access_type VARCHAR(32) DEFAULT 'public'");
  } catch {}
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN allowed_roles TEXT DEFAULT '[\"Super Admin\",\"Admin\",\"Manager\",\"Member\"]'");
  } catch {}
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN allowed_users TEXT DEFAULT '[]'");
  } catch {}
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN department VARCHAR(128) DEFAULT ''");
  } catch {}
  try {
    await db.execute("ALTER TABLE folders ADD COLUMN permission_level VARCHAR(32) DEFAULT 'read_write'");
  } catch {}

  // 5. Marketplace Modules table (for 3rd-party and community apps)
  const createMarketplaceSql = `CREATE TABLE IF NOT EXISTS marketplace_modules (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    name_th VARCHAR(255),
    description TEXT,
    version VARCHAR(32) NOT NULL DEFAULT '1.0.0',
    category VARCHAR(64) NOT NULL DEFAULT 'custom',
    icon_name VARCHAR(64) NOT NULL DEFAULT 'store',
    color_gradient VARCHAR(128) DEFAULT 'from-blue-600 to-indigo-600',
    author VARCHAR(255) DEFAULT 'Community Developer',
    size_str VARCHAR(32) DEFAULT 'Web App',
    entry_type VARCHAR(32) NOT NULL DEFAULT 'internal',
    url TEXT,
    rating REAL DEFAULT 5.0,
    created_at ${isPostgres ? "TIMESTAMPTZ DEFAULT NOW()" : "DATETIME DEFAULT CURRENT_TIMESTAMP"}
  );`;

  await db.execute(createMarketplaceSql);

  // Migration for installed_modules to support 3rd-party / external web apps
  try {
    await db.execute("ALTER TABLE installed_modules ADD COLUMN entry_type VARCHAR(32) DEFAULT 'internal'");
  } catch {}
  try {
    await db.execute("ALTER TABLE installed_modules ADD COLUMN url TEXT");
  } catch {}
  try {
    await db.execute("ALTER TABLE installed_modules ADD COLUMN icon_name VARCHAR(64) DEFAULT 'store'");
  } catch {}
  try {
    await db.execute("ALTER TABLE installed_modules ADD COLUMN color_gradient VARCHAR(128) DEFAULT 'from-blue-600 to-indigo-600'");
  } catch {}
  try {
    await db.execute("ALTER TABLE installed_modules ADD COLUMN description TEXT");
  } catch {}

  // Seed default marketplace modules if empty
  const countMarketplace = await db.query<{ count: number | string }>(
    `SELECT COUNT(*) as count FROM marketplace_modules`
  );
  if (Number(countMarketplace[0]?.count || 0) === 0) {
    const defaultApps = [
      {
        id: "inventory",
        name: "Inventory & Stock",
        name_th: "ระบบจัดการสต็อกและคลังสินค้า",
        description: "ติดตามสินค้าคงคลัง ล็อตสินค้า การรับเข้า-เบิกออก และแจ้งเตือนสต็อกใกล้หมดแบบเรียลไทม์",
        version: "1.2.0",
        category: "business",
        icon_name: "packages",
        color_gradient: "from-amber-500 to-orange-600",
        author: "CoreOS Labs",
        size_str: "4.2 MB",
        entry_type: "internal",
        url: "",
        rating: 4.9,
      },
      {
        id: "billing",
        name: "Billing & Invoices",
        name_th: "ระบบใบเสร็จและใบแจ้งหนี้",
        description: "ออกใบเสนอราคา ใบเสร็จรับเงิน ใบกำกับภาษี VAT 7% พร้อม QR Code ชำระเงิน",
        version: "2.0.1",
        category: "business",
        icon_name: "document",
        color_gradient: "from-emerald-500 to-teal-600",
        author: "FinTech Team",
        size_str: "5.8 MB",
        entry_type: "internal",
        url: "",
        rating: 4.8,
      },
      {
        id: "audit-logs",
        name: "Audit & Security Logs",
        name_th: "ประวัติกิจกรรมและความปลอดภัย",
        description: "เก็บบันทึกประวัติการเข้าใช้งาน (Audit Trail) พร้อมส่งออก CSV/JSON ตามมาตรฐานความปลอดภัย",
        version: "1.0.5",
        category: "tools",
        icon_name: "security",
        color_gradient: "from-rose-500 to-red-600",
        author: "Security Team",
        size_str: "2.1 MB",
        entry_type: "internal",
        url: "",
        rating: 4.7,
      },
      {
        id: "terminal",
        name: "System Terminal",
        name_th: "เทอร์มินัลจัดการระบบ",
        description: "คอนโซลคอมมานด์ไลน์และเชลล์อินเตอร์แอคทีฟสำหรับตรวจสอบสถานะ Node.js, PM2 และฐานข้อมูล",
        version: "0.9.4",
        category: "tools",
        icon_name: "terminal",
        color_gradient: "from-slate-700 to-zinc-900",
        author: "SysOps",
        size_str: "1.5 MB",
        entry_type: "internal",
        url: "",
        rating: 5.0,
      },
    ];

    for (const app of defaultApps) {
      await db.execute(
        `INSERT INTO marketplace_modules 
         (id, name, name_th, description, version, category, icon_name, color_gradient, author, size_str, entry_type, url, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          app.id,
          app.name,
          app.name_th,
          app.description,
          app.version,
          app.category,
          app.icon_name,
          app.color_gradient,
          app.author,
          app.size_str,
          app.entry_type,
          app.url,
          app.rating,
        ]
      );
    }
  }

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
