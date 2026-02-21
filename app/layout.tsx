import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Navbar from "./components/Navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AI 전문 IT 블로그",
  description: "최신 IT 트렌드와 AI 뉴스를 가장 빠르게 전달합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className={`${inter.className} bg-slate-50 text-slate-900 antialiased`}>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="border-t py-12 bg-white mt-20">
          <div className="max-w-5xl mx-auto px-4 text-center text-slate-500 text-sm">
            © 2026 IT BLOG. All rights reserved.
          </div>
        </footer>
      </body>
    </html>
  );
}
