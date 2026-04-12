import dynamic from "next/dynamic";
import type { Metadata } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "@rainbow-me/rainbowkit/styles.css";
import "./globals.css";

import { Navbar } from "../components/Navbar";
import { RoutePrefetcher } from "../components/RoutePrefetcher";

const HexGridBackground = dynamic(
  () => import("../components/HexGrid").then((mod) => mod.HexGrid),
  { ssr: false }
);

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const spaceGrotesk = Space_Grotesk({ subsets: ["latin"], variable: "--font-display" });

/* ── Loading 骨架屏：Providers 加载完成前展示 ── */
function AppSkeleton() {
  return (
    <div className="min-h-screen bg-[#faf8f5]">
      {/* Navbar skeleton */}
      <header className="sticky top-0 z-40 border-b border-orange-100/50 bg-white/60 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 animate-pulse rounded-xl bg-gradient-to-br from-orange-100 to-amber-50" />
            <div>
              <div className="h-4 w-24 animate-pulse rounded bg-orange-100" />
              <div className="mt-1 h-2.5 w-36 animate-pulse rounded bg-orange-50" />
            </div>
          </div>
          <div className="hidden md:flex items-center gap-1 rounded-full border border-orange-100/50 bg-orange-50/40 p-1">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-7 w-16 animate-pulse rounded-full bg-orange-100/40" />
            ))}
          </div>
          <div className="h-10 w-28 animate-pulse rounded-full bg-gradient-to-r from-orange-100 to-violet-100/50" />
        </div>
      </header>
      {/* Content skeleton */}
      <main className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col gap-8">
          <div className="h-80 animate-pulse rounded-2xl border border-orange-100/40 bg-white/50" />
          <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 animate-pulse rounded-2xl border border-orange-100/40 bg-white/50" />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}

const Providers = dynamic(() => import("./providers").then((mod) => mod.Providers), {
  ssr: false,
  loading: () => <AppSkeleton />
});

export const metadata: Metadata = {
  title: "SealMind — Privacy-Sovereign AI Agent OS",
  description: "Build truly sovereign AI Agents with verifiable inference and encrypted memory on 0G Network.",
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
  openGraph: {
    title: "SealMind — Privacy-Sovereign AI Agent OS",
    description: "Build truly sovereign AI Agents with verifiable inference and encrypted memory on 0G Network.",
    siteName: "SealMind",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "SealMind",
    description: "Privacy-Sovereign AI Agent OS on 0G Network",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="font-sans">
        <Providers>
          <HexGridBackground />
          <div className="relative z-10 min-h-screen">
            <Navbar />
            {children}
          </div>
          <RoutePrefetcher />
        </Providers>
      </body>
    </html>
  );
}
