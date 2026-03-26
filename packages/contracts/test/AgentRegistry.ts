import { expect } from "chai";
import { ethers } from "hardhat";
import type { AgentRegistry } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AgentRegistry", function () {
  let registry: AgentRegistry;
  let owner: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  beforeEach(async () => {
    [owner, user1, user2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("AgentRegistry");
    registry = await Factory.deploy(ethers.ZeroAddress); // 测试中不需要真实 INFT 地址
    await registry.waitForDeployment();
  });

  describe("registerAgent", () => {
    it("应成功注册 Agent", async () => {
      await registry.registerAgent(1, ["ai", "chat"], true, user1.address);
      expect(await registry.registeredAgents(1)).to.be.true;
    });

    it("应发出 AgentRegistered 事件", async () => {
      await expect(registry.registerAgent(1, ["ai"], false, user1.address))
        .to.emit(registry, "AgentRegistered")
        .withArgs(1, user1.address, false);
    });

    it("重复注册应 revert", async () => {
      await registry.registerAgent(1, ["ai"], true, user1.address);
      await expect(registry.registerAgent(1, ["ai"], true, user1.address))
        .to.be.revertedWith("AgentRegistry: already registered");
    });
  });

  describe("getPublicAgents", () => {
    it("应返回所有公开 Agent", async () => {
      await registry.registerAgent(1, [], true, user1.address);
      await registry.registerAgent(2, [], false, user2.address); // 私有
      await registry.registerAgent(3, [], true, user1.address);

      const [agents, total] = await registry.getPublicAgents(0, 10);
      expect(total).to.equal(2);
      expect(agents.map(id => Number(id))).to.include.members([1, 3]);
    });
  });

  describe("getAgentsByTag", () => {
    it("应按标签返回 Agent", async () => {
      await registry.registerAgent(1, ["defi", "ai"], true, user1.address);
      await registry.registerAgent(2, ["ai", "chat"], true, user2.address);
      await registry.registerAgent(3, ["defi"], true, user1.address);

      const defiAgents = await registry.getAgentsByTag("defi");
      expect(defiAgents.map(id => Number(id))).to.include.members([1, 3]);
    });
  });

  describe("setVisibility", () => {
    it("所有者可以改变可见性", async () => {
      await registry.registerAgent(1, [], true, user1.address);
      await registry.connect(user1).setVisibility(1, false);
      
      const [, total] = await registry.getPublicAgents(0, 10);
      expect(total).to.equal(0);
    });

    it("非所有者改变可见性应 revert", async () => {
      await registry.registerAgent(1, [], true, user1.address);
      await expect(registry.connect(user2).setVisibility(1, false))
        .to.be.revertedWith("AgentRegistry: not agent owner");
    });
  });
});
