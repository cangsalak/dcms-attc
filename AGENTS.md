<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# DCMS Core OS - Mandatory AI Agent Instructions & Architectural Rules

You are working on the **DCMS Core Web Desktop OS** project. All AI assistants (Antigravity, Claude, Gemini, Cursor, Copilot, ChatGPT, etc.) must strictly adhere to the following rules without exception.

---

## 1. Module Development & Standard UX/UI (MANDATORY)

Every module in DCMS must be created in `src/modules/<module_name>/` and **MUST** use the shared default design system in `@/core/components/ui/ModuleLayout`.

### Mandatory Components:
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

### Golden UX/UI Rules:
1. **NO Redundant Trash Icons**:
   - ❌ NEVER put multiple trash icons on cards or embed trash buttons on thumbnail previews.
   - ✅ Keep cards clean and minimal (icon + title only).
   - ✅ Deletion must ONLY be accessible via the **Top Action Bar** (when item is selected) and/or the **Right-Click Context Menu (`ModuleContextMenu`)**.
2. **Design Language (Synology DSM Style)**:
   - Modern, sleek, dark desktop OS aesthetic (`#120e24` base background).
   - Consistent typography, subtle glass borders (`border-white/10`), rounded corners (`rounded-xl` / `rounded-2xl`).
   - Every window app must feature `ModuleToolbar` at top and `ModuleFooter` at bottom.
   - For complete guidelines and boilerplate templates, read [`docs/MODULE_DEVELOPMENT_GUIDE.md`](docs/MODULE_DEVELOPMENT_GUIDE.md).

---

## 2. Infrastructure & Deployment Rules

1. **NO DOCKER for Production**:
   - The user has explicitly mandated that Docker consumes too much RAM and system resources.
   - Production is managed directly via **Node.js and PM2**.
   - Build & Restart command:
     ```bash
     rm -rf .next && npm run build && npm run pm2:restart
     ```
   - (Or `npm run pm2:start` if starting fresh).

2. **Multi-Database Support**:
   - Support SQLite (`better-sqlite3`), MySQL (`mysql2`), and PostgreSQL (`pg`).
   - All migrations and queries must support SQLite, MySQL, and PostgreSQL seamlessly through `@/core/database`.

3. **100% Thai Date & Localization**:
   - Dates must be in Thai Buddhist Era (พ.ศ.) using `@/core/lib/dateFormat` or `toLocaleDateString("th-TH")`.
   - Settings in "วันที่ & ภาษา" allow users to toggle formats.

4. **Authentication & Session**:
   - Mandatory login screen on entry. Default superadmin: `admin@dcms.local` / `admin123`.
   - Use `useAuth()` in client components and `getSessionUser()` from `@/core/lib/auth` in API routes.

5. **Naming & Branding**:
   - Do NOT use the word "vorssaint". The system name is **DCMS**.
