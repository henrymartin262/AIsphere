import { env } from "./index.js";

export const contracts = {
  inft: env.INFT_ADDRESS || "",
  decisionChain: env.DECISION_CHAIN_ADDRESS || "",
  registry: env.REGISTRY_ADDRESS || "",
  bountyBoard: env.BOUNTY_BOARD_ADDRESS || ""
} as const;

// v3.0: additional INFT ABI entries for Passport + Living Soul
export const INFT_EXTRA_ABI = [
  // Passport
  "function certifyAgent(uint256 tokenId, bytes32 capabilityProof)",
  "function revokePassport(uint256 tokenId)",
  "function isAgentCertified(uint256 tokenId) view returns (bool)",
  "function getPassport(uint256 tokenId) view returns (tuple(bytes32 passportHash, bytes32 capabilityProof, uint256 certifiedAt, bool isActive))",
  "event AgentCertified(uint256 indexed tokenId, bytes32 passportHash, uint256 timestamp)",
  "event PassportRevoked(uint256 indexed tokenId, uint256 timestamp)",
  // Living Soul
  "function recordExperience(uint256 tokenId, bytes32 experienceHash)",
  "function getSoulState(uint256 tokenId) view returns (tuple(bytes32 currentHash, uint256 experienceCount, uint256 lastExperienceAt))",
  "event ExperienceRecorded(uint256 indexed tokenId, bytes32 experienceHash, bytes32 newSoulHash, uint256 experienceCount)",
];

export const BOUNTY_BOARD_ABI = [
  "function createBounty(string title, string description, uint256 deadline, bytes32 criteriaHash) payable returns (uint256 id)",
  "function acceptBounty(uint256 bountyId, uint256 agentId, address agentOwner)",
  "function submitResult(uint256 bountyId, bytes32 resultProofHash)",
  "function approveBounty(uint256 bountyId)",
  "function disputeBounty(uint256 bountyId)",
  "function resolveDispute(uint256 bountyId, bool approved)",
  "function cancelBounty(uint256 bountyId)",
  "function expireBounty(uint256 bountyId)",
  "function createSubBounty(uint256 parentBountyId, string title, string description, uint256 deadline, bytes32 criteriaHash, uint256 creatorAgentId) payable returns (uint256 id)",
  "function getBounty(uint256 id) view returns (tuple(uint256 id, address creator, uint256 creatorAgentId, string title, string description, uint256 reward, uint256 deadline, bytes32 criteriaHash, uint256 assignedAgentId, address assignedOwner, bytes32 resultProofHash, uint8 status, uint256 parentBountyId, uint256 createdAt, uint256 completedAt))",
  "function getBounties(uint256 offset, uint256 limit) view returns (tuple(uint256 id, address creator, uint256 creatorAgentId, string title, string description, uint256 reward, uint256 deadline, bytes32 criteriaHash, uint256 assignedAgentId, address assignedOwner, bytes32 resultProofHash, uint8 status, uint256 parentBountyId, uint256 createdAt, uint256 completedAt)[] result, uint256 total)",
  "function getBountiesByCreator(address creator) view returns (uint256[])",
  "function getBountiesByAgent(uint256 agentId) view returns (uint256[])",
  "function getTotalBounties() view returns (uint256)",
  "function getTotalRewardPool() view returns (uint256)",
  "event BountyCreated(uint256 indexed id, address indexed creator, uint256 reward, uint256 deadline)",
  "event BountyCompleted(uint256 indexed id, address indexed recipient, uint256 reward)"
];
