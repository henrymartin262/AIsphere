import dynamic from "next/dynamic";
import type { Metadata } from "next";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

import { Navbar } from "../components/Navbar";

const Providers = dynamic(() => import("./providers").then((mod) => mod.Providers), {
  ssr: false
});

export const metadata: Metadata = {
  title: "SealMind",
  description: "Privacy-Sovereign AI Agent Operating System on 0G"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <Providers>
          <div className="min-h-screen bg-background text-foreground">
            <Navbar />
            {children}
          </div>
        </Providers>
      </body>
    </html>
  );
}
