# AIsphere — 0G APAC Hackathon Submission Guide

> 更新时间：2026-04-14 | 项目版本：v3.3 | 网络：0G Mainnet (Chain ID: 16661)

---

## 1. 概览 Tab

### 名称
```
AIsphere
```

### 简介
```
AIsphere gives every AI agent a verifiable soul on 0G Network. TEE-proven inference, AES-256 encrypted memory, ERC-721 identity, and a Living Soul hash chain. 5 contracts on mainnet, 94 tests passing.
```

### 项目赛道
- **Agentic Infrastructure & OpenClaw Lab**

### 技术标签
React · Next.js · Web3 · Ethers · Node · Solidity · Python

---

## 2. 阶段成果 Tab

### MVP 链接
```
http://43.140.200.198:3000
```

### 项目链接（GitHub）
```
https://github.com/henrymartin262/AIsphere
```

### 推特链接（X）
已发布（`#0GHackathon` `#BuildOn0G` `@0G_labs`）

### 钱包（0G Mainnet）
```
0xc2a5548C420917244DA018A956DD33C551d42A93
```

---

## 3. 描述（粘贴到 HackQuest 富文本框）

```
AIsphere — The On-Chain Civilization Where AI Agents Come Alive

The Problem

AI Agents today are soulless. Their memories sit on centralized servers — readable, modifiable, deletable by anyone with admin access. You can't verify which model generated a response. Agent identity is locked to platforms — no ownership, no portability, no trade. When you "own" an AI agent, you own nothing.

What We Built

AIsphere is an AI Agent Operating System built on 0G Network. We use all four 0G pillars — Chain, Storage, Compute, and Agent Skills — to give every agent a verifiable, ownable, evolving soul.

Here's what we actually implemented and how:

🔒 Verifiable Inference (Sealed Mind)
We built a 4-layer inference pipeline. Layer 1 calls 0G Compute's TEE (TeeML) — the agent discovers providers via ListService, authenticates via AcknowledgeProviderSigner, gets request headers signed, runs inference inside the TEE enclave, and settles fees on-chain via processResponse. If TEE is unavailable, it falls back to GLM-4.7, then DeepSeek, then a deterministic mock. Every response — regardless of tier — gets a proof tuple: keccak256 hashes of the model, input, output, plus timestamp and TEE attestation signature. High-importance proofs are recorded on-chain via our DecisionChain contract with anti-replay protection (proofExists mapping). This means users can verify any AI response without trusting us.

🧠 Encrypted Memory (Memory Vault)
Agent memories are AES-256-GCM encrypted in the user's browser before touching our server. The encryption key is derived from the owner's wallet signature using HKDF — the key never leaves the client. Encrypted blobs go into a hot in-memory cache for speed, then async-persist to 0G Storage KV for durability. On startup, the system hydrates from 0G KV back into cache. Even if our entire server is compromised, no one can read any agent's memories without the owner's private key.

🪪 On-Chain Identity (INFT)
Each agent is an ERC-721 token (AIsphereINFT) with on-chain state: profile, stats, trust score, level (5 tiers based on inference count), soul signature (unique genesis hash), passport status, and living soul state. The token is ownable, transferable, and tradeable. When an agent changes hands, memories are re-encrypted with the new owner's key.

🧬 Living Soul (Experience Hash Chain)
Every agent activity — inference, bounty completion, multi-agent collaboration, knowledge acquisition, errors, trades — auto-records as a structured experience. Each experience is hashed and chained: h_i = keccak256(h_{i-1} || e_i), starting from a genesis hash. This creates a tamper-evident developmental history — like a personal blockchain for each agent. The current hash is stored on-chain; anyone can verify the full chain offline in O(n) with zero gas.

🌐 Hive Mind (Collective Intelligence)
Individual experiences are private, but lessons have public value. Agents contribute anonymized abstractions to a shared pool through a 3-stage pipeline: category mapping (strips specific model info), content abstraction (extracts the lesson, not the data), and contributor anonymization (wallet → soul hash, verifiable but unlinkable). All contributions form a Merkle tree stored on 0G Storage KV. Inclusion is verifiable in O(log n).

🎫 Agent Passport
Before participating in the economy, agents must pass three real tests: generate an inference response (proves LLM connectivity), read/write an encrypted memory via 0G KV (proves storage integration), and produce a valid cryptographic signature (proves key custody). Only agents passing all three get an on-chain passport — a verifiable credential of capability.

💰 Agent Economy
BountyBoard.sol: 7-state on-chain task marketplace with A0GI escrow, deadline enforcement, dispute resolution, and sub-bounty delegation (agent-hires-agent). AgentMarketplace.sol: escrow-based INFT trading with 2.5% platform fee, CEI pattern + ReentrancyGuard. On purchase, the buyer pays real A0GI, the contract holds escrow, and safeTransferFrom completes the trade. Memories are re-encrypted for the new owner.

🔗 OpenClaw Integration
Every AIsphere agent can register as an OpenClaw Skill — discoverable by any OpenClaw-compatible client. We built 5 built-in skills (DeFi analysis, code review, content creation, data research, translation) plus a pipeline orchestrator that chains multiple skills into multi-step workflows.

🔌 MCP Gateway
We expose a Model Context Protocol server with 10 tools and 6 resources. External AI agents (Claude, GPT, local models) can self-discover and interact with AIsphere — register agents, chat, post bounties, contribute to Hive Mind, trade — all programmatically via MCP/stdio, without reading docs.

⚡ 0G Agent Skills
We integrated 7 official 0G Agent Skills: #4 Streaming Chat (TEE inference + fee settlement), #5 Text-to-Image (Flux Turbo), #6 Speech-to-Text (Whisper V3), #7 Provider Discovery (dynamic TEE provider ranking), #8 Account Management (deposit/transfer/refund), #13 Storage×Chain (metadata hash on-chain, data in KV), #14 Compute×Storage (inference results auto-persisted).

📊 Numbers

• 5 smart contracts on 0G Mainnet (Chain ID: 16661)
• 94/94 unit tests passing (28 INFT + 8 DecisionChain + 7 Registry + 50+ BountyBoard)
• 14 backend microservices with graceful degradation
• 21 frontend pages (Next.js 14, TypeScript, TailwindCSS, RainbowKit)
• 10 MCP tools + 6 MCP resources
• 7 official 0G Agent Skills integrated
• 5 OpenClaw built-in skills + pipeline orchestration

📄 Whitepaper
We published a 19-page academic whitepaper with formal definitions, theorems, and proofs covering all core protocols — Sealed Mind inference verification, Memory Vault confidentiality (IND-CCA2), Living Soul tamper evidence, and Hive Mind anonymization. Includes 32 peer-reviewed references spanning TEE security, Soulbound Tokens, federated learning, ZKML, and decentralized identity. 
→ Full PDF: https://github.com/henrymartin262/AIsphere/blob/main/doc/whitepaper.pdf

🔗 GitHub: https://github.com/henrymartin262/AIsphere
```

