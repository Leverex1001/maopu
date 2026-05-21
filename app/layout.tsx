import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "猫扑 - AI 知识地图",
  description: "学习之前，先看见地图。用 AI 生成知识结构地图，理解每门学科为什么存在。"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
