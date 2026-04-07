import { ethers } from "ethers";
import { contracts, INFT_EXTRA_ABI } from "../config/contracts.js";
import { initialize0GClients } from "../config/og.js";
import { hashContent } from "../utils/encryption.js";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AgentPassport {
  passportHash: string;
  capabilityProof: string;
  certifiedAt: number;
  isActive: boolean;
}

export interface CapabilityTestResult {
  passed: boolean;
  inferenceOk: boolean;
  storageOk: boolean;
  signatureOk: boolean;
  proof: string; // keccak256 of combined results
  testedAt: number;
}

export interface PassportStatus {
  agentId: number;
  certified: boolean;
  passport?: AgentPassport;
  testResult?: CapabilityTestResult;
}

// ─── Base ABI for INFT passport functions ────────────────────────────────────

const PASSPORT_ABI = [
  "function certifyAgent(uint256 tokenId, bytes32 capabilityProof)",
  "function revokePassport(uint256 tokenId)",
  "function isAgentCertified(uint256 tokenId) view returns (bool)",
  "function getPassport(uint256 tokenId) view returns (tuple(bytes32 passportHash, bytes32 capabilityProof, uint256 certifiedAt, bool isActive))",
];

// ─── Mock fallback store ──────────────────────────────────────────────────────

const mockPassports = new Map<number, AgentPassport>();
const mockTestResults = new Map<number, CapabilityTestResult>();

// ─── Service ──────────────────────────────────────────────────────────────────

export class PassportService {
  private inftContract: ethers.Contract | null = null;
  private wallet: ethers.Wallet | null = null;

  async init() {
    try {
      const clients = await initialize0GClients();
      if (clients?.signer && contracts.inft) {
        this.wallet = clients.signer as ethers.Wallet;
        this.inftContract = new ethers.Contract(contracts.inft, PASSPORT_ABI, clients.signer);
      }
    } catch {
      console.warn("[PassportService] Running in mock mode");
    }
  }

  /**
   * Run capability tests for an agent: inference + storage write + signature
   * Returns a CapabilityTestResult with combined proof hash
   */
  async runCapabilityTest(agentId: number, ownerAddress?: string): Promise<CapabilityTestResult> {
    const testedAt = Math.floor(Date.now() / 1000);

    // Test 1: Inference check — actually call the inference layer
    let inferenceOk = false;
    try {
      const { inference } = await import("./SealedInferenceService.js");
      const { response } = await inference(agentId, "Hello, confirm you are operational.", "Capability test");
      inferenceOk = typeof response === "string" && response.length > 0;
    } catch {
      // Inference layer unavailable — test fails
      inferenceOk = false;
    }

    // Test 2: 0G Storage availability — verify KV client is ready
    let storageOk = false;
    try {
      const clients = await initialize0GClients();
      storageOk = !!(clients?.kvReady && (clients?.kvClient || clients?.storageNodes?.length));
    } catch { storageOk = false; }

    // Test 3: Signature / identity check — verify address is valid EVM address
    let signatureOk = false;
    try {
      if (ownerAddress && ethers.isAddress(ownerAddress)) {
        // Verify it's a proper checksummed address, not a zero address
        signatureOk = ownerAddress !== ethers.ZeroAddress;
      }
    } catch { signatureOk = false; }

    // All three tests must pass for certification
    const passed = inferenceOk && storageOk && signatureOk;

    // Build capability proof: deterministic hash of test outcomes
    const proof = ethers.keccak256(
      ethers.toUtf8Bytes(`${agentId}:${inferenceOk}:${storageOk}:${signatureOk}:${testedAt}`)
    );

    const result: CapabilityTestResult = {
      passed, inferenceOk, storageOk, signatureOk, proof, testedAt
    };

    mockTestResults.set(agentId, result);
    return result;
  }

  /**
   * Certify an agent on-chain after capability test passes
   */
  async certifyAgent(agentId: number, capabilityProof: string): Promise<{ txHash: string; passportHash: string; mock?: boolean }> {
    // Try on-chain first
    if (this.inftContract && this.wallet) {
      try {
        const tx = await this.inftContract.certifyAgent(agentId, capabilityProof);
        const receipt = await tx.wait();
        const event = receipt?.logs?.find((l: any) => l?.fragment?.name === "AgentCertified");
        const passportHash = event?.args?.passportHash ?? ethers.ZeroHash;
        return { txHash: receipt?.hash ?? tx.hash, passportHash };
      } catch (err) {
        console.warn("[PassportService] On-chain certify failed, using mock:", err);
      }
    }

    // Mock fallback
    const certifiedAt = Math.floor(Date.now() / 1000);
    const passportHash = ethers.keccak256(
      ethers.toUtf8Bytes(`${agentId}:${capabilityProof}:${certifiedAt}`)
    );
    mockPassports.set(agentId, {
      passportHash,
      capabilityProof,
      certifiedAt,
      isActive: true,
    });
    return { txHash: `mock-certify-${agentId}`, passportHash, mock: true };
  }

  /**
   * Get passport status for an agent
   */
  async getPassport(agentId: number): Promise<PassportStatus> {
    if (this.inftContract) {
      try {
        const certified = await this.inftContract.isAgentCertified(agentId);
        if (certified) {
          const p = await this.inftContract.getPassport(agentId);
          return {
            agentId,
            certified: true,
            passport: {
              passportHash:    p.passportHash,
              capabilityProof: p.capabilityProof,
              certifiedAt:     Number(p.certifiedAt),
              isActive:        p.isActive,
            }
          };
        }
        return { agentId, certified: false };
      } catch { /* fallthrough */ }
    }

    // Mock fallback
    const passport = mockPassports.get(agentId);
    return {
      agentId,
      certified: !!(passport?.isActive),
      passport: passport ?? undefined,
      testResult: mockTestResults.get(agentId),
    };
  }

  /**
   * Verify a passport hash (used by external agents to authenticate)
   */
  async verifyPassport(agentId: number): Promise<{ valid: boolean; passportHash?: string }> {
    const status = await this.getPassport(agentId);
    return {
      valid: status.certified,
      passportHash: status.passport?.passportHash,
    };
  }

  /**
   * Revoke a passport (admin only)
   */
  async revokePassport(agentId: number): Promise<{ txHash: string; mock?: boolean }> {
    if (this.inftContract && this.wallet) {
      try {
        const tx = await this.inftContract.revokePassport(agentId);
        await tx.wait();
        return { txHash: tx.hash };
      } catch (err) {
        console.warn("[PassportService] On-chain revoke failed:", err);
      }
    }
    const p = mockPassports.get(agentId);
    if (p) p.isActive = false;
    return { txHash: `mock-revoke-${agentId}`, mock: true };
  }

  /**
   * Full registration flow: test → certify → return passport
   */
  async fullRegistration(agentId: number, ownerAddress?: string): Promise<{
    testResult: CapabilityTestResult;
    certified: boolean;
    passportHash?: string;
    txHash?: string;
    mock?: boolean;
  }> {
    const testResult = await this.runCapabilityTest(agentId, ownerAddress);

    if (!testResult.passed) {
      return { testResult, certified: false };
    }

    const { txHash, passportHash, mock } = await this.certifyAgent(agentId, testResult.proof);
    return { testResult, certified: true, passportHash, txHash, mock };
  }
}

export const passportService = new PassportService();