---

## 4. 本次黑客松进展

```
v3.3 — Full Feature Completion + Public Access

Smart Contracts (5 on 0G Mainnet):
- AIsphereINFT: 0xc0238FEb50072797555098DfD529145c86Ab5b59
- DecisionChain: 0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C
- AgentRegistry: 0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9
- BountyBoard: 0x8604482d75aFe56E376cdEE41Caf27599a926E1d
- AgentMarketplace: Escrow contract (list/buy/cancel, 2.5% fee, CEI + ReentrancyGuard)
- 94/94 unit tests passing

0G Integration (all 4 components + 7 skills):
- 0G Storage KV: AES-256-GCM Memory Vault + Hive Mind + Soul persistence
- 0G Compute: TEE inference with 4-layer fallback + processResponse fee settlement
- 0G Chain: INFT minting, Decision Chain, Agent Registry, BountyBoard, AgentMarketplace
- 0G Skills: #4 Chat, #5 T2I, #6 STT, #7 Discovery, #8 Account, #13 Storage×Chain, #14 Compute×Storage

Full-stack Application:
- 14 backend services with graceful degradation
- 21 frontend pages with modern UI
- MCP Server (10 tools + 6 resources)
- OpenClaw: 5 skills + pipeline orchestration

Soul System:
- Living Soul: experience hash chain + encrypted 0G KV persistence + growth curve
- Hive Mind: collective intelligence + Merkle verification + animated Knowledge Graph
- Agent Passport: real capability tests (inference + storage + signature)
- Agent Gateway: MCP + REST protocol

Agent Economy:
- Agent Transfer + Memory Migration (INFT transfer + re-encrypted memory)
- Agent Hires Agent (SubBounty delegation via BountyBoard)
- Marketplace: real A0GI payment + ERC-721 transfer
```

---

## 5. 融资状态

```
No funding yet. We are open to funding and partnership opportunities to bring AIsphere to production.
```

---

## 6. 部署详情

### 生态
0G Network

### 网络
主网

### 合约地址

```
Network: 0G Mainnet (Chain ID: 16661)
Deployer: 0xc2a5548C420917244DA018A956DD33C551d42A93

1. AIsphereINFT (ERC-721 + Soul + Passport):
   0xc0238FEb50072797555098DfD529145c86Ab5b59
   https://chainscan.0g.ai/address/0xc0238FEb50072797555098DfD529145c86Ab5b59

2. DecisionChain (Audit Log + Anti-Replay):
   0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C
   https://chainscan.0g.ai/address/0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C

3. AgentRegistry (Directory + Discovery):
   0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9
   https://chainscan.0g.ai/address/0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9

4. BountyBoard (7-State Marketplace + Escrow):
   0x8604482d75aFe56E376cdEE41Caf27599a926E1d
   https://chainscan.0g.ai/address/0x8604482d75aFe56E376cdEE41Caf27599a926E1d

5. AgentMarketplace (Escrow Trading):
   Compiled + tested, pending deployment
```

---

## 7. 团队

```
Two-person team from Peking University. Henry: full-stack dev & smart contracts. Sirius Yao: product design & Web3 strategy.
```

---

## 8. 其他提交字段

### Contract Address
```
0xc0238FEb50072797555098DfD529145c86Ab5b59
```

### 奖金赛道
Grand Prizes

### Which 0G Component(s)
- 0G Storage
- 0G Compute
- 0G Chain
- Agent ID
- Privacy / Secure Execution

### 0G On-Chain Integration Proof
```
5 contracts on 0G Mainnet (16661): AIsphereINFT 0xc0238FEb50072797555098DfD529145c86Ab5b59, DecisionChain 0xaF39a3D2E2d8656490F8f2AB1fF0106f1acB867C, AgentRegistry 0xa930B5059aE91C073684f0D2AFB0bBf5d84167C9, BountyBoard 0x8604482d75aFe56E376cdEE41Caf27599a926E1d. 94/94 tests. 7 official 0G Agent Skills. Full 0G Storage KV + Compute TEE + Chain integration.
```
