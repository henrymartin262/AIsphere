# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## Project Overview

SealMind is a **privacy-sovereign AI Agent operating system** built on [0G Network](https://0g.ai). Every AI Agent gets:
- **INFT** — On-chain ERC-721 identity (SealMindINFT.sol)
- **Memory Vault** — Client-encrypted KV memory via 0G Storage
- **Sealed Inference** — TEE-based verifiable inference via 0G Compute
- **Decision Chain** — Immutable on-chain audit log of all decisions

**Network:** 0G Testnet (Chain ID: 16602)

---

## Monorepo Structure

```
packages/
  backend/    # Express API + 0G SDK integration (port 4000)
  frontend/   # Next.js 14 App Router + RainbowKit + wagmi
  contracts/  # Hardhat + Solidity 0.8.19 smart contracts
```

Package manager: **pnpm** with workspaces (`pnpm-workspace.yaml`).

---

## Commands

### Install
```bash
pnpm install
```

### Backend (`packages/backend`)
```bash
cd packages/backend
pnpm dev          # tsx watch (hot reload)
pnpm build        # tsc compile to dist/
pnpm start        # run compiled dist/index.js
```

### Frontend (`packages/frontend`)
```bash
cd packages/frontend
pnpm dev          # Next.js dev server (port 3000)
pnpm build        # Next.js production build
```

### Contracts (`packages/contracts`)
```bash
cd packages/contracts
pnpm compile      # hardhat compile → artifacts/ + typechain-types/
pnpm test         # hardhat test
pnpm dev          # hardhat node (local)
```

### Deploy contracts
```bash
cd packages/contracts
npx hardhat run scripts/deploy.ts --network og-testnet
```

---

## Environment Setup

Copy `.env.example` to `.env` at repo root:
```bash
cp .env.example .env
```

Backend reads `.env` from `../../.env` (repo root). Required vars:
- `PRIVATE_KEY` — backend service wallet (needs 0G testnet tokens)
- `INFT_ADDRESS`, `DECISION_CHAIN_ADDRESS`, `REGISTRY_ADDRESS` — already deployed (see `deployment.json`)

Deployed contracts (0G Testnet):
| Contract | Address |
|---|---|
| SealMindINFT | `0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6` |
| DecisionChain | `0x354306105a61505EB9a01A142E9fCA537E102EC2` |
| AgentRegistry | `0x127b73133c9Ba241dE1d1ADdc366c686fd499c02` |

---

## Architecture & Key Design Decisions

### Backend (`packages/backend/src/`)

- **Entry:** `index.ts` — Express app, initializes 0G clients, mounts routes
- **Config:** `config/index.ts` uses Zod to validate env; `config/og.ts` initializes 0G SDK clients; `config/contracts.ts` holds ABI + address bindings
- **Services** (core business logic):
  - `AgentService` — INFT minting, agent lookup (with 30s TTL cache), mock fallback when `PRIVATE_KEY` not set
  - `MemoryVaultService` — 0G Storage KV read/write for encrypted agent memories
  - `DecisionChainService` — Records decision proofs on-chain via DecisionChain contract
  - `SealedInferenceService` — TEE inference via `@0glabs/0g-serving-broker`
- **Routes:** `/api/agents`, `/api/chat`, `/api/memory`, `/api/decisions`, `/api/explore`
- **Middleware:** `auth.ts` (wallet signature verification), `errorHandler.ts`

### Frontend (`packages/frontend/`)

- **App Router** under `app/` — no `src/` directory
- **Pages:** `/` (home), `/dashboard`, `/agent/create`, `/agent/[id]/chat`, `/agent/[id]/memory`, `/agent/[id]/decisions`, `/explore`, `/verify`
- **Web3:** RainbowKit + wagmi v2 + viem, providers configured in `app/providers.tsx`
- **API calls** go to `NEXT_PUBLIC_API_URL` (default `http://localhost:4000/api`)

### Contracts (`packages/contracts/`)

- **SealMindINFT** — ERC721Enumerable with `AgentProfile` + `AgentStats` structs; level-up system (1-5) based on inference count + trust score
- **DecisionChain** — Append-only decision log; anti-replay via `proofExists` mapping; `authorizedRecorders` whitelist
- **AgentRegistry** — Registry for agent discovery/explore features
- TypeChain types auto-generated to `typechain-types/` on compile

### TypeScript Config

Base `tsconfig.base.json` at repo root (ES2022, strict mode, bundler module resolution). Each package extends it.

Backend uses `"type": "module"` — all imports must use `.js` extension (e.g., `import foo from './foo.js'`).

---

## 0G Network Integration

- **0G Chain RPC:** `https://16602.rpc.thirdweb.com` (testnet) / `https://evmrpc.0g.ai` (mainnet)
- **0G Storage:** `@0gfoundation/0g-ts-sdk` — KV store for encrypted agent memories; indexer at `https://indexer-storage-testnet-turbo.0g.ai`
- **0G Compute (TEE):** `@0glabs/0g-serving-broker` — broker auto-discovers sealed inference endpoints, no manual configuration needed

---

## Mock Mode

When `PRIVATE_KEY` is not set in `.env`, `AgentService` falls back to in-process mock data (incremental IDs, in-memory Map). Response includes `mock: true`. This allows frontend development without a funded wallet.
