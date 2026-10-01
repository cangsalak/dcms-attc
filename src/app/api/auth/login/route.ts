import { NextResponse } from "next/server";
import { ensureDatabaseReady } from "@/core/database";
import { cookies } from "next/headers";
import { verifyPassword, signSession, SessionUser } from "@/core/lib/auth";

// In-memory rate limiting map for brute-force protection
const failedAttemptsMap = new Map<string, { count: number; lockedUntil: number }>();

export async function POST(req: Request) {
  try {
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const now = Date.now();

    // Check brute-force lockout
    const attemptInfo = failedAttemptsMap.get(clientIp);
    if (attemptInfo && attemptInfo.lockedUntil > now) {
      const waitSeconds = Math.ceil((attemptInfo.lockedUntil - now) / 1000);
      return NextResponse.json(
        {
          error: `พยายามเข้าสู่ระบบไม่สำเร็จเกินกำหนด กรุณารออีก ${waitSeconds} วินาที`,
        },
        { status: 429 }
      );
    }

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
      // Record failed attempt
      const curr = failedAttemptsMap.get(clientIp) || { count: 0, lockedUntil: 0 };
      const nextCount = curr.count + 1;
      const lockedUntil = nextCount >= 5 ? now + 60 * 1000 : 0; // Lock for 1 min after 5 failed attempts
      failedAttemptsMap.set(clientIp, { count: nextCount, lockedUntil });

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

    // Verify password with secure hash or legacy plaintext
    const validPassword = user.password || "admin123";
    const isPasswordValid = verifyPassword(password, validPassword);

    if (!isPasswordValid) {
      // Record failed attempt
      const curr = failedAttemptsMap.get(clientIp) || { count: 0, lockedUntil: 0 };
      const nextCount = curr.count + 1;
      const lockedUntil = nextCount >= 5 ? now + 60 * 1000 : 0;
      failedAttemptsMap.set(clientIp, { count: nextCount, lockedUntil });

      return NextResponse.json(
        { error: "รหัสผ่านไม่ถูกต้อง (รหัสเริ่มต้น: admin123)" },
        { status: 401 }
      );
    }

    // Login successful - Reset rate-limit counter
    failedAttemptsMap.delete(clientIp);

    const sessionPayload: SessionUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      department: user.department,
      avatar: user.avatar,
      loginAt: new Date().toISOString(),
    };

    // Sign session token with cryptographic HMAC-SHA256
    const signedToken = signSession(sessionPayload);

    const cookieStore = await cookies();
    cookieStore.set("dcms_session", signedToken, {
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
