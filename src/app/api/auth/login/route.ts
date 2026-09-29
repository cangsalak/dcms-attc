import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { cookies } from "next/headers";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: "กรุณากรอกอีเมลและรหัสผ่าน" },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT id, name, email, password, role, department, status, avatar FROM users WHERE LOWER(email) = LOWER(?)`,
      [email.trim()]
    );

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "ไม่พบบัญชีผู้ใช้งานนี้ในระบบ" },
        { status: 401 }
      );
    }

    const user = rows[0];

    // Check status
    if (user.status === "suspended") {
      return NextResponse.json(
        { error: "บัญชีนี้ถูกระงับการใช้งาน กรุณาติดต่อผู้ดูแลระบบ" },
        { status: 403 }
      );
    }

    // Check password (default 'admin123')
    const validPassword = user.password || "admin123";
    if (password !== validPassword) {
      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: admin123)" },
        { status: 401 }
      );
    }

    const sessionPayload = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      loginAt: new Date().toISOString(),
    };

    const cookieStore = await cookies();
    cookieStore.set("dcms_session", JSON.stringify(sessionPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({
      success: true,
      user: sessionPayload,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
