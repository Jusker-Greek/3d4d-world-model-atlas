import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D/4D World Model 问题推进图 · 2026",
  description:
    "29 篇核心论文全文复核：问题谱系、阅读顺序、证据矩阵，以及区分表层 autoencoder 与 pixel-world-pixel 几何理解的逐篇证伪实验。",
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
