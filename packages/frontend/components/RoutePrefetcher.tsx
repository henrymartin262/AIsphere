"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * 路由预热组件 — 在空闲时预取所有导航路由，触发 Next.js 的按需编译。
 * 用户点击导航链接时就不需要再等待编译了。
 *
 * 使用 router.prefetch() 而非 fetch()，走 Next.js 的内置预加载机制。
 */
const ROUTES_TO_PREFETCH = ["/dashboard", "/explore", "/verify"];

export function RoutePrefetcher() {
  const router = useRouter();

  useEffect(() => {
    // 延迟 1 秒后开始预热，避免与首页渲染竞争资源
    const timer = setTimeout(() => {
      ROUTES_TO_PREFETCH.forEach((route) => {
        router.prefetch(route);
      });
    }, 1000);

    return () => clearTimeout(timer);
  }, [router]);

  // 不渲染任何 DOM
  return null;
}
