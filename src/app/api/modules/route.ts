import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";

export async function GET() {
  try {
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT id, name, version, enabled, installed_at as "installedAt" 
       FROM installed_modules 
       ORDER BY installed_at ASC`
    );
    return NextResponse.json({ modules: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { id, name, version, enabled = true } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Module id and name are required" },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();

    // Check if module is already installed
    const existing = await db.query(
      "SELECT id FROM installed_modules WHERE id = ?",
      [id]
    );

    if (existing && existing.length > 0) {
      await db.execute(
        "UPDATE installed_modules SET name = ?, version = ?, enabled = ? WHERE id = ?",
        [name, version || "1.0.0", enabled ? 1 : 0, id]
      );
    } else {
      await db.execute(
        "INSERT INTO installed_modules (id, name, version, enabled) VALUES (?, ?, ?, ?)",
        [id, name, version || "1.0.0", enabled ? 1 : 0]
      );
    }

    return NextResponse.json({
      success: true,
      module: { id, name, version, enabled },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing module id" }, { status: 400 });
    }

    const db = await ensureDatabaseReady();
    await db.execute("DELETE FROM installed_modules WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
