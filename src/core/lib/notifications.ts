import { ensureDatabaseReady } from "@/core/database";

export async function createSystemNotification(options: {
  title: string;
  message: string;
  type?: "info" | "success" | "warning" | "error" | "security";
  link?: string | null;
  userId?: string | null;
}) {
  try {
    const db = await ensureDatabaseReady();
    const id = `notif-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    await db.execute(
      `INSERT INTO notifications (id, user_id, type, title, message, link, is_read)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        options.userId || null,
        options.type || "info",
        options.title,
        options.message,
        options.link || null,
        0,
      ]
    );
    return id;
  } catch (err) {
    console.error("Failed to create system notification:", err);
    return null;
  }
}
