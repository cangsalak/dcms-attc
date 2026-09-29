import mysql, { Pool } from "mysql2/promise";
import { DatabaseAdapter, QueryResult } from "../types";

export class MysqlAdapter implements DatabaseAdapter {
  readonly dialect = "mysql" as const;
  private pool: Pool;

  constructor(connectionUri?: string) {
    const conn =
      connectionUri ||
      process.env.DATABASE_URL ||
      "mysql://root:root_secret@localhost:3306/dcms_db";
    this.pool = mysql.createPool(conn);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const normalizedSql = sql.replace(/\$(\d+)/g, "?");
    const [rows] = await this.pool.execute(normalizedSql, params);
    return rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const normalizedSql = sql.replace(/\$(\d+)/g, "?");
    const [result]: any = await this.pool.execute(normalizedSql, params);
    return {
      affectedRows: result.affectedRows,
      insertId: result.insertId,
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
    await this.pool.end();
  }
}
