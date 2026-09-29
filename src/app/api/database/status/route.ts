import { NextResponse } from "next/server";
import { ensureDatabaseReady, detectDatabaseDialect } from "@/core/database";

export async function GET() {
  try {
    const dialect = detectDatabaseDialect();
    const db = await ensureDatabaseReady();
    const isAlive = await db.ping();

    const userCount = await db.query<{ count: number | string }>(
      "SELECT COUNT(*) as count FROM users"
    );

    return NextResponse.json({
      status: "online",
      dialect,
      healthy: isAlive,
      totalUsers: Number(userCount[0]?.count || 0),
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        status: "error",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
