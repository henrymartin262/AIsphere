import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http } from "viem";

export const ogTestnet = defineChain({
  id: 16602,
  name: "0G Galileo Testnet",
  nativeCurrency: {
    name: "OG",
    symbol: "OG",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://evmrpc-testnet.0g.ai"]
    },
    public: {
      http: ["https://evmrpc-testnet.0g.ai"]
    }
  },
  blockExplorers: {
    default: {
      name: "0G Galileo Explorer",
      url: "https://chainscan-galileo.0g.ai"
    }
  },
  testnet: true
});

export const ogMainnet = defineChain({
  id: 16661,
  name: "0G Mainnet",
  nativeCurrency: {
    name: "OG",
    symbol: "OG",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://evmrpc.0g.ai"]
    },
    public: {
      http: ["https://evmrpc.0g.ai"]
    }
  },
  blockExplorers: {
    default: {
      name: "0G Explorer",
      url: "https://chainscan.0g.ai"
    }
  }
});

export function createWagmiConfig() {
  const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "sealmind-dev-walletconnect-project-id";

  return getDefaultConfig({
    appName: "SealMind",
    projectId: walletConnectProjectId,
    ssr: true,
    chains: [ogTestnet, ogMainnet],
    transports: {
      [ogTestnet.id]: http(ogTestnet.rpcUrls.default.http[0]),
      [ogMainnet.id]: http(ogMainnet.rpcUrls.default.http[0])
    }
  });
}
