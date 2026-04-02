import { expect } from "chai";
import { ethers } from "hardhat";
import type { SealMindINFT } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("SealMindINFT", function () {
  let inft: SealMindINFT;
  let owner: SignerWithAddress;
  let operator: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [owner, operator, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("SealMindINFT");
    inft = await Factory.deploy();
    await inft.waitForDeployment();
  });

  // ── createAgent ──────────────────────────────────────────────────────────

  describe("createAgent", () => {
    it("应该成功铸造 Agent NFT", async () => {
      const tx = await inft.createAgent("TestAgent", "deepseek-v3.1", "hash123", "encUri", user1.address);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);
      expect(await inft.balanceOf(user1.address)).to.equal(1);
      expect(await inft.ownerOf(1)).to.equal(user1.address);
    });

    it("应该发出 AgentCreated 事件", async () => {
      await expect(inft.createAgent("Agent1", "model1", "hash1", "uri1", user1.address))
        .to.emit(inft, "AgentCreated")
        .withArgs(1, user1.address, "Agent1", "model1", await ethers.provider.getBlock("latest").then(b => b!.timestamp + 1));
    });

    it("创建后 level 应为 1，推理次数应为 0", async () => {
      await inft.createAgent("Agent", "model", "hash", "uri", user1.address);
      const [, , stats] = await inft.getAgentInfo(1);
      expect(stats.level).to.equal(1);
      expect(stats.totalInferences).to.equal(0);
    });

    it("名称为空时应 revert", async () => {
      await expect(inft.createAgent("", "model", "hash", "uri", user1.address))
        .to.be.revertedWith("SealMindINFT: name cannot be empty");
    });

    it("接收地址为零地址时应 revert", async () => {
      await expect(inft.createAgent("Agent", "model", "hash", "uri", ethers.ZeroAddress))
        .to.be.revertedWith("SealMindINFT: mint to zero address");
    });

    it("应该同时生成灵魂签名并发出事件", async () => {
      await expect(inft.createAgent("AgentSoul", "model", "hash", "uri", user1.address))
        .to.emit(inft, "SoulSignatureGenerated");
      const sig = await inft.soulSignatures(1);
      expect(sig).to.not.equal(ethers.ZeroHash);
    });

    it("创建时应初始化 SoulState，currentHash = soulSignature", async () => {
      await inft.createAgent("Agent", "model", "hash", "uri", user1.address);
      const soul = await inft.getSoulState(1);
      const sig  = await inft.soulSignatures(1);
      expect(soul.currentHash).to.equal(sig);
      expect(soul.experienceCount).to.equal(0);
    });
  });

  // ── authorizeOperator / revokeOperator ──────────────────────────────────

  describe("authorizeOperator / revokeOperator", () => {
    it("Owner 应可授权操作员", async () => {
      await inft.authorizeOperator(operator.address);
      expect(await inft.authorizedOperators(operator.address)).to.be.true;
    });

    it("非 owner 调用授权应 revert", async () => {
      await expect(inft.connect(user1).authorizeOperator(operator.address)).to.be.reverted;
    });

    it("Owner 应可撤销操作员", async () => {
      await inft.authorizeOperator(operator.address);
      await inft.revokeOperator(operator.address);
      expect(await inft.authorizedOperators(operator.address)).to.be.false;
    });
  });

  // ── recordInference ──────────────────────────────────────────────────────

  describe("recordInference", () => {
    beforeEach(async () => {
      await inft.authorizeOperator(operator.address);
      await inft.createAgent("Agent", "model", "hash", "uri", user1.address);
    });

    it("操作员应可记录推理", async () => {
      await inft.connect(operator).recordInference(1, 10);
      const [, , stats] = await inft.getAgentInfo(1);
      expect(stats.totalInferences).to.equal(1);
      expect(stats.trustScore).to.equal(10);
    });

    it("非操作员调用应 revert", async () => {
      await expect(inft.connect(user2).recordInference(1, 0))
        .to.be.revertedWith("SealMindINFT: not authorized operator");
    });

    it("100 次推理后应升到 Level 2", async () => {
      for (let i = 0; i < 100; i++) {
        await inft.connect(operator).recordInference(1, 0);
      }
      const [, , stats] = await inft.getAgentInfo(1);
      expect(stats.level).to.equal(2);
    });
  });

  // ── getAgentsByOwner ─────────────────────────────────────────────────────

  describe("getAgentsByOwner", () => {
    it("应返回用户持有的所有 tokenId", async () => {
      await inft.createAgent("A1", "m", "h", "u", user1.address);
      await inft.createAgent("A2", "m", "h", "u", user1.address);
      await inft.createAgent("A3", "m", "h", "u", user2.address);

      const user1Agents = await inft.getAgentsByOwner(user1.address);
      expect(user1Agents.length).to.equal(2);
      expect(user1Agents.map(id => Number(id))).to.include.members([1, 2]);
    });
  });

  // ── v3.0: certifyAgent / Passport ────────────────────────────────────────

  describe("certifyAgent (Passport)", () => {
    const capProof = ethers.keccak256(ethers.toUtf8Bytes("capability-test-passed"));

    beforeEach(async () => {
      await inft.authorizeOperator(operator.address);
      await inft.createAgent("CertAgent", "model", "hash", "uri", user1.address);
    });

    it("operator 应可颁发 Passport", async () => {
      await expect(inft.connect(operator).certifyAgent(1, capProof))
        .to.emit(inft, "AgentCertified");
      expect(await inft.isAgentCertified(1)).to.be.true;
    });

    it("颁发后 Passport 数据应正确", async () => {
      await inft.connect(operator).certifyAgent(1, capProof);
      const p = await inft.getPassport(1);
      expect(p.capabilityProof).to.equal(capProof);
      expect(p.isActive).to.be.true;
      expect(p.certifiedAt).to.be.gt(0);
      expect(p.passportHash).to.not.equal(ethers.ZeroHash);
    });

    it("重复认证应 revert", async () => {
      await inft.connect(operator).certifyAgent(1, capProof);
      await expect(inft.connect(operator).certifyAgent(1, capProof))
        .to.be.revertedWith("SealMindINFT: already certified");
    });

    it("未认证 Agent 的 isAgentCertified 应返回 false", async () => {
      expect(await inft.isAgentCertified(1)).to.be.false;
    });

    it("空 capabilityProof 应 revert", async () => {
      await expect(inft.connect(operator).certifyAgent(1, ethers.ZeroHash))
        .to.be.revertedWith("SealMindINFT: empty capability proof");
    });

    it("非 operator 调用应 revert", async () => {
      await expect(inft.connect(user2).certifyAgent(1, capProof))
        .to.be.revertedWith("SealMindINFT: not authorized operator");
    });
  });

  // ── v3.0: revokePassport ──────────────────────────────────────────────────

  describe("revokePassport", () => {
    const capProof = ethers.keccak256(ethers.toUtf8Bytes("cap-proof"));

    beforeEach(async () => {
      await inft.authorizeOperator(operator.address);
      await inft.createAgent("RevAgent", "m", "h", "u", user1.address);
      await inft.connect(operator).certifyAgent(1, capProof);
    });

    it("Owner 应可吊销 Passport", async () => {
      await expect(inft.revokePassport(1)).to.emit(inft, "PassportRevoked");
      expect(await inft.isAgentCertified(1)).to.be.false;
    });

    it("非 owner 调用应 revert", async () => {
      await expect(inft.connect(user1).revokePassport(1)).to.be.reverted;
    });

    it("吊销未认证 Agent 应 revert", async () => {
      await inft.createAgent("NotCert", "m", "h", "u", user2.address);
      await expect(inft.revokePassport(2))
        .to.be.revertedWith("SealMindINFT: not certified");
    });
  });

  // ── v3.0: recordExperience / Living Soul ─────────────────────────────────

  describe("recordExperience (Living Soul)", () => {
    const expHash1 = ethers.keccak256(ethers.toUtf8Bytes("experience-1"));
    const expHash2 = ethers.keccak256(ethers.toUtf8Bytes("experience-2"));

    beforeEach(async () => {
      await inft.authorizeOperator(operator.address);
      await inft.createAgent("SoulAgent", "model", "hash", "uri", user1.address);
    });

    it("operator 应可记录经验", async () => {
      await expect(inft.connect(operator).recordExperience(1, expHash1))
        .to.emit(inft, "ExperienceRecorded");

      const soul = await inft.getSoulState(1);
      expect(soul.experienceCount).to.equal(1);
      expect(soul.lastExperienceAt).to.be.gt(0);
    });

    it("经验哈希链应正确演化", async () => {
      await inft.connect(operator).recordExperience(1, expHash1);
      const soul1 = await inft.getSoulState(1);

      // currentHash after exp1 = keccak256(soulSig, exp1)
      const soulSig = await inft.soulSignatures(1);
      const expected1 = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [soulSig, expHash1]));
      expect(soul1.currentHash).to.equal(expected1);

      // Second experience
      await inft.connect(operator).recordExperience(1, expHash2);
      const soul2 = await inft.getSoulState(1);
      const expected2 = ethers.keccak256(ethers.solidityPacked(["bytes32", "bytes32"], [expected1, expHash2]));
      expect(soul2.currentHash).to.equal(expected2);
      expect(soul2.experienceCount).to.equal(2);
    });

    it("空 experienceHash 应 revert", async () => {
      await expect(inft.connect(operator).recordExperience(1, ethers.ZeroHash))
        .to.be.revertedWith("SealMindINFT: empty experience hash");
    });

    it("非 operator 调用应 revert", async () => {
      await expect(inft.connect(user2).recordExperience(1, expHash1))
        .to.be.revertedWith("SealMindINFT: not authorized operator");
    });

    it("多次记录经验后 experienceCount 应正确", async () => {
      for (let i = 0; i < 5; i++) {
        const h = ethers.keccak256(ethers.toUtf8Bytes(`exp-${i}`));
        await inft.connect(operator).recordExperience(1, h);
      }
      const soul = await inft.getSoulState(1);
      expect(soul.experienceCount).to.equal(5);
    });
  });
});
