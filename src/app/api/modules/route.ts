import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser } from "@/core/lib/auth";

export async function GET() {
  try {
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT 
        id, 
        name, 
        version, 
        enabled, 
        entry_type as "entryType", 
        url, 
        icon_name as "iconName", 
        color_gradient as "colorGradient", 
        description, 
        installed_at as "installedAt" 
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
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการติดตั้งโมดูล" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const {
      id,
      name,
      version,
      enabled = true,
      entryType = "internal",
      url = "",
      iconName = "store",
      colorGradient = "from-blue-600 to-indigo-600",
      description = "",
    } = body;

    if (!id || !name) {
      return NextResponse.json(
        { error: "Module id and name are required" },
        { status: 400 }
      );
    }

    // Security check on external URL schemes
    if (entryType === "external_url" && url) {
      const isHttp = url.startsWith("http://") || url.startsWith("https://");
      if (!isHttp) {
        return NextResponse.json(
          { error: "URL ต้องขึ้นต้นด้วย http:// หรือ https:// เท่านั้นเพื่อความปลอดภัย" },
          { status: 400 }
        );
      }
    }

    const db = await ensureDatabaseReady();

    // Check if module is already installed
    const existing = await db.query(
      "SELECT id FROM installed_modules WHERE id = ?",
      [id]
    );

    if (existing && existing.length > 0) {
      await db.execute(
        `UPDATE installed_modules 
         SET name = ?, version = ?, enabled = ?, entry_type = ?, url = ?, icon_name = ?, color_gradient = ?, description = ?
         WHERE id = ?`,
        [
          name,
          version || "1.0.0",
          enabled ? 1 : 0,
          entryType,
          url,
          iconName,
          colorGradient,
          description,
          id,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO installed_modules 
         (id, name, version, enabled, entry_type, url, icon_name, color_gradient, description) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          name,
          version || "1.0.0",
          enabled ? 1 : 0,
          entryType,
          url,
          iconName,
          colorGradient,
          description,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      module: {
        id,
        name,
        version,
        enabled,
        entryType,
        url,
        iconName,
        colorGradient,
        description,
      },
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
        { error: "กรุณาเข้าสู่ระบบก่อนทำการถอนการติดตั้งโมดูล" },
        { status: 401 }
      );
    }

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
