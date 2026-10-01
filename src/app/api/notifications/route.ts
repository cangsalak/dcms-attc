import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser } from "@/core/lib/auth";

export async function GET() {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = await ensureDatabaseReady();
    const rows = await db.query<any>(
      `SELECT id, user_id as "userId", type, title, message, link, 
              is_read as "isRead", created_at as "createdAt"
       FROM notifications
       WHERE user_id IS NULL OR user_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [sessionUser.id]
    );

    const unreadCount = rows.filter((r) => !r.isRead || r.isRead === 0 || r.isRead === "0").length;

    return NextResponse.json({
      notifications: rows,
      unreadCount,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, message, type = "info", link = null, userId = null } = body;

    if (!title || !message) {
      return NextResponse.json({ error: "Title and message are required" }, { status: 400 });
    }

    const db = await ensureDatabaseReady();
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    await db.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, userId, type, title, message, link, 0]
    );

    return NextResponse.json({
      success: true,
      notification: { id, userId, type, title, message, link, isRead: false },
    });
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

    const body = await req.json().catch(() => ({}));
    const { id, all } = body;

    const db = await ensureDatabaseReady();

    if (all) {
      await db.execute(
        `UPDATE notifications SET is_read = 1 WHERE user_id IS NULL OR user_id = ?`,
        [sessionUser.id]
      );
      return NextResponse.json({ success: true, message: "Marked all as read" });
    }

    if (id) {
      await db.execute(`UPDATE notifications SET is_read = 1 WHERE id = ?`, [id]);
      return NextResponse.json({ success: true, message: "Marked as read" });
    }

    return NextResponse.json({ error: "Missing id or all flag" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const all = searchParams.get("all") === "true";

    const db = await ensureDatabaseReady();

    if (all) {
      await db.execute(
        `DELETE FROM notifications WHERE user_id IS NULL OR user_id = ?`,
        [sessionUser.id]
      );
      return NextResponse.json({ success: true, message: "Cleared all notifications" });
    }

    if (id) {
      await db.execute(`DELETE FROM notifications WHERE id = ?`, [id]);
      return NextResponse.json({ success: true, message: "Deleted notification" });
    }

    return NextResponse.json({ error: "Missing id or all parameter" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
