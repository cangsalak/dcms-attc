# DCMS Core OS - คู่มือมาตรฐานการพัฒนาโมดูล (Module Development Guide)
> สำหรับนักพัฒนาและ AI ทุกตัว (AI Agent Instructions & Developer Standards)

คู่มือนี้กำหนดมาตรฐานกลางในการพัฒนาและเพิ่มโมดูลใหม่ลงในระบบ **DCMS Core Web Desktop OS** เพื่อให้ทุกโมดูลมีรูปแบบการทำงาน, โครงสร้างโค้ด, และประสบการณ์ผู้ใช้งาน (UX/UI) ที่สวยงาม สอดคล้อง และเป็นหนึ่งเดียวกันสไตล์ **Synology DSM**

---

## 🏛️ 1. สถาปัตยกรรมแบบแยกอิสระ (Decoupled Module Architecture)

ทุกโมดูลต้องอยู่ภายใต้ไดเรกทอรี `src/modules/<module_name>/` และห้ามผูกมัดหรือเขียนโค้ดทับ Core Components โดยตรง:

```
src/
├── core/                           # แกนกลางของ Desktop OS (ห้ามแก้ไข logic สำหรับโมดูลเฉพาะ)
│   ├── components/
│   │   ├── ui/
│   │   │   └── ModuleLayout.tsx    # ⭐ ชุดคอมโพเนนต์ UX/UI มาตรฐานกลาง (บังคับใช้ทุกโมดูล)
│   │   ├── DesktopSurface.tsx      # พื้นหลังเดสก์ท็อปและหน้าต่าง
│   │   ├── TopMenuBar.tsx          # แถบเมนูด้านบน
│   │   ├── DockBar.tsx             # ด็อกด้านล่าง
│   │   └── SynologyWidgets.tsx     # วิดเจ็ตระบบ
│   ├── context/
│   │   ├── AuthContext.tsx         # ระบบผู้ใช้งานและ Session
│   │   └── WindowManagerContext.tsx# ระบบจัดการหน้าต่าง
│   ├── database/                   # ระบบฐานข้อมูล (SQLite / MySQL / Postgres)
│   ├── lib/
│   │   ├── auth.ts                 # ตรวจสอบสิทธิ์และผู้ใช้ปัจจุบัน
│   │   └── dateFormat.ts           # แปลงวันที่ภาษาไทย พ.ศ. 100%
│   └── registry/
│       └── module-registry.ts      # Core Dynamic Plugin Registry (ไม่ผูกติดโมดูลเฉพาะ)
│
└── modules/                        # โฟลเดอร์สำหรับโมดูลปลั๊กอินอิสระ
    ├── index.ts                    # จุดรวมโมดูลภายใน (Decoupled Extension Map)
    ├── files/                      # โมดูลจัดการไฟล์ (File Station)
    ├── users/                      # โมดูลจัดการผู้ใช้งาน (Users Module)
    └── <your_new_module>/          # โมดูลใหม่ที่ผู้อื่นเขียนขึ้น
        ├── components/
        │   └── YourModuleApp.tsx   # หน้าหลักของโมดูล (ใช้ ModuleLayout)
        ├── module.config.ts        # นิยาม AppModule
        └── types.ts                # TypeScript Interfaces
```

### 🌟 2 รูปแบบในการเพิ่ม App ใหม่โดยผู้อื่น (2 Ways to Add 3rd-Party Apps)

ระบบ DCMS ได้รับการออกแบบให้แยกขาดจากกัน (Decoupled Architecture) เพื่อให้ผู้อื่นสามารถพัฒนาและเพิ่มแอปพลิเคชันได้ 2 วิธี:

#### วิธีที่ 1: Internal React Module (เขียนด้วย Next.js / React ภายใน)
- สร้างโฟลเดอร์ใหม่ใน `src/modules/<app_name>/`
- ใช้คอมโพเนนต์มาตรฐาน `@/core/components/ui/ModuleLayout`
- นำโมดูลไปลงทะเบียนใน `src/modules/index.ts`
- **ข้อดี**: ลื่นไหล ไร้รอยต่อ ใช้ธีมและหน้าต่างของ OS โดยตรง และไม่ต้องแก้ไขไฟล์ใน `src/core/` แม้แต่ไฟล์เดียว

