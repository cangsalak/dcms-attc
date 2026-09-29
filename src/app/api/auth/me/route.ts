import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { ensureDatabaseReady } from "@/core/database";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("dcms_session");

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ authenticated: false, user: null });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    // Verify user in database
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT id, name, email, role, department, status, avatar FROM users WHERE id = ?`,
      [sessionData.id]
    );

    if (rows.length === 0 || rows[0].status === "suspended") {
      cookieStore.delete("dcms_session");
      return NextResponse.json({ authenticated: false, user: null });
    }

    const current = rows[0];
    return NextResponse.json({
      authenticated: true,
      user: {
        id: current.id,
        name: current.name,
        email: current.email,
        role: current.role,
        department: current.department,
        avatar: current.avatar,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ authenticated: false, user: null, error: err.message });
  }
}
