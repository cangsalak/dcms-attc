import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser } from "@/core/lib/auth";
import { createSystemNotification } from "@/core/lib/notifications";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await ensureDatabaseReady();
    const rows = await db.query<any>(
      `SELECT id, name, email, role, department, status, avatar, created_at as "createdAt"
       FROM users 
       WHERE id = ?`,
      [sessionUser.id]
    );

    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบผู้ใช้ในระบบ" }, { status: 404 });
    }

    return NextResponse.json({ user: rows[0] });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, avatar, department, currentPassword, newPassword } = body;

    const db = await ensureDatabaseReady();
    const userRows = await db.query<any>(
      `SELECT * FROM users WHERE id = ?`,
      [sessionUser.id]
    );

    if (userRows.length === 0) {
      return NextResponse.json({ error: "ไม่พบบัญชีผู้ใช้" }, { status: 404 });
    }

    const currentUser = userRows[0];

    // Password change requested
    if (newPassword) {
      if (!currentPassword) {
        return NextResponse.json(
          { error: "กรุณาระบุรหัสผ่านปัจจุบันเพื่อยืนยันการเปลี่ยนรหัสผ่าน" },
          { status: 400 }
        );
      }

      if (currentUser.password !== currentPassword) {
        return NextResponse.json(
          { error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" },
          { status: 400 }
        );
      }

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร" },
          { status: 400 }
        );
      }

      await db.execute(
        `UPDATE users SET password = ? WHERE id = ?`,
        [newPassword, sessionUser.id]
      );
    }

    // Profile fields update
    const updatedName = name ? name.trim() : currentUser.name;
    const updatedAvatar = avatar ? avatar.trim() : currentUser.avatar;
    const updatedDept = department !== undefined ? department.trim() : currentUser.department;

    await db.execute(
      `UPDATE users SET name = ?, avatar = ?, department = ? WHERE id = ?`,
      [updatedName, updatedAvatar, updatedDept, sessionUser.id]
    );

    createSystemNotification({
      title: "อัปเดตข้อมูลโปรไฟล์แล้ว",
      message: `${updatedName} ได้ปรับปรุงข้อมูลส่วนตัวหรือเปลี่ยนรหัสผ่านเรียบร้อยแล้ว`,
      type: "info",
      userId: sessionUser.id,
      link: "settings",
    }).catch(() => {});

    return NextResponse.json({
      success: true,
      message: "อัปเดตโปรไฟล์เรียบร้อยแล้ว",
      user: {
        id: sessionUser.id,
        name: updatedName,
        email: currentUser.email,
        role: currentUser.role,
        department: updatedDept,
        avatar: updatedAvatar,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
