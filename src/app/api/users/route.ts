import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";

export async function GET() {
  try {
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      "SELECT id, name, email, role, department, status, avatar, created_at as \"createdAt\" FROM users ORDER BY created_at DESC"
    );
    return NextResponse.json({ users: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { name, email, role, department, status } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`;

    await db.execute(
      `INSERT INTO users (id, name, email, role, department, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, name, email, role || "Member", department || "General", status || "active", avatar]
    );

    return NextResponse.json({
      success: true,
      user: { id, name, email, role, department, status, avatar },
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
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    const db = await ensureDatabaseReady();
    await db.execute("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
