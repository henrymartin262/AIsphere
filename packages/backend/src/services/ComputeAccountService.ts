import { ethers } from "ethers";
import { initialize0GClients } from "../config/og.js";
import { discoverProviders } from "./SealedInferenceService.js";
import type { ProviderInfo } from "./SealedInferenceService.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface ProviderBalance {
  address: string;
  serviceType: string;
  balance: string;
  pendingRefund: string;
  teeVerified: boolean;
}

export interface AccountInfo {
  balance: string;       // total balance (A0GI)
  available: string;     // available balance (A0GI)
  locked: string;        // locked balance (A0GI)
  providers: ProviderBalance[];
  mock?: boolean;
}

export type { ProviderInfo };

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Convert wei (bigint) to A0GI string with 6 decimal places */
function weiToA0GI(wei: bigint): string {
  return parseFloat(ethers.formatEther(wei)).toFixed(6);
}

// ─── Mock data ────────────────────────────────────────────────────────────────

function mockAccountInfo(): AccountInfo {
  return {
    balance: "10.000000",
    available: "8.500000",
    locked: "1.500000",
    providers: [
      {
        address: "0x0000000000000000000000000000000000000001",
        serviceType: "chatbot",
        balance: "1.500000",
        pendingRefund: "0.000000",
        teeVerified: true
      }
    ],
    mock: true
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

/**
 * Get the current compute account ledger info.
 *
 * LedgerStructOutput fields:
 *   availableBalance: bigint  — unlocked balance
 *   totalBalance: bigint      — total balance including locked
 *
 * getProvidersWithBalance(serviceType) returns [addr, balance, pendingRefund][]
 */
export async function getAccountInfo(): Promise<AccountInfo> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus !== "ready" || !clients.signer) {
    return mockAccountInfo();
  }

  try {
    const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const broker = await createZGComputeNetworkBroker(clients.signer as any);

    // getLedger() → LedgerStructOutput { availableBalance, totalBalance, ... }
    const ledger = await broker.ledger.getLedger();
    const totalWei: bigint = ledger.totalBalance;
    const availableWei: bigint = ledger.availableBalance;
    const lockedWei: bigint = totalWei > availableWei ? totalWei - availableWei : 0n;

    // getProvidersWithBalance returns [addr, balance, pendingRefund][]
    const allProviders = await discoverProviders();
    const providerMap = new Map(allProviders.map((p) => [p.address.toLowerCase(), p]));

    const inferenceProviders = await broker.ledger.getProvidersWithBalance("inference");
    const providerBalances: ProviderBalance[] = inferenceProviders.map(
      ([addr, balance, pendingRefund]) => {
        const provInfo = providerMap.get(addr.toLowerCase());
        return {
          address: addr,
          serviceType: provInfo?.serviceType ?? "inference",
          balance: weiToA0GI(balance),
          pendingRefund: weiToA0GI(pendingRefund),
          teeVerified: provInfo?.teeVerified ?? false
        };
      }
    );

    return {
      balance: weiToA0GI(totalWei),
      available: weiToA0GI(availableWei),
      locked: weiToA0GI(lockedWei),
      providers: providerBalances
    };
  } catch (err) {
    console.warn("[ComputeAccount] getAccountInfo failed, returning mock:", err);
    return mockAccountInfo();
  }
}

/**
 * Deposit funds into the compute ledger.
 * @param amountA0GI - Amount in A0GI as a decimal string (e.g. "1.5")
 *
 * broker.ledger.depositFund(amount: number) takes A0GI as a plain number
 * and returns void — no on-chain tx receipt is exposed by the SDK.
 */
export async function depositFund(
  amountA0GI: string
): Promise<{ amount: string; mock?: boolean }> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus !== "ready" || !clients.signer) {
    return { amount: amountA0GI, mock: true };
  }

  const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker = await createZGComputeNetworkBroker(clients.signer as any);

  // depositFund takes A0GI as a plain number (not wei)
  await broker.ledger.depositFund(parseFloat(amountA0GI));
  return { amount: amountA0GI };
}

/**
 * Transfer funds to a specific provider for inference consumption.
 * @param providerAddress - Provider wallet address
 * @param serviceType     - "inference" or "fine-tuning"
 * @param amountA0GI      - Amount in A0GI (e.g. "0.5")
 *
 * broker.ledger.transferFund(provider, 'inference'|'fine-tuning', bigint) —
 * amount is in neuron (wei); returns void.
 */
export async function transferToProvider(
  providerAddress: string,
  serviceType: string,
  amountA0GI: string
): Promise<{ amount: string; mock?: boolean }> {
  const clients = await initialize0GClients();

  if (clients.brokerStatus !== "ready" || !clients.signer) {
    return { amount: amountA0GI, mock: true };
  }

  // Normalise service type to the SDK's strict union
  const normalisedType: "inference" | "fine-tuning" =
    serviceType === "fine-tuning" ? "fine-tuning" : "inference";

  const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker = await createZGComputeNetworkBroker(clients.signer as any);

  // Convert A0GI to neuron (wei, bigint)
  const amountNeuron = ethers.parseEther(amountA0GI);
  await broker.ledger.transferFund(providerAddress, normalisedType, amountNeuron);

  return { amount: amountA0GI };
}

/**
 * Refund a specific amount from the ledger back to the wallet.
 * @param amountA0GI - Amount to refund in A0GI
 *
 * broker.ledger.refund(amount: number) takes A0GI as a plain number;
 * returns void. This is an immediate refund (not the two-step retrieveFund).
 */
export async function initiateRefund(
  amountA0GI: string
): Promise<{ amount: string; note: string; mock?: boolean }> {
  const clients = await initialize0GClients();

  const note = "Refund submitted. Funds will be returned to your wallet after the settlement period.";

  if (clients.brokerStatus !== "ready" || !clients.signer) {
    return { amount: amountA0GI, note, mock: true };
  }

  const { createZGComputeNetworkBroker } = await import("@0glabs/0g-serving-broker");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const broker = await createZGComputeNetworkBroker(clients.signer as any);

  // refund(amount: number) — A0GI as plain number
  await broker.ledger.refund(parseFloat(amountA0GI));

  return { amount: amountA0GI, note };
}

/**
 * List all available inference providers with TEE verification status.
 */
export async function listProviders(): Promise<ProviderInfo[]> {
  try {
    return await discoverProviders();
  } catch (err) {
    console.warn("[ComputeAccount] listProviders failed:", err);
    return [
      {
        address: "0x0000000000000000000000000000000000000001",
        serviceType: "chatbot",
        url: "https://mock-provider.0g.ai",
        model: "teeml-llama3",
        teeVerified: true
      }
    ];
  }
}
