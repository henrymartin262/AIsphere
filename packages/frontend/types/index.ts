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
  };
  stats: {
    totalInferences: number;
    totalMemories: number;
    trustScore: number;
    level: number;
    lastActiveAt: number;
  };
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
