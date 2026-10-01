import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";

export async function GET() {
  try {
    const db = await ensureDatabaseReady();
    const rows = await db.query(
      `SELECT 
        id, 
        name, 
        name_th as "nameTh", 
        description, 
        version, 
        category, 
        icon_name as "iconName", 
        color_gradient as "colorGradient", 
        author, 
        size_str as "size", 
        entry_type as "entryType", 
        url, 
        rating,
        created_at as "createdAt"
       FROM marketplace_modules 
       ORDER BY created_at ASC`
    );
    return NextResponse.json({ apps: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      name,
      nameTh,
      description,
      version = "1.0.0",
      category = "custom",
      iconName = "store",
      colorGradient = "from-blue-600 to-indigo-600",
      author = "Community Developer",
      size = "Web App",
      entryType = "external_url",
      url = "",
    } = body;

    if (!name || (!url && entryType === "external_url")) {
      return NextResponse.json(
        { error: "App Name and URL are required for external apps" },
        { status: 400 }
      );
    }

    const appId =
      id ||
      `ext-${name.toLowerCase().replace(/[^a-z0-9]/g, "-")}-${Date.now().toString().slice(-4)}`;

    const db = await ensureDatabaseReady();

    // Check if ID exists
    const existing = await db.query(
      "SELECT id FROM marketplace_modules WHERE id = ?",
      [appId]
    );

    if (existing && existing.length > 0) {
      await db.execute(
        `UPDATE marketplace_modules 
         SET name = ?, name_th = ?, description = ?, version = ?, category = ?, icon_name = ?, color_gradient = ?, author = ?, size_str = ?, entry_type = ?, url = ?
         WHERE id = ?`,
        [
          name,
          nameTh || name,
          description || "",
          version,
          category,
          iconName,
          colorGradient,
          author,
          size,
          entryType,
          url,
          appId,
        ]
      );
    } else {
      await db.execute(
        `INSERT INTO marketplace_modules 
         (id, name, name_th, description, version, category, icon_name, color_gradient, author, size_str, entry_type, url, rating)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          appId,
          name,
          nameTh || name,
          description || "",
          version,
          category,
          iconName,
          colorGradient,
          author,
          size,
          entryType,
          url,
          5.0,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      app: {
        id: appId,
        name,
        nameTh: nameTh || name,
        description,
        version,
        category,
        iconName,
        colorGradient,
        author,
        size,
        entryType,
        url,
      },
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
      return NextResponse.json({ error: "Missing app id" }, { status: 400 });
    }

    const builtins = ["inventory", "billing", "audit-logs", "terminal"];
    if (builtins.includes(id)) {
      return NextResponse.json(
        { error: "Cannot delete official system modules" },
        { status: 403 }
      );
    }

    const db = await ensureDatabaseReady();
    await db.execute("DELETE FROM marketplace_modules WHERE id = ?", [id]);
    await db.execute("DELETE FROM installed_modules WHERE id = ?", [id]);

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
