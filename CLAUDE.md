# Instructions for Claude and other AI Assistants

Please follow all instructions and rules in:
- @AGENTS.md
- @docs/MODULE_DEVELOPMENT_GUIDE.md

Key Rules Summary:
1. Always use `@/core/components/ui/ModuleLayout` for all modules.
2. Never add redundant trash icons to card faces. Keep cards clean (Synology DSM style).
3. Deletion must only be via Top Action Bar (when selected) or Right-Click Context Menu.
4. No Docker in production. Use PM2: `rm -rf .next && npm run build && npm run pm2:restart`.
5. Support SQLite, MySQL, and PostgreSQL seamlessly.
6. 100% Thai date format (Buddhist Era พ.ศ.).
7. Never re-introduce the word "vorssaint".
