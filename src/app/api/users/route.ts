import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser, hashPassword } from "@/core/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนเรียกดูข้อมูลผู้ใช้" },
        { status: 401 }
      );
    }

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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    // Role check: Only Super Admin and Admin can create users
    if (sessionUser.role !== "Super Admin" && sessionUser.role !== "Admin") {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการสร้างผู้ใช้งานใหม่ (ต้องเป็น Admin ขึ้นไป)" },
        { status: 403 }
      );
    }

    const body = await req.json();
    const { name, email, role, department, status, password } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: "Name and email are required" },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();
    const id = `usr-${Date.now().toString().slice(-4)}`;
    const avatar = `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80`;

    // Securely hash the password with PBKDF2
    const rawPassword = password || "admin123";
    const hashedPassword = hashPassword(rawPassword);

    await db.execute(
      `INSERT INTO users (id, name, email, password, role, department, status, avatar)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        name,
        email.trim().toLowerCase(),
        hashedPassword,
        role || "Member",
        department || "General",
        status || "active",
        avatar,
      ]
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    // Role check
    if (sessionUser.role !== "Super Admin" && sessionUser.role !== "Admin") {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ในการลบผู้ใช้งาน (ต้องเป็น Admin ขึ้นไป)" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json({ error: "Missing user id" }, { status: 400 });
    }

    // Prevent deleting self or primary superadmin
    if (id === sessionUser.id) {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชีของตนเองที่กำลังใช้งานอยู่ได้" },
        { status: 400 }
      );
    }

    if (id === "usr-001") {
      return NextResponse.json(
        { error: "ไม่สามารถลบบัญชี Super Admin หลักของระบบได้" },
        { status: 403 }
      );
    }

    const db = await ensureDatabaseReady();
    await db.execute("DELETE FROM users WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
