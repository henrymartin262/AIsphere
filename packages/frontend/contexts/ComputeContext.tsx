"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from "react";
import { useAccount, useChainId } from "wagmi";
import { apiGet, setApiWalletAddress } from "../lib/api";

interface ComputeAccountRaw {
  balance: string;
  available: string;
  locked: string;
}

export type ComputeStatus = "loading" | "unstaked" | "ready" | "error";

export interface ComputeState {
  status: ComputeStatus;
  /** Total staked balance (A0GI) */
  balance: string;
  /** Available (unlocked) balance (A0GI) */
  available: string;
  /** Human-readable network name */
  networkName: string;
  /** Re-fetch compute account info */
  refetch: () => void;
}

const ComputeContext = createContext<ComputeState>({
  status: "loading",
  balance: "0",
  available: "0",
  networkName: "0G Network",
  refetch: () => {},
});

export function useCompute() {
  return useContext(ComputeContext);
}

function getNetworkName(chainId: number): string {
  if (chainId === 16602) return "0G Testnet · Galileo";
  if (chainId === 16600) return "0G Mainnet";
  return `Chain ${chainId}`;
}

export function ComputeProvider({ children }: PropsWithChildren) {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  const [status, setStatus] = useState<ComputeStatus>("loading");
  const [balance, setBalance] = useState("0");
  const [available, setAvailable] = useState("0");

  const networkName = getNetworkName(chainId);

  const fetch = useCallback(() => {
    if (!isConnected || !address) {
      setStatus("loading");
      return;
    }
    setApiWalletAddress(address);
    apiGet<ComputeAccountRaw>("/compute/account")
      .then((data) => {
        const bal = parseFloat(data.balance ?? "0");
        setBalance(data.balance ?? "0");
        setAvailable(data.available ?? data.balance ?? "0");
        setStatus(bal > 0 ? "ready" : "unstaked");
      })
      .catch(() => setStatus("error"));
  }, [address, isConnected]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return (
    <ComputeContext.Provider value={{ status, balance, available, networkName, refetch: fetch }}>
      {children}
    </ComputeContext.Provider>
  );
}
