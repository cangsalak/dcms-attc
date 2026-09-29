import { Pool } from "pg";
import { DatabaseAdapter, QueryResult } from "../types";

export class PostgresAdapter implements DatabaseAdapter {
  readonly dialect = "postgres" as const;
  private pool: Pool;

  constructor(connectionString?: string) {
    const conn =
      connectionString ||
      process.env.DATABASE_URL ||
      "postgresql://postgres:postgres_secret@localhost:5432/dcms_db";
    this.pool = new Pool({
      connectionString: conn,
      max: 10,
      idleTimeoutMillis: 30000,
    });
  }

  private normalizeToPostgresParams(sql: string): string {
    let index = 1;
    return sql.replace(/\?/g, () => `$${index++}`);
  }

  async query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
    const formattedSql = this.normalizeToPostgresParams(sql);
    const result = await this.pool.query(formattedSql, params);
    return result.rows as T[];
  }

  async execute(sql: string, params: any[] = []): Promise<QueryResult> {
    const formattedSql = this.normalizeToPostgresParams(sql);
    const result = await this.pool.query(formattedSql, params);
    return {
      affectedRows: result.rowCount || 0,
      insertId: result.rows[0]?.id,
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
