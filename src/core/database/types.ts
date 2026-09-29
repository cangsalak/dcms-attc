export type DatabaseDialect = "sqlite" | "mysql" | "postgres";

export interface QueryResult {
  affectedRows?: number;
  insertId?: number | string | bigint;
  rows?: any[];
}

export interface DatabaseAdapter {
  readonly dialect: DatabaseDialect;
  query<T = any>(sql: string, params?: any[]): Promise<T[]>;
  execute(sql: string, params?: any[]): Promise<QueryResult>;
  ping(): Promise<boolean>;
  close?(): Promise<void>;
}
