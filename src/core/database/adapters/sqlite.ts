import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { DatabaseAdapter, QueryResult } from "../types";

export class SqliteAdapter implements DatabaseAdapter {
  readonly dialect = "sqlite" as const;
  private db: Database.Database;

  constructor(filePath?: string) {
    const targetPath =
      filePath ||
      process.env.SQLITE_FILE_PATH ||
      path.join(process.cwd(), "data", "dcms.sqlite");

    const dir = path.dirname(targetPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    this.db = new Database(targetPath);
    // Enable WAL mode for better concurrency and performance
    this.db.pragma("journal_mode = WAL");
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const normalizedSql = sql.replace(/\$(\d+)/g, "?");
    const stmt = this.db.prepare(normalizedSql);
    return stmt.all(...params) as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const normalizedSql = sql.replace(/\$(\d+)/g, "?");
    const stmt = this.db.prepare(normalizedSql);
    const info = stmt.run(...params);
    return {
      affectedRows: info.changes,
      insertId: info.lastInsertRowid,
    };
  }

  async ping(): Promise<boolean> {
    try {
      const res = await this.query("SELECT 1 as alive");
      return Boolean(res && res.length > 0);
    } catch {
      return false;
    }
  }

  async close(): Promise<void> {
    if (this.db) {
      this.db.close();
    }
  }
}
