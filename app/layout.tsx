import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D/4D World Model 问题推进图 · 2026",
  description:
    "29 篇核心论文全文复核：用问题谱系、可执行阅读顺序和带实验证据的能力矩阵，梳理 3D/4D reconstruction、distribution、memory 与 physical world model。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
