import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDatabaseReady, detectDatabaseDialect } from "@/core/database";
import { getSessionUser } from "@/core/lib/auth";
import { createSystemNotification } from "@/core/lib/notifications";

export async function GET(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "Super Admin" && sessionUser.role !== "Admin")) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถสำรองฐานข้อมูลได้" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || searchParams.get("type") || "sqlite";
    const dialect = detectDatabaseDialect();

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);

    // If SQLite and native file requested
    if (dialect === "sqlite" && format === "sqlite") {
      const dbPath = path.join(process.cwd(), "data", "dcms.sqlite");
      if (!fs.existsSync(dbPath)) {
        return NextResponse.json({ error: "ไม่พบไฟล์ฐานข้อมูล SQLite" }, { status: 404 });
      }

      const fileBuffer = await fs.promises.readFile(dbPath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Type": "application/vnd.sqlite3",
          "Content-Disposition": `attachment; filename="dcms_backup_${timestamp}.sqlite"`,
          "Content-Length": fileBuffer.length.toString(),
        },
      });
    }

    // JSON export format (Multi-database universal backup)
    const db = await ensureDatabaseReady();
    const users = await db.query("SELECT * FROM users");
    const folders = await db.query("SELECT * FROM folders");
    const files = await db.query("SELECT * FROM files");
    const modules = await db.query("SELECT * FROM installed_modules");
    const marketplace = await db.query("SELECT * FROM marketplace_modules");
    const notifications = await db.query("SELECT * FROM notifications");

    const backupData = {
      system: "DCMS Core OS",
      version: "1.0.0",
      dialect,
      exportedAt: new Date().toISOString(),
      exportedBy: sessionUser.name,
      tables: {
        users,
        folders,
        files,
        installed_modules: modules,
        marketplace_modules: marketplace,
        notifications,
      },
    };

    const jsonStr = JSON.stringify(backupData, null, 2);
    return new NextResponse(jsonStr, {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="dcms_universal_backup_${timestamp}.json"`,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser || (sessionUser.role !== "Super Admin" && sessionUser.role !== "Admin")) {
      return NextResponse.json(
        { error: "เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถกู้คืนฐานข้อมูลได้" },
        { status: 403 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ที่ต้องการกู้คืน" }, { status: 400 });
    }

    const dialect = detectDatabaseDialect();
    const ext = path.extname(file.name).toLowerCase();

    // 1. Restore from SQLite binary file
    if (ext === ".sqlite" || ext === ".db") {
      if (dialect !== "sqlite") {
        return NextResponse.json(
          { error: `ระบบกำลังใช้งานฐานข้อมูล ${dialect} ไม่สามารถกู้คืนด้วยไฟล์ .sqlite ได้ (กรุณาใช้ไฟล์ .json)` },
          { status: 400 }
        );
      }

      const dbDir = path.join(process.cwd(), "data");
      const dbPath = path.join(dbDir, "dcms.sqlite");
      const bakPath = path.join(dbDir, `dcms_pre_restore_${Date.now()}.bak`);

      // Make a safety copy of existing sqlite file
      if (fs.existsSync(dbPath)) {
        await fs.promises.copyFile(dbPath, bakPath);
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      await fs.promises.writeFile(dbPath, buffer);

      createSystemNotification({
        title: "กู้คืนฐานข้อมูลสำเร็จ",
        message: `${sessionUser.name} ได้กู้คืนฐานข้อมูลจากไฟล์ ${file.name} เรียบร้อยแล้ว`,
        type: "success",
        link: "settings",
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: "กู้คืนฐานข้อมูลจากไฟล์ SQLite เรียบร้อยแล้ว ระบบพร้อมทำงานต่อทันที",
      });
    }

    // 2. Restore from JSON universal export
    if (ext === ".json") {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.tables || !data.tables.users) {
        return NextResponse.json(
          { error: "รูปแบบไฟล์ JSON ไม่ถูกต้องสำหรับฐานข้อมูล DCMS" },
          { status: 400 }
        );
      }

      const db = await ensureDatabaseReady();

      // Clear & restore users
      if (Array.isArray(data.tables.users) && data.tables.users.length > 0) {
        await db.execute("DELETE FROM users");
        for (const u of data.tables.users) {
          await db.execute(
            `INSERT INTO users (id, name, email, password, role, department, status, avatar)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [u.id, u.name, u.email, u.password || "admin123", u.role, u.department, u.status, u.avatar]
          );
        }
      }

      // Clear & restore folders
      if (Array.isArray(data.tables.folders)) {
        await db.execute("DELETE FROM folders");
        for (const f of data.tables.folders) {
          await db.execute(
            `INSERT INTO folders (id, name, parent_id, owner_id, access_type, allowed_roles, allowed_users, department, permission_level, created_by)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [f.id, f.name, f.parent_id || "root", f.owner_id, f.access_type || "public", f.allowed_roles || "[]", f.allowed_users || "[]", f.department || "", f.permission_level || "read_write", f.created_by]
          );
        }
      }

      // Clear & restore files
      if (Array.isArray(data.tables.files)) {
        await db.execute("DELETE FROM files");
        for (const f of data.tables.files) {
          await db.execute(
            `INSERT INTO files (id, filename, original_name, mime_type, size_bytes, url, folder_id, uploaded_by, is_trash)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [f.id, f.filename, f.original_name, f.mime_type, f.size_bytes, f.url, f.folder_id || "root", f.uploaded_by, f.is_trash ? 1 : 0]
          );
        }
      }

      createSystemNotification({
        title: "กู้คืนฐานข้อมูลสำเร็จ",
        message: `${sessionUser.name} ได้นำเข้าและกู้คืนฐานข้อมูลจากไฟล์ JSON เรียบร้อยแล้ว`,
        type: "success",
        link: "settings",
      }).catch(() => {});

      return NextResponse.json({
        success: true,
        message: `กู้คืนข้อมูลสำเร็จ (${data.tables.users?.length || 0} ผู้ใช้, ${data.tables.files?.length || 0} ไฟล์)`,
      });
    }

    return NextResponse.json(
      { error: "รองรับเฉพาะไฟล์ .sqlite หรือ .json เท่านั้น" },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการกู้คืนฐานข้อมูล: " + err.message },
      { status: 500 }
    );
  }
}
