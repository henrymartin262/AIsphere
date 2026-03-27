"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { type PropsWithChildren, useState } from "react";
import { WagmiProvider } from "wagmi";

import { createWagmiConfig } from "../lib/wagmiConfig";
import { LangProvider } from "../contexts/LangContext";

/* ── 自定义 RainbowKit 暖色主题 ── */
const warmTheme = lightTheme({
  accentColor: "#f97316",
  accentColorForeground: "white",
  borderRadius: "large",
  fontStack: "system",
  overlayBlur: "small",
});

/* 深度覆盖更多样式 */
const customTheme = {
  ...warmTheme,
  colors: {
    ...warmTheme.colors,
    connectButtonBackground: "#fff7ed",
    connectButtonInnerBackground: "#ffedd5",
    connectButtonText: "#9a3412",
    modalBackground: "#fffbf5",
    modalBorder: "rgba(249, 115, 22, 0.15)",
    profileForeground: "#fffbf5",
    generalBorder: "rgba(249, 115, 22, 0.15)",
    menuItemBackground: "#fff7ed",
  },
  shadows: {
    ...warmTheme.shadows,
    connectButton: "0 2px 12px rgba(249, 115, 22, 0.12)",
    dialog: "0 8px 48px rgba(249, 115, 22, 0.15), 0 2px 8px rgba(0,0,0,0.05)",
  },
};

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [wagmiConfig] = useState(() => createWagmiConfig());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={customTheme} modalSize="compact">
          <LangProvider>
            {children}
          </LangProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
