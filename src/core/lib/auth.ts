import { cookies } from "next/headers";
import crypto from "crypto";

const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  "dcms-core-os-cryptographic-signing-secret-key-2026-attc-enterprise";

export interface SessionUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  avatar?: string;
  loginAt?: string;
}

/**
 * Signs a session payload with HMAC-SHA256 to prevent cookie tampering & privilege escalation
 */
export function signSession(payload: SessionUser): string {
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(base64Payload)
    .digest("base64url");
  return `${base64Payload}.${signature}`;
}

/**
 * Cryptographically verifies session token signature
 */
export function verifySession(token: string): SessionUser | null {
  try {
    const parts = token.split(".");
    if (parts.length === 2) {
      const [base64Payload, signature] = parts;
      const expectedSig = crypto
        .createHmac("sha256", SESSION_SECRET)
        .update(base64Payload)
        .digest("base64url");

      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expectedSig);

      if (sigBuf.length === expBuf.length && crypto.timingSafeEqual(sigBuf, expBuf)) {
        const jsonStr = Buffer.from(base64Payload, "base64url").toString("utf-8");
        return JSON.parse(jsonStr) as SessionUser;
      }
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Hashes password using PBKDF2 with a random 16-byte cryptographic salt
 */
export function hashPassword(plainText: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const hash = crypto
    .pbkdf2Sync(plainText, salt, 10000, 64, "sha512")
    .toString("hex");
  return `pbkdf2:${salt}:${hash}`;
}

/**
 * Verifies a plaintext password against a stored PBKDF2 hash or legacy plaintext
 */
export function verifyPassword(plainText: string, storedHash: string): boolean {
  if (!storedHash) return false;
  if (storedHash.startsWith("pbkdf2:")) {
    const parts = storedHash.split(":");
    if (parts.length !== 3) return false;
    const [, salt, hash] = parts;
    const computed = crypto
      .pbkdf2Sync(plainText, salt, 10000, 64, "sha512")
      .toString("hex");
    const compBuf = Buffer.from(computed);
    const hashBuf = Buffer.from(hash);
    return compBuf.length === hashBuf.length && crypto.timingSafeEqual(compBuf, hashBuf);
  }
  // Backwards compatibility for legacy plaintext passwords
  return plainText === storedHash;
}

export async function getSessionUser(): Promise<SessionUser | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("dcms_session");
    if (!sessionCookie || !sessionCookie.value) {
      return null;
    }
    return verifySession(sessionCookie.value);
  } catch {
    return null;
  }
}

export interface FolderPermissionResult {
  canRead: boolean;
  canWrite: boolean;
  canManage: boolean;
  reason?: string;
}

/**
 * Checks user permissions for a given folder record.
 */
export function checkFolderPermission(
  folder: {
    id: string;
    parent_id?: string;
    parentId?: string;
    owner_id?: string | null;
    ownerId?: string | null;
    created_by?: string | null;
    createdBy?: string | null;
    access_type?: string | null;
    accessType?: string | null;
    allowed_roles?: string | string[] | null;
    allowedRoles?: string | string[] | null;
    allowed_users?: string | string[] | null;
    allowedUsers?: string | string[] | null;
    department?: string | null;
    permission_level?: string | null;
    permissionLevel?: string | null;
  } | null,
  user: SessionUser | null
): FolderPermissionResult {
  // Root directory is always readable & writable by authenticated users
  if (!folder || folder.id === "root" || folder.id === "") {
    return {
      canRead: true,
      canWrite: true,
      canManage: user?.role === "Super Admin" || user?.role === "Admin",
    };
  }

  const ownerId = folder.owner_id || folder.ownerId;
  const createdBy = folder.created_by || folder.createdBy;
  const accessType = (folder.access_type || folder.accessType || "public").toLowerCase();
  const department = (folder.department || "").trim().toLowerCase();
  const permLevel = (folder.permission_level || folder.permissionLevel || "read_write").toLowerCase();

  let roles: string[] = [];
  const rawRoles = folder.allowed_roles || folder.allowedRoles;
  if (Array.isArray(rawRoles)) {
    roles = rawRoles;
  } else if (typeof rawRoles === "string" && rawRoles.trim()) {
    try {
      roles = JSON.parse(rawRoles);
    } catch {
      roles = rawRoles.split(",").map((r) => r.trim());
    }
  }

  let users: string[] = [];
  const rawUsers = folder.allowed_users || folder.allowedUsers;
  if (Array.isArray(rawUsers)) {
    users = rawUsers;
  } else if (typeof rawUsers === "string" && rawUsers.trim()) {
    try {
      users = JSON.parse(rawUsers);
    } catch {
      users = rawUsers.split(",").map((u) => u.trim());
    }
  }

  // 1. Super Admin and Admin have complete access to everything
  const isAdmin = user?.role === "Super Admin" || user?.role === "Admin";
  if (isAdmin) {
    return { canRead: true, canWrite: true, canManage: true };
  }

  // 2. Owner of the folder has full access and management
  const isOwner =
    (user?.id && ownerId && user.id === ownerId) ||
    (user?.name && createdBy && user.name.toLowerCase() === createdBy.toLowerCase());

  if (isOwner) {
    return { canRead: true, canWrite: true, canManage: true };
  }

  // If no user session, deny all access for non-public
  if (!user) {
    if (accessType === "public") {
      return {
        canRead: true,
        canWrite: permLevel === "read_write",
        canManage: false,
      };
    }
    return { canRead: false, canWrite: false, canManage: false, reason: "กรุณาเข้าสู่ระบบ" };
  }

  // 3. Evaluate by accessType
  if (accessType === "public") {
    const canWrite = permLevel === "read_write";
    return {
      canRead: true,
      canWrite,
      canManage: canWrite,
    };
  }

  if (accessType === "role") {
    const hasRole = roles.length === 0 || roles.includes(user.role);
    if (!hasRole) {
      return { canRead: false, canWrite: false, canManage: false, reason: "สิทธิ์บทบาทไม่เพียงพอ" };
    }
    const canWrite = permLevel === "read_write";
    return {
      canRead: true,
      canWrite,
      canManage: canWrite,
    };
  }

  if (accessType === "department") {
    const userDept = (user.department || "").trim().toLowerCase();
    const hasDept = department && userDept === department;
    if (!hasDept) {
      return { canRead: false, canWrite: false, canManage: false, reason: "สิทธิ์แผนกไม่ตรงกัน" };
    }
    const canWrite = permLevel === "read_write";
    return {
      canRead: true,
      canWrite,
      canManage: canWrite,
    };
  }

  if (accessType === "private") {
    const isWhitelisted = users.includes(user.id) || users.includes(user.email);
    if (!isWhitelisted) {
      return { canRead: false, canWrite: false, canManage: false, reason: "โฟลเดอร์ส่วนบุคคล" };
    }
    const canWrite = permLevel === "read_write";
    return {
      canRead: true,
      canWrite,
      canManage: canWrite,
    };
  }

  // Fallback default
  const defaultCanWrite = permLevel === "read_write";
  return {
    canRead: true,
    canWrite: defaultCanWrite,
    canManage: defaultCanWrite,
  };
}
