# DCMS Core OS - Web Desktop (Modular & Multi-Database Architecture)

เว็บแอปพลิเคชันรูปแบบ **Desktop OS** พัฒนาด้วย **Next.js 16 (App Router) + TypeScript + Tailwind CSS**
รันบน **Node.js ผ่าน PM2** (ประหยัดทรัพยากร ไม่กินแรมมหาศาลเหมือน Docker)
พร้อมระบบ **Authentication บังคับ Login ก่อนเข้าใช้งาน**, รองรับ **ภาษาและวันที่แบบไทย 100% (พ.ศ.) ปรับแต่งได้ใน Settings**, และรองรับฐานข้อมูล **SQLite (เบาสุด), MySQL / MariaDB, PostgreSQL**

---

## 🇹🇭 การแสดงผลวันที่ภาษาไทย 100% และการตั้งค่า

ระบบรองรับการแสดงผลวันที่และเวลาเป็นภาษาไทย 100% โดยสามารถปรับแต่งได้ใน **การตั้งค่า (Settings) -> แท็บ "วันที่ & ภาษา"**:
1. **ระบบปีศักราช:** สลับได้ระหว่าง **พุทธศักราช (พ.ศ. 2569)** หรือ **คริสต์ศักราช (ค.ศ. 2026)**
2. **รูปแบบวันที่:**
   * แบบย่อ (แนะนำ): เช่น `อ. 29 ก.ย. 2569`
   * แบบเต็ม: เช่น `วันอังคารที่ 29 กันยายน พ.ศ. 2569`
   * แบบตัวเลข: เช่น `29/09/2569`
3. **รูปแบบเวลา:** 24 ชั่วโมง หรือ 12 ชั่วโมง พร้อมสวิตช์เปิด/ปิด คำว่า `"น."` (เช่น `15:35 น.`)
4. **บันทึกถาวร:** การตั้งค่าจะถูกบันทึกลงในเครื่องของผู้ใช้ (Local Storage) ทำให้ไม่ต้องตั้งใหม่ทุกครั้ง

---

## 🔐 บัญชีเข้าใช้งานระบบเริ่มต้น (Default Login Credentials)

เมื่อเปิดเข้าระบบ ระบบจะแสดงหน้าต่าง **Lock / Login Screen สไตล์ Desktop OS** ทุกคนต้องลงชื่อเข้าใช้ก่อน:

| บัญชี | อีเมล (Email) | รหัสผ่าน (Password) | บทบาท (Role) |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `admin@dcms.local` | `admin123` | ผู้ดูแลระบบสูงสุด |
| **Admin** | `chanikan.w@dcms.local` | `admin123` | ผู้ดูแลระบบ |

*(หน้าจอมีปุ่ม Quick Demo Account ให้กดสลับบัญชีทดสอบได้ใน 1 คลิก)*

---

## ⚡ คำสั่งจัดการระบบผ่าน PM2 (Production)

### 1. Build และ Deploy:
```bash
rm -rf .next && npm run build && npm run pm2:start
```
หรือใช้คำสั่งย่อ:
```bash
npm run deploy
```

### 2. คำสั่งจัดการ PM2 อื่นๆ:
* **ดูสถานะการทำงาน:** `npm run pm2:status` หรือ `pm2 status`
* **รีสตาร์ทระบบ:** `npm run pm2:restart`
* **ดู Log การทำงาน:** `npm run pm2:logs`
* **หยุดการทำงาน:** `npm run pm2:stop`
* **ลบโปรเซสออก:** `npm run pm2:delete`

---

## 🗄️ การสลับฐานข้อมูล (Multi-Database Support)

ตั้งค่าในไฟล์ `.env`:

### ตัวเลือกที่ 1: SQLite (แนะนำ - เบาที่สุด ไม่กินแรม ไม่ต้องลง DB Server)
```env
DB_TYPE=sqlite
SQLITE_FILE_PATH=./data/dcms.sqlite
```

### ตัวเลือกที่ 2: MySQL / MariaDB
```env
DB_TYPE=mysql
DATABASE_URL=mysql://root:password@127.0.0.1:3306/dcms_db
```

### ตัวเลือกที่ 3: PostgreSQL
```env
DB_TYPE=postgres
DATABASE_URL=postgresql://postgres:password@127.0.0.1:5432/dcms_db?schema=public
```
