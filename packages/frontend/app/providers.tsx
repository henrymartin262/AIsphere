"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider, lightTheme } from "@rainbow-me/rainbowkit";
import { type PropsWithChildren, useState, useEffect } from "react";
import { WagmiProvider, useAccount } from "wagmi";

import { createWagmiConfig } from "../lib/wagmiConfig";
import { LangProvider } from "../contexts/LangContext";
import { ThemeProvider } from "../contexts/ThemeContext";
import { ComputeProvider } from "../contexts/ComputeContext";
import { setApiWalletAddress, setApiJwt } from "../lib/api";
import { useAuth } from "../hooks/useAuth";

/** 钱包连接后自动完成 SIWE 签名登录，获取 JWT */
function WalletSync({ children }: PropsWithChildren) {
  const { address } = useAccount();
  const { status } = useAuth(); // triggers auto sign-in on connect

  useEffect(() => {
    if (!address) {
      setApiWalletAddress(null);
      setApiJwt(null);
    }
    // JWT + wallet address are set inside useAuth on success
  }, [address, status]);

  return <>{children}</>;
}

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
          <WalletSync>
            <ComputeProvider>
              <ThemeProvider>
                <LangProvider>
                  {children}
                </LangProvider>
              </ThemeProvider>
            </ComputeProvider>
          </WalletSync>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
