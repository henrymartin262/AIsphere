"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RainbowKitProvider } from "@rainbow-me/rainbowkit";
import { type PropsWithChildren, useState } from "react";
import { WagmiProvider } from "wagmi";

import { createWagmiConfig } from "../lib/wagmiConfig";
import { LangProvider } from "../contexts/LangContext";

export function Providers({ children }: PropsWithChildren) {
  const [queryClient] = useState(() => new QueryClient());
  const [wagmiConfig] = useState(() => createWagmiConfig());

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <LangProvider>
            {children}
          </LangProvider>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
