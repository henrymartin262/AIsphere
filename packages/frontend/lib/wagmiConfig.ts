import { getDefaultConfig } from "@rainbow-me/rainbowkit";
import { defineChain, http, fallback } from "viem";

/* ── 0G Testnet：多 RPC + 超时 ── */
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

/* ── 0G Mainnet：多 RPC + 超时 ── */
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

/* ── RPC transport 配置：超时 8s + 重试 2 次 + fallback ── */
const RPC_TIMEOUT = 8_000; // 8 秒超时
const RPC_RETRY = { count: 2, delay: 500 };

const testnetTransport = fallback([
  http(ogTestnet.rpcUrls.default.http[0], { timeout: RPC_TIMEOUT, retryCount: RPC_RETRY.count, retryDelay: RPC_RETRY.delay }),
  http("https://16602.rpc.thirdweb.com", { timeout: RPC_TIMEOUT, retryCount: RPC_RETRY.count, retryDelay: RPC_RETRY.delay }),
]);

const mainnetTransport = fallback([
  http(ogMainnet.rpcUrls.default.http[0], { timeout: RPC_TIMEOUT, retryCount: RPC_RETRY.count, retryDelay: RPC_RETRY.delay }),
]);

export function createWagmiConfig() {
  const walletConnectProjectId =
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || undefined;

  return getDefaultConfig({
    appName: "SealMind",
    /* 没有 projectId 时传 undefined，RainbowKit 会跳过 WalletConnect 初始化，避免假 ID 超时 */
    projectId: walletConnectProjectId ?? "placeholder",
    ssr: true,
    chains: [ogMainnet, ogTestnet],
    transports: {
      [ogMainnet.id]: mainnetTransport,
      [ogTestnet.id]: testnetTransport
    }
  });
}
