import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { ensureDatabaseReady } from "@/core/database";
import { getSessionUser } from "@/core/lib/auth";

const MAX_IMAGE_SIZE_BYTES = 25 * 1024 * 1024; // 25 MB

function getExtensionFromMime(mime: string): string {
  const lower = mime.toLowerCase();
  if (lower.includes("image/jpeg") || lower.includes("image/jpg")) return ".jpg";
  if (lower.includes("image/png")) return ".png";
  if (lower.includes("image/webp")) return ".webp";
  if (lower.includes("image/gif")) return ".gif";
  if (lower.includes("image/svg")) return ".svg";
  if (lower.includes("image/avif")) return ".avif";
  return ".jpg";
}

export async function POST(req: Request) {
  try {
    const sessionUser = await getSessionUser();
    if (!sessionUser) {
      return NextResponse.json(
        { error: "กรุณาเข้าสู่ระบบก่อนทำการบันทึกภาพพื้นหลัง" },
        { status: 401 }
      );
    }

    const body = await req.json().catch(() => ({}));
    let targetUrl = (body.url || "").trim();
    const customName = (body.name || "").trim();

    if (!targetUrl) {
      return NextResponse.json(
        { error: "กรุณาระบุ URL ของรูปภาพ" },
        { status: 400 }
      );
    }

    if (!targetUrl.startsWith("http://") && !targetUrl.startsWith("https://")) {
      return NextResponse.json(
        { error: "URL ต้องขึ้นต้นด้วย http:// หรือ https://" },
        { status: 400 }
      );
    }

    // Step 1: Fetch target URL with browser-like headers
    const browserHeaders = {
      "User-Agent":
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
      Accept:
        "image/avif,image/webp,image/apng,image/svg+xml,image/*,text/html;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9,th;q=0.8",
    };

    let response = await fetch(targetUrl, {
      headers: browserHeaders,
      redirect: "follow",
    });

    if (!response.ok) {
      return NextResponse.json(
        {
          error: `ไม่สามารถเข้าถึง URL ได้ (สถานะ HTTP ${response.status}: ${response.statusText})`,
        },
        { status: 400 }
      );
    }

    let contentType = response.headers.get("content-type") || "";

    // Step 2: If the response is HTML, check for og:image or twitter:image
    if (contentType.includes("text/html")) {
      const htmlText = await response.text();
      const ogMatch =
        htmlText.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) ||
        htmlText.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i) ||
        htmlText.match(/<meta\s+name=["']twitter:image["']\s+content=["']([^"']+)["']/i) ||
        htmlText.match(/<meta\s+content=["']([^"']+)["']\s+name=["']twitter:image["']/i);

      if (ogMatch && ogMatch[1]) {
        let extractedImageUrl = ogMatch[1];
        if (extractedImageUrl.startsWith("//")) {
          extractedImageUrl = "https:" + extractedImageUrl;
        } else if (extractedImageUrl.startsWith("/")) {
          const parsed = new URL(targetUrl);
          extractedImageUrl = `${parsed.protocol}//${parsed.host}${extractedImageUrl}`;
        }

        // Fetch the extracted og:image
        targetUrl = extractedImageUrl;
        response = await fetch(targetUrl, {
          headers: browserHeaders,
          redirect: "follow",
        });

        if (!response.ok) {
          return NextResponse.json(
            { error: "พบลิงก์ภาพตัวอย่างในหน้าเว็บ แต่ไม่สามารถดาวน์โหลดภาพได้" },
            { status: 400 }
          );
        }
        contentType = response.headers.get("content-type") || "";
      } else {
        return NextResponse.json(
          {
            error:
              "URL ที่ระบุเป็นหน้าเว็บเพจ ไม่ใช่ลิงก์ไฟล์รูปภาพโดยตรง กรุณาคัดลอกที่อยู่รูปภาพ (Copy Image Address เช่น .jpg, .png)",
          },
          { status: 400 }
        );
      }
    }

    if (!contentType.includes("image/")) {
      return NextResponse.json(
        {
          error: `ไฟล์จาก URL ไม่ใช่รูปภาพ (ประเภทไฟล์: ${contentType || "ไม่ทราบ"}) กรุณาตรวจสอบลิงก์อีกครั้ง`,
        },
        { status: 400 }
      );
    }

    // Step 3: Read image array buffer
    const arrayBuffer = await response.arrayBuffer();
    if (arrayBuffer.byteLength > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "รูปภาพจาก URL มีขนาดใหญ่เกินไป (สูงสุด 25 MB)" },
        { status: 400 }
      );
    }

    if (arrayBuffer.byteLength === 0) {
      return NextResponse.json(
        { error: "ไม่พบข้อมูลรูปภาพจาก URL ดังกล่าว" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(arrayBuffer);
    const ext = getExtensionFromMime(contentType);
    const uniqueFilename = `${Date.now()}_web_${Math.random().toString(36).slice(2, 8)}${ext}`;

    const uploadDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, uniqueFilename);
    await fs.promises.writeFile(filePath, buffer);

    const fileUrl = `/uploads/${uniqueFilename}`;
    const id = `file-web-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const finalName = customName || `Web Wallpaper (${new URL(targetUrl).hostname})`;

    const db = await ensureDatabaseReady();
    await db.execute(
      `INSERT INTO files (id, filename, original_name, mime_type, size_bytes, url, folder_id, uploaded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        uniqueFilename,
        finalName,
        contentType.split(";")[0],
        buffer.length,
        fileUrl,
        "root",
        sessionUser.name,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "ดึงและบันทึกภาพจากเว็บเรียบร้อยแล้ว",
      file: {
        id,
        filename: uniqueFilename,
        originalName: finalName,
        mimeType: contentType.split(";")[0],
        sizeBytes: buffer.length,
        url: fileUrl,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงภาพจาก URL: " + (err.message || String(err)) },
      { status: 500 }
    );
  }
}
