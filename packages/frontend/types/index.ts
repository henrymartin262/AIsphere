export interface Agent {
  agentId: number;
  owner: string;
  profile: {
    name: string;
    model: string;
    description?: string;
    personality?: string;
    tags?: string[];
    metadataHash: string;
    encryptedURI: string;
    soulSignature?: string;
  };
  stats: {
    totalInferences: number;
    totalMemories: number;
    trustScore: number;
    level: number;
    lastActiveAt: number;
  };
  soulSignature?: string;
  price?: string;          // listing price in A0GI, e.g. "1.5"
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
  proof?: InferenceProof;
}

export interface InferenceProof {
  proofHash: string;
  modelHash: string;
  inputHash: string;
  outputHash: string;
  teeVerified: boolean;
  onChain: boolean;
  txHash?: string;
  timestamp: number;
  inferenceMode?: "tee" | "real" | "mock";
}

export interface VerifyResult {
  valid: boolean;
  proofHash?: string;
  agentId?: string | number;
  timestamp?: number;
  importance?: number;
  modelHash?: string;
  inputHash?: string;
  outputHash?: string;
  teeVerified?: boolean;
  onChain?: boolean;
  txHash?: string;
  error?: string;
}

export interface MemoryItem {
  id: string;
  agentId: string | number;
  content: string;
  importance: number;
  timestamp: number;
  type?: "conversation" | "knowledge" | "personality" | "skill" | "decision";
  tags?: string[];
  embedding?: number[];
}

export interface Decision {
  id: string;
  agentId: number;
  inputHash: string;
  outputHash: string;
  modelHash: string;
  importance: number;
  timestamp: number;
  onChain: boolean;
  txHash?: string;
  proofHash: string;
}

export interface DecisionStats {
  total: number;
  onChain: number;
  batched: number;
  local: number;
}

export type BountyStatus = 0 | 1 | 2 | 3 | 4 | 5 | 6;
// 0=Open, 1=Assigned, 2=Submitted, 3=Completed, 4=Disputed, 5=Expired, 6=Cancelled

export interface Bounty {
  id: number;
  creator: string;
  creatorAgentId: number;
  title: string;
  description: string;
  reward: string;        // wei
  rewardEth: string;     // formatted
  deadline: number;      // unix timestamp
  criteriaHash: string;
  assignedAgentId: number;
  assignedOwner: string;
  resultProofHash: string;
  status: BountyStatus;
  statusLabel: string;
  parentBountyId: number;
  createdAt: number;
  completedAt: number;
  isExpired: boolean;
}

export interface BountyStats {
  totalBounties: number;
  totalRewardPool: string;
}