#### วิธีที่ 2: External Web App / Micro-Frontend (เขียนด้วยภาษา/เฟรมเวิร์กใดก็ได้!)
- นักพัฒนาภายนอกสามารถเขียนแอปด้วย **Vue, React, Svelte, Angular, Python FastAPI/Streamlit, Go, Node.js หรือ PHP**
- รันเซิร์ฟเวอร์หรือโฮสต์แอปพลิเคชันไว้ที่ URL ปลายทาง (เช่น `http://localhost:8080` หรือ `https://app.company.com`)
- กดปุ่ม **"เพิ่มแอปภายนอก (Add 3rd-Party App)"** ใน **App Store** กรอกชื่อและ URL
- ระบบจะสร้างหน้าต่าง Native Desktop OS ให้ทันทีผ่าน `ExternalAppRunner` โดยมี Address Bar, ปุ่มรีเฟรช, ปุ่มเปิดแท็บใหม่, และสภาพแวดล้อม Isolated Sandbox 100%

---

## 🎨 2. มาตรฐาน UX/UI กลาง (บังคับใช้ทุกโมดูล 100%)

ทุกโมดูลต้อง Import และใช้งานชุดคอมโพเนนต์มาตรฐานจาก `@/core/components/ui/ModuleLayout`:

```tsx
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";
```

### รายละเอียดคอมโพเนนต์มาตรฐาน:

| คอมโพเนนต์ | หน้าที่ | คุณสมบัติและการใช้งาน |
| :--- | :--- | :--- |
| `<ModuleContainer>` | กล่องครอบหน้าต่างหลัก | จัดการพื้นหลังสี `#120e24`, ฟอนต์ และขนาดหน้าต่างอัตโนมัติ |
| `<ModuleToolbar>` | แถบเครื่องมือด้านบน | มีปุ่มหลักด้านซ้าย (`leftActions`), ปุ่มเฉพาะเมื่อเลือกรายการ (`selectedActions`), ช่องค้นหา, ปุ่ม Grid/List, และปุ่มรีเฟรช |
| `<ModuleButton>` | ปุ่มกดมาตรฐาน | มี Variant: `'primary'` (สีน้ำเงิน), `'secondary'` (สีขาวกระจก), `'danger'` (สีแดงกุหลาบ), `'warning'` (สีส้ม), `'ghost'` (โปร่งใส) |
| `<ModuleContextMenu>` | เมนูลอยคลิกขวา | เมนูคลิกขวา (Right-Click) สไตล์ Synology DSM รองรับ divider และ danger item |
| `<ModuleFooter>` | แถบสถานะด้านล่าง | สรุปจำนวนรายการฝั่งซ้าย (`leftContent`), รายการที่เลือก (`selectedText`), และสถานะฝั่งขวา (`● Online`) |
| `<ModuleModal>` | หน้าต่างป็อปอัป/โมดอล | มีหัวเรื่อง, ไอคอน, ปุ่มปิด (X), เนื้อหาฟอร์ม และปุ่มตกลง/ยกเลิก |

---

## 🚫 3. กฎเหล็กด้าน UX/UI (UX/UI Golden Rules)

1. **ห้ามแสดงไอคอนลบ (Trash) ซ้ำซ้อนเด็ดขาด**:
   - ❌ **ห้าม**: ใส่ไอคอนถังขยะหลายๆ อันบนหน้าการ์ด หรือใส่ไอคอนถังขยะลอยบนรูปภาพ
   - ✅ **สิ่งที่ถูกต้อง**: ตัวการ์ดต้องสะอาดตา มีเพียงรูป/ไอคอน และชื่อรายการ เมื่อคลิกเลือกรายการ ปุ่ม **"ลบ"** จะปรากฏบน **Top Action Bar** หรือกดลบผ่าน **คลิกขวา (Right-Click Context Menu)** สไตล์ Synology DSM
