module.exports = {
  apps: [
    {
      name: "dcms-app",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3000",
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
        // DB_TYPE: "sqlite" | "mysql" | "postgres" (ค่าเริ่มต้นคือ sqlite ประหยัดแรมที่สุด)
        DB_TYPE: process.env.DB_TYPE || "sqlite",
      },
    },
  ],
};
