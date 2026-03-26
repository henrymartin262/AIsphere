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
  });

  describe("authorizeOperator / revokeOperator", () => {
    it("Owner 应可授权操作员", async () => {
      await inft.authorizeOperator(operator.address);
      expect(await inft.authorizedOperators(operator.address)).to.be.true;
    });

    it("非 owner 调用授权应 revert", async () => {
      await expect(inft.connect(user1).authorizeOperator(operator.address))
        .to.be.reverted;
    });

    it("Owner 应可撤销操作员", async () => {
      await inft.authorizeOperator(operator.address);
      await inft.revokeOperator(operator.address);
      expect(await inft.authorizedOperators(operator.address)).to.be.false;
    });
  });

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
});
