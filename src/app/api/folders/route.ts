import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser, checkFolderPermission } from "@/core/lib/auth";
import fs from "fs";
import path from "path";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const parentId = searchParams.get("parentId") || "root";
    const singleFolderId = searchParams.get("id");

    const sessionUser = await getSessionUser();
    const db = await ensureDatabaseReady();

    // If requesting a single folder details/properties
    if (singleFolderId) {
      const rows = await db.query(
        `SELECT id, name, parent_id as "parentId", owner_id as "ownerId",
                access_type as "accessType", allowed_roles as "allowedRoles",
                allowed_users as "allowedUsers", department,
                permission_level as "permissionLevel",
                created_by as "createdBy", created_at as "createdAt"
         FROM folders 
         WHERE id = ?`,
        [singleFolderId]
      );

      if (rows.length === 0) {
        return NextResponse.json({ error: "ไม่พบโฟลเดอร์" }, { status: 404 });
      }

      const folder = rows[0];
      const perm = checkFolderPermission(folder, sessionUser);
      if (!perm.canRead) {
        return NextResponse.json(
          { error: "คุณไม่มีสิทธิ์เข้าถึงโฟลเดอร์นี้", reason: perm.reason },
          { status: 403 }
        );
      }

      return NextResponse.json({
        folder: {
          ...folder,
          allowedRoles: typeof folder.allowedRoles === "string" ? JSON.parse(folder.allowedRoles || "[]") : (folder.allowedRoles || []),
          allowedUsers: typeof folder.allowedUsers === "string" ? JSON.parse(folder.allowedUsers || "[]") : (folder.allowedUsers || []),
          currentUserCanWrite: perm.canWrite,
          currentUserCanManage: perm.canManage,
        },
      });
    }

    // Query list of subfolders
    const sql =
      parentId === "trash"
        ? `SELECT id, name, parent_id as "parentId", owner_id as "ownerId",
                  access_type as "accessType", allowed_roles as "allowedRoles",
                  allowed_users as "allowedUsers", department,
                  permission_level as "permissionLevel",
                  created_by as "createdBy", created_at as "createdAt"
           FROM folders 
           WHERE (is_trash = true OR is_trash = 1)
           ORDER BY name ASC`
        : `SELECT id, name, parent_id as "parentId", owner_id as "ownerId",
                  access_type as "accessType", allowed_roles as "allowedRoles",
                  allowed_users as "allowedUsers", department,
                  permission_level as "permissionLevel",
                  created_by as "createdBy", created_at as "createdAt"
           FROM folders 
           WHERE parent_id = ? AND (is_trash = false OR is_trash = 0 OR is_trash IS NULL)
           ORDER BY name ASC`;

    const folders =
      parentId === "trash"
        ? await db.query(sql)
        : await db.query(sql, [parentId]);

    // Filter folders based on user permissions
    const accessibleFolders = folders.filter((f: any) => {
      const perm = checkFolderPermission(f, sessionUser);
      return perm.canRead;
    });

    // Get item counts & permissions for each folder
    const enrichedFolders = await Promise.all(
      accessibleFolders.map(async (f: any) => {
        const fileCountRes = await db.query<{ count: number | string }>(
          `SELECT COUNT(*) as count FROM files WHERE folder_id = ?`,
          [f.id]
        );
        const subFolderCountRes = await db.query<{ count: number | string }>(
          `SELECT COUNT(*) as count FROM folders WHERE parent_id = ?`,
          [f.id]
        );

        let parsedRoles = ["Super Admin", "Admin", "Manager", "Member"];
        try {
          if (typeof f.allowedRoles === "string") parsedRoles = JSON.parse(f.allowedRoles);
          else if (Array.isArray(f.allowedRoles)) parsedRoles = f.allowedRoles;
        } catch {}

        let parsedUsers: string[] = [];
        try {
          if (typeof f.allowedUsers === "string") parsedUsers = JSON.parse(f.allowedUsers);
          else if (Array.isArray(f.allowedUsers)) parsedUsers = f.allowedUsers;
        } catch {}

        const perm = checkFolderPermission(f, sessionUser);

        return {
          ...f,
          allowedRoles: parsedRoles,
          allowedUsers: parsedUsers,
          currentUserCanWrite: perm.canWrite,
          currentUserCanManage: perm.canManage,
          fileCount: Number(fileCountRes[0]?.count || 0),
          subFolderCount: Number(subFolderCountRes[0]?.count || 0),
        };
      })
    );

    return NextResponse.json({ folders: enrichedFolders });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      name,
      parentId = "root",
      accessType = "public",
      allowedRoles = ["Super Admin", "Admin", "Manager", "Member"],
      allowedUsers = [],
      department = "",
      permissionLevel = "read_write",
    } = body;

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }

    const trimmedName = (name || "").trim().replace(/[\\/:*?"<>|]/g, "_");
    if (!trimmedName) {
      return NextResponse.json(
        { error: "กรุณาระบุชื่อโฟลเดอร์ที่ถูกต้อง" },
        { status: 400 }
      );
    }

    const db = await ensureDatabaseReady();

    // Check parent folder write permission
    if (parentId && parentId !== "root") {
      const parentRows = await db.query(`SELECT * FROM folders WHERE id = ?`, [parentId]);
      if (parentRows.length > 0) {
        const parentPerm = checkFolderPermission(parentRows[0], sessionUser);
        if (!parentPerm.canWrite) {
          return NextResponse.json(
            { error: "คุณไม่มีสิทธิ์สร้างโฟลเดอร์ย่อยในโฟลเดอร์นี้" },
            { status: 403 }
          );
        }
      }
    }

    // Check duplicate in same parent
    const existing = await db.query(
      `SELECT id FROM folders WHERE parent_id = ? AND LOWER(name) = LOWER(?)`,
      [parentId, trimmedName]
    );

    if (existing.length > 0) {
      return NextResponse.json(
        { error: `โฟลเดอร์ชื่อ "${trimmedName}" มีอยู่แล้วในตำแหน่งนี้` },
        { status: 409 }
      );
    }

    const id = `fld-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const creatorName = sessionUser?.name || "Admin";
    const ownerId = sessionUser?.id || "usr-001";
    const targetDept = department || (sessionUser?.department || "");

    await db.execute(
      `INSERT INTO folders (id, name, parent_id, owner_id, access_type, allowed_roles, allowed_users, department, permission_level, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        trimmedName,
        parentId,
        ownerId,
        accessType,
        JSON.stringify(allowedRoles),
        JSON.stringify(allowedUsers),
        targetDept,
        permissionLevel,
        creatorName,
      ]
    );

    return NextResponse.json({
      success: true,
      folder: {
        id,
        name: trimmedName,
        parentId,
        ownerId,
        accessType,
        allowedRoles,
        allowedUsers,
        department: targetDept,
        permissionLevel,
        createdBy: creatorName,
        createdAt: new Date().toISOString(),
        currentUserCanWrite: true,
        currentUserCanManage: true,
        fileCount: 0,
        subFolderCount: 0,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }
    const body = await req.json();
    const {
      id,
      name,
      accessType,
      allowedRoles,
      allowedUsers,
      department,
      permissionLevel,
    } = body;

    if (!id || id === "root") {
      return NextResponse.json({ error: "ไม่สามารถแก้ไขโฟลเดอร์หลักได้" }, { status: 400 });
    }

    const db = await ensureDatabaseReady();
    const rows = await db.query(`SELECT * FROM folders WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบโฟลเดอร์" }, { status: 404 });
    }

    const folder = rows[0];
    const perm = checkFolderPermission(folder, sessionUser);
    if (!perm.canManage) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์แก้ไขการตั้งค่าหรือสิทธิ์ของโฟลเดอร์นี้ (เฉพาะเจ้าของหรือผู้ดูแลระบบ)" },
        { status: 403 }
      );
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (name !== undefined && name.trim()) {
      const trimmed = name.trim().replace(/[\\/:*?"<>|]/g, "_");
      updates.push("name = ?");
      params.push(trimmed);
    }

    if (accessType !== undefined) {
      updates.push("access_type = ?");
      params.push(accessType);
    }

    if (allowedRoles !== undefined) {
      updates.push("allowed_roles = ?");
      params.push(JSON.stringify(allowedRoles));
    }

    if (allowedUsers !== undefined) {
      updates.push("allowed_users = ?");
      params.push(JSON.stringify(allowedUsers));
    }

    if (department !== undefined) {
      updates.push("department = ?");
      params.push(department);
    }

    if (permissionLevel !== undefined) {
      updates.push("permission_level = ?");
      params.push(permissionLevel);
    }

    if (updates.length > 0) {
      params.push(id);
      await db.execute(
        `UPDATE folders SET ${updates.join(", ")} WHERE id = ?`,
        params
      );
    }

    return NextResponse.json({ success: true, message: "อัปเดตสิทธิ์โฟลเดอร์เรียบร้อย" });
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
    const { id, action } = body;

    const db = await ensureDatabaseReady();

    if (action === "restore" && id) {
      await db.execute(
        "UPDATE folders SET is_trash = 0, deleted_at = NULL WHERE id = ?",
        [id]
      );
      // Also restore files inside this folder
      await db.execute(
        "UPDATE files SET is_trash = 0, deleted_at = NULL WHERE folder_id = ?",
        [id]
      );
      return NextResponse.json({ success: true, message: "กู้คืนโฟลเดอร์เรียบร้อยแล้ว" });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    const permanent = searchParams.get("permanent") === "true";
    const emptyTrash = searchParams.get("emptyTrash") === "true";

    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" },
        { status: 401 }
      );
    }
    const db = await ensureDatabaseReady();

    // 1. Empty all folders in trash
    if (emptyTrash) {
      const trashFolders = await db.query<{ id: string }>(
        "SELECT id FROM folders WHERE (is_trash = true OR is_trash = 1)"
      );
      for (const tf of trashFolders) {
        const files = await db.query<{ filename: string }>(
          `SELECT filename FROM files WHERE folder_id = ?`,
          [tf.id]
        );
        for (const f of files) {
          const filePath = path.join(process.cwd(), "public", "uploads", f.filename);
          if (fs.existsSync(filePath)) {
            try { fs.unlinkSync(filePath); } catch {}
          }
        }
        await db.execute(`DELETE FROM files WHERE folder_id = ?`, [tf.id]);
        await db.execute(`DELETE FROM folders WHERE id = ?`, [tf.id]);
      }
      return NextResponse.json({ success: true, message: "ล้างถังขยะโฟลเดอร์เรียบร้อยแล้ว" });
    }

    if (!id || id === "root") {
      return NextResponse.json({ error: "ไม่สามารถลบโฟลเดอร์หลักได้" }, { status: 400 });
    }

    const rows = await db.query<any>(`SELECT * FROM folders WHERE id = ?`, [id]);
    if (rows.length === 0) {
      return NextResponse.json({ error: "ไม่พบโฟลเดอร์" }, { status: 404 });
    }

    const folder = rows[0];
    const perm = checkFolderPermission(folder, sessionUser);
    if (!perm.canManage && !perm.canWrite) {
      return NextResponse.json(
        { error: "คุณไม่มีสิทธิ์ลบโฟลเดอร์นี้" },
        { status: 403 }
      );
    }

    const isAlreadyInTrash = Boolean(folder.is_trash && folder.is_trash !== 0 && folder.is_trash !== "0");

    // 2. Permanent Delete (if requested or already in trash)
    if (permanent || isAlreadyInTrash) {
      // Find all files inside this folder to delete physical files
      const files = await db.query<{ filename: string }>(
        `SELECT filename FROM files WHERE folder_id = ?`,
        [id]
      );

      for (const f of files) {
        const filePath = path.join(process.cwd(), "public", "uploads", f.filename);
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
          } catch {}
        }
      }

      await db.execute(`DELETE FROM files WHERE folder_id = ?`, [id]);
      await db.execute(`DELETE FROM folders WHERE parent_id = ?`, [id]);
      await db.execute(`DELETE FROM folders WHERE id = ?`, [id]);

      return NextResponse.json({ success: true, deletedFolderId: id, permanent: true });
    }

    // 3. Soft Delete -> Move to Recycle Bin
    await db.execute(
      `UPDATE folders SET is_trash = 1, deleted_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [id]
    );
    // Also mark contained files as trash
    await db.execute(
      `UPDATE files SET is_trash = 1, deleted_at = CURRENT_TIMESTAMP WHERE folder_id = ?`,
      [id]
    );

    return NextResponse.json({ success: true, deletedFolderId: id, inTrash: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
