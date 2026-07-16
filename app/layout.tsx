import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "3D/4D World Model 学习地图 · 2026",
  description:
    "从 NeRF、DUSt3R、VGGT 到 D4RT、FlashWorld 与概率物理世界模型：梳理 3D/4D 表征、分布学习、持久记忆与动作条件预测。",
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
