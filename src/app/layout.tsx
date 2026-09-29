import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DCMS Core OS - Web Desktop",
  description: "Modular, Pluggable Web Desktop OS with Next.js and Docker Compose",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="th" className="h-full overflow-hidden select-none">
      <body className="h-full w-full overflow-hidden bg-[#0d091e] text-slate-100 antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
