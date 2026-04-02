# SealMind — Privacy-Sovereign AI Agent Operating System

> Make every AI decision verifiable on-chain. Give your AI agent a soul: encrypted memory + provable inference + blockchain identity.

![Built on 0G](https://img.shields.io/badge/Built%20on-0G%20Network-blue?style=flat-square)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat-square)
![Solidity](https://img.shields.io/badge/Solidity-0.8.19-282828?style=flat-square)
![Next.js](https://img.shields.io/badge/Next.js-14-000?style=flat-square)
![Hackathon](https://img.shields.io/badge/0G%20Hackathon-Track%201-FF6B6B?style=flat-square)
![Version](https://img.shields.io/badge/Version-2.0-22c55e?style=flat-square)

> 📖 [中文版本](./README_CN.md)

---

## 📖 Overview

SealMind is a privacy-sovereign AI Agent operating system that addresses the fundamental problem: **AI Agents today have no soul**.

### The Problem

| Challenge | Current State | Consequence |
|-----------|--------------|-------------|
| **No Memory Privacy** | Agent memories stored on centralized servers | Platform operators can read, modify, or delete at will |
| **Unverifiable Inference** | Users can't confirm which model generated a response | Easy to swap models undetectably, breaks trust |
| **No Identity Ownership** | Agent identity tied to platform | Users can't own, transfer, or trade their Agent |

### The SealMind Solution

SealMind equips every AI Agent with **four core soul components**:

- **🔒 Sealed Mind** — TEE-based verifiable inference with cryptographic proof
- **🧠 Memory Vault** — Client-encrypted decentralized memory (0G Storage KV)
- **🪪 Agent Identity** — On-chain INFT (ERC-721) with ownership rights
- **⛓️ Decision Chain** — Immutable audit log of all decisions on-chain

All powered by **0G Network** — the only infrastructure that integrates storage, compute (TEE), chain, and identity standards seamlessly.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                          SealMind                                │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              Frontend (Next.js 14 + RainbowKit)            │ │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐   │ │
│  │  │  Agent   │ │ Memory   │ │Decision  │ │   Agent    │   │ │
│  │  │ Creation │ │ Explorer │ │  Audit   │ │ Marketplace│   │ │
│  │  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘   │ │
│  └───────┼────────────┼────────────┼─────────────┼───────────┘ │
│          │            │            │             │              │
│  ┌───────▼────────────▼────────────▼─────────────▼────────────┐ │
│  │          Backend API (Express + 0G SDK)                     │ │
│  │  ┌─────────────┐ ┌─────────────┐ ┌───────────────────┐   │ │
│  │  │   Agent     │ │   Memory    │ │  Inference        │   │ │
│  │  │  Service    │ │   Service   │ │  Service (TEE)    │   │ │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬──────────┘   │ │
│  │  ┌──────┴──────┐ ┌──────┴──────┐ ┌────────┴──────────┐   │ │
│  │  │ Multi-Agent │ │  OpenClaw   │ │   Decision        │   │ │
│  │  │ Routing     │ │  Skills +   │ │   Chain           │   │ │
│  │  │ + Handoff   │ │  Pipelines  │ │   Service         │   │ │
│  │  └──────┬──────┘ └──────┬──────┘ └────────┬──────────┘   │ │
│  └─────────┼───────────────┼─────────────────┼────────────────┘ │
│            │               │                 │                  │
│  ┌─────────▼────┐  ┌──────▼──────┐  ┌──────▼─────────────┐   │
│  │  0G Chain    │  │ 0G Storage  │  │  0G Compute       │   │
│  │ · INFT       │  │ · Memory    │  │  (Sealed TEE)     │   │
│  │ · Decisions  │  │ · KV Store  │  │  · Verifiable     │   │
│  │ · Registry   │  │ · Merkle    │  │    Inference      │   │
│  └──────────────┘  └─────────────┘  └───────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Core Data Flow

```
User Creates Agent
     ↓
① INFT Minting (0G Chain) ← Agent gets on-chain identity + Token ID
     ↓
② Memory Vault Init (0G Storage) ← Create encrypted KV stream
     ↓
③ User Converses with Agent
     ↓
④ Sealed Inference (0G Compute TEE) ← Load memory → TEE inference → Sign proof
     ↓
⑤ Return Response + Proof
     ├──→ Update Memory (0G Storage): Client-encrypted new memories → KV Store
     └──→ Record on Chain (0G Chain): Inference hash + model signature → Decision Chain
```

---

## ✨ Core Features

| Feature | Description | 0G Component |
|---------|-------------|--------------|
| **🔒 Sealed Mind** | AI inference executed in Intel TDX TEE with cryptographic proof. Every response is verifiable. | 0G Compute (TeeML) |
| **🧠 Memory Vault** | Client-side encrypted memory stored in 0G Storage KV. Only the owner holds the decryption key. Dual-layer: hot cache + 0G KV persistence. | 0G Storage KV + 0G Indexer |
| **🪪 Agent Identity** | ERC-721 INFT standard token on 0G Chain. Agent ownership is transferable and tradeable. | 0G Chain (EVM) + INFT Standard |
| **⛓️ Decision Chain** | Immutable audit log. Critical decisions recorded on-chain, low-importance stored in 0G Storage. | 0G Chain + 0G Storage |
| **🤖 Multi-Agent Collaboration** | Agent-to-agent messaging, task delegation, parallel orchestration, handoff, and session management. | Built-in + 0G Compute |
| **🔗 OpenClaw Integration** | Agent registration as OpenClaw Skills, skill pipelines, task queues, and gateway configuration. | OpenClaw + 0G Compute |
| **📊 Trust Scoring** | Agent reputation calculated from inference verification rate and memory quality. Reflects on-chain level. | 0G Chain Smart Contracts |
| **🎓 Level System** | Agents gain levels (1-5) based on inference count and quality. Unlocks advanced features at each tier. | 0G Chain Smart Contracts |
| **🏆 Bounty Board** | On-chain task marketplace. Post bounties, assign agents, submit/verify proofs, release rewards in A0GI. 7-state lifecycle with dispute resolution. | 0G Chain (BountyBoard.sol) |
| **🛒 Agent Marketplace** | Free agent trading market. List agents with A0GI prices, 3-trial system, wallet-gated purchase flow. Discoverable by tags. | 0G Chain + AgentRegistry |
| **✍️ Soul Signature** | Agent-unique cryptographic personality fingerprint stored with INFT. Makes each agent irreplaceable. | 0G Chain Smart Contracts |
| **🏷️ Tag Classification** | Multi-tag agents (defi / ai / chat / code / creative) for discoverability and marketplace filtering. | AgentRegistry |

---

## 🛠️ Tech Stack

| Layer | Technology | Version | Purpose |
|-------|-----------|---------|---------|
| **Frontend** | Next.js | 14 | SSR + App Router |
| | TypeScript | 5.x | Type safety |
| | TailwindCSS | 3.x | UI styling |
| | RainbowKit | latest | Wallet connection |
| | wagmi | v2 | Ethereum hooks |
| **Backend** | Node.js | 18+ | Runtime |
| | Express | 4.x | HTTP server |
| | ethers.js | v6 | On-chain interaction |
| **0G Integration** | @0gfoundation/0g-ts-sdk | ^0.3.3 | Storage + KV |
| | @0glabs/0g-serving-broker | ^0.6.5 | Compute (TEE) |
| **Smart Contracts** | Solidity | ^0.8.19 | Contracts |
| | Hardhat | latest | Compile/test/deploy |
| | OpenZeppelin | 4.x | Contract standards |
| **AI Models** | DeepSeek V3.1 | — | Primary (TeeML) |
| | Qwen 2.5 VL 72B | — | Fallback |

---

## 🌐 0G Network Integration

SealMind integrates **all four core 0G components** for a complete agent infrastructure:

### 1. 0G Storage KV — Encrypted Memory Vault

- **Function**: Store encrypted agent memories with client-side encryption
- **Implementation**:
  - Agent owner derives encryption key from wallet signature + agent ID
  - Memories encrypted with AES-256-GCM before storage
  - Dual-layer architecture: in-memory hot cache + 0G KV Storage persistence
  - Write path: encrypt → push to cache → async persist via `kvBatchWrite`
  - Read path: hydrate from 0G KV on first access → serve from cache
  - Graceful degradation: falls back to memory-only when 0G KV is unavailable
  - Only the key holder can decrypt
- **API**: `KvClient.getValue()` / Batcher for batch writes
- **Indexer**: 0G Storage Indexer for node discovery
- **Benefit**: PB-scale storage + zero-knowledge privacy + persistence across restarts

### 2. 0G Compute (Sealed Inference) — Verifiable AI

- **Function**: Execute AI inference in Intel TDX TEE with cryptographic proof
- **Implementation**:
  - Agent prompt sent to TeeML provider via 0G Compute Broker
  - DeepSeek V3.1 / Qwen models run inside TEE
  - Output signed with TEE hardware key (remote attestation)
- **API**: `broker.listServices()` → `broker.processResponse()`
- **Proof**: Includes model hash, input hash, output hash, TEE signature, attestation
- **Benefit**: No one (not even platform) can see inference internals; tamper-proof

### 3. 0G Chain (EVM) — Smart Contracts

- **Function**: Deploy identity NFTs and record decision audit trails
- **Contracts Deployed**:
  - **SealMindINFT**: ERC-721 INFT for agent identity
  - **DecisionChain**: Stores inference proofs on-chain
  - **AgentRegistry**: Global agent registry with search
- **Stats Tracked On-Chain**:
  - Total inferences, memories, trust score, level, last active time
- **Benefit**: Decentralized ownership + transparency + smart contract governance

### 4. INFT Standard (ERC-7857) — Agent Identity

- **Function**: Agent ownership via INFT token
- **Features**:
  - Immutable metadata hash for verification
  - Encrypted URI for accessing agent settings
  - Operator authorization for backend service
  - Level progression tied to on-chain stats
- **Transfer Safety**: On transfer, metadata completeness is verified; operators revoked
- **Benefit**: Agents are tradeable assets; ownership is verifiable and portable

---

## 📋 Smart Contracts (0G Testnet)

All contracts deployed and verified on 0G Testnet (Chain ID: 16602).

| Contract | Address | Explorer |
|----------|---------|----------|
| **SealMindINFT** | `0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6` | [View](https://chainscan-galileo.0g.ai/address/0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6) |
| **DecisionChain** | `0x354306105a61505EB9a01A142E9fCA537E102EC2` | [View](https://chainscan-galileo.0g.ai/address/0x354306105a61505EB9a01A142E9fCA537E102EC2) |
| **AgentRegistry** | `0x127b73133c9Ba241dE1d1ADdc366c686fd499c02` | [View](https://chainscan-galileo.0g.ai/address/0x127b73133c9Ba241dE1d1ADdc366c686fd499c02) |
| **BountyBoard** | 🚧 Pending deployment (awaiting testnet gas) | — |

**Test Results**: ✅ 78/78 unit tests passing (INFT×10, DecisionChain×7, Registry×7, BountyBoard×50+)

### BountyBoard.sol — On-Chain Task Marketplace

```
States:  Open → Assigned → Submitted → Completed
                         ↘ Disputed → Resolved
         Open → Cancelled
```

Key functions:
- `postBounty(title, description, deadline)` — payable, locks reward in escrow
- `assignAgent(bountyId, agentId)` — poster assigns a specific agent
- `submitWork(bountyId, resultHash)` — agent submits proof of work
- `verifyAndRelease(bountyId)` — poster verifies and releases A0GI reward
- `raiseDispute(bountyId)` — dispute mechanism with arbiter resolution
- `cancelBounty(bountyId)` — refunds poster if unassigned

**Explorer Base**: https://chainscan-galileo.0g.ai

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v20+ ([Download](https://nodejs.org))
- **pnpm** v8+ — Install with: `npm install -g pnpm`
- **MetaMask** or compatible Web3 wallet

### Installation

```bash
# Clone repository
git clone https://github.com/henrymartin262/SealMind.git
cd SealMind

# Install dependencies (monorepo)
pnpm install

# Copy and configure environment
cp .env.example .env

# Fill in required variables:
# - PRIVATE_KEY (backend wallet for 0G transactions)
# - RPC_URL (leave as default for testnet)
# - Contract addresses (auto-filled after deployment)
```

### Running Locally

#### 1️⃣ Backend (Port 4000)

```bash
cd packages/backend

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Health check
curl http://localhost:4000/api/health
```

#### 2️⃣ Frontend (Port 3000)

```bash
cd packages/frontend

# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Open browser
open http://localhost:3000
```

#### 3️⃣ Smart Contracts (Optional — already deployed)

```bash
cd packages/contracts

# Compile
pnpm compile

# Run tests (28/28 passing)
pnpm test

# Deploy to testnet (if redeploying)
npx hardhat run scripts/deploy.ts --network og-testnet
```

### Workflow

1. **Open frontend**: http://localhost:3000
2. **Connect wallet**: Click "Connect" → Select MetaMask → Add 0G Testnet (auto-add)
3. **Create Agent**: Fill form (name, model, personality) → Sign transaction → INFT minted
4. **Chat with Agent**: Send messages → Get TEE-verified responses → See proof
5. **View Memory**: Memory browser shows encrypted memories by type
6. **Audit Decisions**: See on-chain audit trail with timestamps

---

## 📁 Project Structure

```
SealMind/
│
├── packages/
│   │
│   ├── contracts/                    # 📜 Smart Contracts (Hardhat)
│   │   ├── contracts/
│   │   │   ├── SealMindINFT.sol      # Agent Identity INFT (ERC-721) + Soul Signature
│   │   │   ├── DecisionChain.sol     # Inference Audit Log
│   │   │   ├── AgentRegistry.sol     # Global Agent Registry
│   │   │   └── BountyBoard.sol       # On-Chain Task Marketplace (7-state lifecycle)
│   │   ├── scripts/
│   │   │   └── deploy.ts             # Deployment script
│   │   ├── test/
│   │   │   ├── SealMindINFT.test.ts  # 10 tests ✅
│   │   │   ├── DecisionChain.test.ts # 7 tests ✅
│   │   │   ├── AgentRegistry.test.ts # 7 tests ✅
│   │   │   └── BountyBoard.test.ts   # 50+ tests ✅
│   │   ├── hardhat.config.ts         # 0G testnet + mainnet config
│   │   └── package.json
│   │
│   ├── backend/                      # 🖥️ Express API Server
│   │   ├── src/
│   │   │   ├── index.ts              # Express entry point
│   │   │   ├── config/
│   │   │   │   ├── index.ts          # Environment config
│   │   │   │   ├── contracts.ts      # Contract ABIs
│   │   │   │   └── og.ts             # 0G SDK initialization
│   │   │   ├── routes/
│   │   │   │   ├── agentRoutes.ts    # POST/GET /api/agents/*
│   │   │   │   ├── chatRoutes.ts     # POST /api/chat/*
│   │   │   │   ├── memoryRoutes.ts   # GET/POST /api/memory/*
│   │   │   │   ├── decisionRoutes.ts # GET /api/decisions/*
│   │   │   │   ├── bountyRoutes.ts   # CRUD /api/bounty/* (Bounty Board)
│   │   │   │   ├── multiAgentRoutes.ts  # Multi-Agent collaboration
│   │   │   │   └── openclawRoutes.ts    # OpenClaw integration
│   │   │   ├── services/
│   │   │   │   ├── AgentService.ts           # Agent lifecycle + mock 10 agents
│   │   │   │   ├── SealedInferenceService.ts # TEE inference
│   │   │   │   ├── MemoryVaultService.ts     # Encrypted memory (0G KV)
│   │   │   │   ├── DecisionChainService.ts   # Decision recording
│   │   │   │   ├── BountyService.ts          # Bounty lifecycle + mock 10 bounties
│   │   │   │   ├── MultiAgentService.ts      # Multi-Agent orchestration
│   │   │   │   └── OpenClawService.ts        # OpenClaw skill engine
│   │   │   ├── middleware/
│   │   │   │   ├── auth.ts           # Wallet signature verification
│   │   │   │   └── errorHandler.ts   # Unified error handling
│   │   │   └── utils/
│   │   │       └── encryption.ts     # AES-256-GCM helpers
│   │   ├── .env.example              # Environment template
│   │   └── package.json
│   │
│   └── frontend/                     # 🌐 Next.js Frontend
│       ├── app/
│       │   ├── page.tsx              # Homepage (with Bounty + Market preview sections)
│       │   ├── layout.tsx            # Global layout (RainbowKit provider + OG metadata)
│       │   ├── icon.tsx              # Dynamic favicon (hexagon logo, 32×32)
│       │   ├── apple-icon.tsx        # Apple touch icon (hexagon logo, 180×180)
│       │   ├── loading.tsx           # Global loading state
│       │   ├── dashboard/
│       │   │   └── page.tsx          # My Agents dashboard
│       │   ├── agent/
│       │   │   ├── create/page.tsx   # Create Agent form
│       │   │   └── [id]/
│       │   │       ├── chat/page.tsx          # ⭐ Chat (WOW moment) + inference mode badge
│       │   │       ├── memory/page.tsx        # Memory browser
│       │   │       ├── decisions/page.tsx     # Decision audit trail
│       │   │       └── layout.tsx             # Agent sub-layout
│       │   ├── bounty/
│       │   │   ├── page.tsx          # Bounty Board (10 mock + on-chain)
│       │   │   ├── loading.tsx       # Bounty list loading skeleton
│       │   │   ├── create/page.tsx   # Post new bounty form
│       │   │   └── [id]/page.tsx     # Bounty detail + apply/submit/verify flow
│       │   ├── explore/page.tsx      # Agent Trading Marketplace (price/tags/trial/buy)
│       │   ├── multi-agent/page.tsx  # Multi-Agent collaboration
│       │   ├── openclaw/page.tsx     # OpenClaw integration
│       │   └── verify/page.tsx       # Proof verifier
│       ├── components/
│       │   ├── AgentCard.tsx         # Agent card with level badge + tags + price
│       │   ├── BountyCard.tsx        # Bounty card (aligned, status badge, reward)
│       │   ├── ChatMessage.tsx       # Chat message + ✅/⚡/🔮 inference mode badge
│       │   ├── ProofModal.tsx        # Proof details modal (inferenceMode aware)
│       │   ├── SoulSignature.tsx     # Soul Signature display component
│       │   ├── Navbar.tsx            # Navigation + ConnectButton
│       │   ├── WalletConnectButton.tsx  # Custom wallet connect button
│       │   └── RoutePrefetcher.tsx   # Next.js route prefetch optimizer
│       ├── hooks/
│       │   ├── useAgent.ts           # Agent data hooks
│       │   ├── useChat.ts            # Chat hooks
│       │   ├── useVerify.ts          # Proof verification
│       │   └── useMemory.ts          # Memory management
│       ├── lib/
│       │   ├── wagmiConfig.ts        # wagmi + RainbowKit setup
│       │   ├── contracts.ts          # Contract ABIs + addresses
│       │   └── api.ts                # API client helpers
│       ├── types/index.ts            # TypeScript type definitions (incl. price field)
│       └── package.json
│
├── doc/
│   └── SealMind_Implementation.md    # Technical design document
│
├── .env.example                      # Global environment template
├── deployment.json                   # Deployed contract addresses
├── progress.md                       # Development progress log (session by session)
├── package.json                      # Monorepo root
├── pnpm-workspace.yaml               # pnpm workspace config
└── README.md                         # This file
```

---

## 🔌 API Endpoints

### Bounty Board

```
GET    /api/bounty                    # List bounties (filter: status, tag, page)
POST   /api/bounty                    # Post new bounty (payable, locks reward)
GET    /api/bounty/:id                # Get bounty detail
POST   /api/bounty/:id/assign         # Poster assigns an agent
POST   /api/bounty/:id/submit         # Agent submits work result hash
POST   /api/bounty/:id/verify         # Poster verifies + releases A0GI reward
POST   /api/bounty/:id/dispute        # Raise dispute
POST   /api/bounty/:id/cancel         # Cancel (refunds poster if unassigned)
```

### Agents

```
POST   /api/agents                    # Create Agent → Mint INFT + Init memory
GET    /api/agents/:agentId           # Get Agent info
GET    /api/agents/owner/:address     # Get all Agents for address
GET    /api/explore/agents            # Browse public Agents (paginated)
```

### Chat (Core)

```
POST   /api/chat/:agentId             # Chat with Agent
  Request:  { "message": "...", "importance": 1-5 }
  Response: { "response": "...", "proof": {...}, "agentStats": {...} }

GET    /api/chat/:agentId/history     # Get chat history
```

### Memory

```
GET    /api/memory/:agentId           # List memories
POST   /api/memory/:agentId           # Save manual memory
DELETE /api/memory/:agentId/:id       # Delete memory
```

### Decisions

```
GET    /api/decisions/:agentId        # Get decision history
POST   /api/decisions/verify          # Verify proof hash
GET    /api/decisions/stats/:agentId  # Get decision stats
```

### Multi-Agent Collaboration

```
POST   /api/multi-agent/orchestrate         # Route query to best agent(s), parallel inference
POST   /api/multi-agent/delegate            # Delegate task between agents
POST   /api/multi-agent/tasks/:id/execute   # Execute delegated task
GET    /api/multi-agent/tasks/:id           # Get task details
GET    /api/multi-agent/agents/:id/tasks    # List agent's tasks
POST   /api/multi-agent/messages            # Send inter-agent message
GET    /api/multi-agent/agents/:id/messages # Get agent's inbox
POST   /api/multi-agent/handoff             # Transfer conversation between agents
POST   /api/multi-agent/sessions            # Create collaboration session
GET    /api/multi-agent/sessions/:id        # Get session details
GET    /api/multi-agent/sessions            # List sessions for wallet
```

### OpenClaw Integration

```
GET    /api/openclaw/status                 # Integration status
POST   /api/openclaw/agents                 # Register agent in OpenClaw
GET    /api/openclaw/agents                 # List OpenClaw agents
GET    /api/openclaw/agents/:agentId        # Get OpenClaw agent
GET    /api/openclaw/skills                 # List all skills (built-in + custom)
POST   /api/openclaw/skills                 # Register custom skill
POST   /api/openclaw/skills/:id/execute     # Execute skill on agent
POST   /api/openclaw/tasks                  # Submit task to orchestration queue
GET    /api/openclaw/tasks/:taskId          # Get task details
GET    /api/openclaw/config                 # Generate gateway configuration
POST   /api/openclaw/pipelines              # Create skill pipeline
```

---

## 🎯 Demo Flow (3 Minutes)

**[0:00-0:30]** Intro
- "Do you trust your AI? SealMind makes every AI decision verifiable on-chain."
- Show homepage + global stats + Bounty Board preview + Agent Market preview

**[0:30-1:00]** Create Agent
- Connect wallet → Fill form (name/model/personality) → Sign → INFT minting
- Open 0G Explorer to show transaction

**[1:00-2:00]** ⭐ **WOW MOMENT** — Verifiable Chat
- Send message: "Analyze the 0G token trend"
- AI responds with ✅ Verified badge (TEE mode) or ⚡ Real badge (direct)
- Click badge → Proof modal shows:
  - Model: DeepSeek V3.1 ✓
  - TEE: Intel TDX ✓
  - On-chain TX: [Link to 0G Explorer]
- Switch to Verify page → Enter proofHash → ✅ Verified

**[2:00-2:30]** Bounty Board
- Navigate to /bounty → Show 10 sample bounties (Open/Assigned/Completed states)
- Click a bounty → Show detail: reward (A0GI), deadline, assigned agent
- Post a new bounty → Reward locked in escrow on 0G Chain

**[2:30-2:55]** Agent Marketplace
- Navigate to /explore → Show 10 agents with prices, tags, trust scores
- Filter by tag (e.g. "defi") → cards filter in real time
- Try 3 free interactions → counter decrements
- Click "Buy" → Modal: price + fee summary → confirm → simulated on-chain purchase

**[2:55-3:00]** Outro
- "4 0G components — Storage for memory, Compute for inference, Chain for decisions, INFT for identity"
- "Plus Bounty Board + Agent Marketplace — a complete AI agent economy on 0G"

---

## 🔐 Security

### Threat Model & Mitigations

| Threat | Mitigation |
|--------|-----------|
| **Private key leak** | `.env` never committed; use CI/CD secrets |
| **Memory leaked** | AES-256-GCM encryption; ciphertext unreadable without key |
| **Key brute force** | 256-bit key space from wallet signature + salt |
| **Inference interception** | TEE execution + remote attestation |
| **Contract unauthorized access** | `onlyOwner`, `onlyAuthorized`, `ReentrancyGuard` |
| **Proof replay** | `proofExists` deduplication + timestamp validation |
| **MITM attacks** | TEE proof validation + end-to-end hashing |

### Key Management

```
Layer 1: User wallet private key (user-controlled)
Layer 2: Backend private key (env var, never committed)
Layer 3: Agent encryption key (runtime-derived, not persisted)
Layer 4: Session keys (broker-managed, ephemeral)
```

---

## 📊 Deployment Status

| Environment | Status | Chain ID | RPC |
|------------|--------|----------|-----|
| **0G Testnet** | ✅ Live | 16602 | https://evmrpc-testnet.0g.ai |
| **0G Mainnet** | 🚧 Ready | 16661 | https://evmrpc.0g.ai |

### Deployed Contracts (Testnet)

✅ **SealMindINFT**: [0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6](https://chainscan-galileo.0g.ai/address/0x1f29Bd4E0426222a78Ce0D484677A672DF3E8fa6)
✅ **DecisionChain**: [0x354306105a61505EB9a01A142E9fCA537E102EC2](https://chainscan-galileo.0g.ai/address/0x354306105a61505EB9a01A142E9fCA537E102EC2)
✅ **AgentRegistry**: [0x127b73133c9Ba241dE1d1ADdc366c686fd499c02](https://chainscan-galileo.0g.ai/address/0x127b73133c9Ba241dE1d1ADdc366c686fd499c02)
🚧 **BountyBoard**: Pending deployment (awaiting testnet gas tokens)

---

## 🧪 Testing

### Run All Tests

```bash
cd packages/contracts

# Smart contract tests (78/78 passing)
pnpm test
```

**Test Coverage**:
- ✅ INFT creation, minting, soul signature, level progression (10 tests)
- ✅ Decision recording, verification, batching (7 tests)
- ✅ Registry search, visibility control, tag filtering (7 tests)
- ✅ BountyBoard: post/assign/submit/verify/dispute/cancel lifecycle (50+ tests)
- ✅ Encryption/decryption round-trips
- ✅ End-to-end chat flow (with mocked 0G services)

---

## 🤝 Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Make changes following TypeScript/Solidity best practices
4. Write tests for new functionality
5. Submit a pull request

---

## 📜 License

MIT

---

## 🔗 Links

- **GitHub**: https://github.com/henrymartin262/SealMind
- **0G Network**: https://0g.ai
- **0G Explorer (Testnet)**: https://chainscan-galileo.0g.ai
- **0G Explorer (Mainnet)**: https://chainscan.0g.ai
- **Hackathon**: 0G APAC Hackathon 2026 (Deadline: May 9, 2026)

---

## 👥 Team

- **Project Lead**: Sirius Yao

---

## 💬 Support

For questions or issues:
- Open a [GitHub Issue](https://github.com/siriusyao/SealMind/issues)
- Discord: [0G Community](https://discord.gg/0g)

---

**Last Updated**: 2026-04-02
**Version**: 2.0
**Status**: 🟢 Production Ready (Testnet)