2. **คุมโทนสีและสไตล์ให้เรียบหรู (Synology DSM Aesthetics)**:
   - พื้นหลัง: สีเข้มโทนคราม `#120e24` และ `#181330`
   - เส้นขอบ: `border-white/10` หรือ `border-white/15`
   - แถบเตือนข้อมูล: ใช้สีและไอคอนตามมาตรฐาน (ฟ้า = ข้อมูล, เขียว = สำเร็จ, ส้ม = คำเตือน, แดง = ข้อผิดพลาด)
3. **วันที่และเวลา**:
   - ต้องใช้ฟังก์ชัน `formatThaiDate` จาก `@/core/lib/dateFormat` หรือ `new Date().toLocaleDateString("th-TH")` ให้เป็นปี พ.ศ. เสมอ

---

## 📝 4. เทมเพลตเริ่มต้นสำหรับการสร้างโมดูลใหม่ (Boilerplate Template)

เมื่อ AI หรือนักพัฒนาสร้างโมดูลใหม่ สามารถคัดลอกโครงสร้างนี้ไปใช้เป็นหน้าหลักได้ทันที:

```tsx
"use client";

import React, { useState, useEffect } from "react";
import { Plus, Trash2, Edit2, Download, Share2, Eye, Box } from "lucide-react";
import {
  ModuleContainer,
  ModuleToolbar,
  ModuleButton,
  ModuleContextMenu,
  ModuleFooter,
  ModuleModal,
} from "@/core/components/ui/ModuleLayout";

interface ItemRecord {
  id: string;
  name: string;
  category: string;
  createdAt: string;
}

export function SampleModuleApp({ windowId }: { windowId: string }) {
  const [items, setItems] = useState<ItemRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; item: ItemRecord } | null>(null);

  // 1. โหลดข้อมูล
  const loadData = async () => {
    setIsLoading(true);
    try {
      // เรียก fetch API ของโมดูล
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedItem = items.find((i) => i.id === selectedId);

  // 2. Action เมื่อกดลบ
  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`คุณต้องการลบ "${name}" หรือไม่?`)) return;
    setItems((prev) => prev.filter((i) => i.id !== id));
    if (selectedId === id) setSelectedId(null);
  };

  return (
    <ModuleContainer
      onContextMenu={(e) => {
        if (e.target === e.currentTarget) {
          e.preventDefault();
          setContextMenu(null);
        }
      }}
    >
      {/* แถบเครื่องมือด้านบน (Toolbar) */}
      <ModuleToolbar
        leftActions={
          <ModuleButton
            variant="primary"
            icon={Plus}
            onClick={() => setShowCreateModal(true)}
          >
            สร้างรายการใหม่
          </ModuleButton>
        }
        selectedActions={
          selectedItem ? (
            <>
              <ModuleButton
                variant="secondary"
                icon={Edit2}
                onClick={() => alert(`แก้ไข ${selectedItem.name}`)}
              >
                แก้ไข
              </ModuleButton>
              <ModuleButton
                variant="danger"
                icon={Trash2}
                onClick={() => handleDelete(selectedItem.id, selectedItem.name)}
              >
                ลบ
              </ModuleButton>
            </>
          ) : null
        }
        search={search}
        onSearchChange={setSearch}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onRefresh={loadData}
        isRefreshing={isLoading}
      />

      {/* เนื้อหาหลัก (Content Area) */}
      <div
        onClick={() => {
          setSelectedId(null);
          setContextMenu(null);
        }}
        className="flex-1 overflow-auto p-4"
      >
        {viewMode === "grid" ? (
          /* Grid View: การ์ดต้องสะอาดตา ไม่มีปุ่มลบแปะทับตัวการ์ด */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {items.map((item) => {
              const isSelected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedId(item.id);
                  }}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setSelectedId(item.id);
                    setContextMenu({ x: e.clientX, y: e.clientY, item });
                  }}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? "bg-blue-600/20 border-blue-500 shadow-md ring-1 ring-blue-400/30"
                      : "bg-white/[0.02] border-white/10 hover:border-white/20 hover:bg-white/[0.05]"
                  }`}
                >
                  <div className="w-full h-24 rounded-lg bg-black/30 border border-white/5 flex items-center justify-center mb-2">
                    <Box className="w-10 h-10 text-cyan-400" />
                  </div>
                  <div className="text-xs font-semibold text-white truncate text-center">
                    {item.name}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* List View */
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-slate-400 uppercase">
                <th className="py-2.5 px-3">ชื่อ</th>
                <th className="py-2.5 px-3">หมวดหมู่</th>
                <th className="py-2.5 px-3">วันที่สร้าง</th>
                <th className="py-2.5 px-3 text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedId(item.id)}
                  className={`cursor-pointer ${selectedId === item.id ? "bg-blue-600/20" : "hover:bg-white/[0.02]"}`}
                >
                  <td className="py-2.5 px-3 font-medium text-white">{item.name}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.category}</td>
                  <td className="py-2.5 px-3 text-slate-400">{item.createdAt}</td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(item.id, item.name);
                      }}
                      className="p-1 rounded hover:bg-rose-500/20 text-slate-400 hover:text-rose-400"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* แถบสถานะด้านล่าง (Footer) */}
      <ModuleFooter
        leftContent={`ทั้งหมด ${items.length} รายการ`}
        selectedText={selectedItem ? `เลือก: ${selectedItem.name}` : null}
      />

      {/* เมนูคลิกขวา (Context Menu) */}
      {contextMenu && (
        <ModuleContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          items={[
            {
              label: "แก้ไข",
              icon: Edit2,
              onClick: () => alert(`แก้ไข ${contextMenu.item.name}`),
            },
            { divider: true },
            {
              label: "ลบรายการ",
              icon: Trash2,
              danger: true,
              onClick: () => handleDelete(contextMenu.item.id, contextMenu.item.name),
            },
          ]}
        />
      )}

      {/* หน้าต่างโมดอลสร้างรายการใหม่ */}
      <ModuleModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="สร้างรายการใหม่"
        icon={Plus}
        maxWidth="max-w-md"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setShowCreateModal(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">
              ชื่อรายการ
            </label>
            <input
              type="text"
              required
              className="w-full px-3 py-2 text-xs rounded-xl bg-black/40 border border-white/15 text-white focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="flex justify-end gap-2 pt-3 border-t border-white/10">
            <button
              type="button"
              onClick={() => setShowCreateModal(false)}
              className="px-3.5 py-1.5 text-xs rounded-lg hover:bg-white/10 text-slate-300"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="px-4 py-1.5 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold"
            >
              บันทึก
            </button>
          </div>
        </form>
      </ModuleModal>
    </ModuleContainer>
  );
}
```

---

## 🔌 5. การลงทะเบียนโมดูลเข้า Desktop OS (Registration)

เมื่อสร้างโมดูลเสร็จ ให้ลงทะเบียนในไฟล์ [src/core/registry/moduleRegistry.ts](file:///Users/cangsalak/project/dcms_attc/src/core/registry/moduleRegistry.ts):

```typescript
import { YourModuleApp } from "@/modules/your_module/components/YourModuleApp";

// เพิ่มใน array registeredModules:
{
  id: "your-module-id",
  name: "ชื่อโมดูล (ภาษาไทย)",
  version: "1.0.0",
  icon: "Box", // ไอคอน Lucide Icon
  color: "from-blue-600 to-indigo-600",
  defaultWidth: 960,
  defaultHeight: 620,
  component: YourModuleApp,
  enabled: true,
}
```

---

## 🚀 6. คำสั่ง Build และ Deploy สำหรับ Production
เมื่อปรับปรุงหรือสร้างโมดูลใหม่เสร็จแล้ว ต้องทดสอบ build และ restart ผ่าน PM2 เสมอ:

```bash
rm -rf .next && npm run build && npm run pm2:restart
```
> ⚠️ **คำเตือน**: ห้ามใช้ Docker สำหรับ Production ตามคำสั่งผู้ใช้ ให้ใช้คำสั่ง PM2 ด้านบนเสมอ
