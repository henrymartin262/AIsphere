import { expect } from "chai";
import { ethers } from "hardhat";
import type { DecisionChain } from "../typechain-types";
import type { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("DecisionChain", function () {
  let dc: DecisionChain;
  let owner: SignerWithAddress;
  let recorder: SignerWithAddress;
  let stranger: SignerWithAddress;

  const inputHash  = ethers.keccak256(ethers.toUtf8Bytes("user input"));
  const outputHash = ethers.keccak256(ethers.toUtf8Bytes("ai output"));
  const modelHash  = ethers.keccak256(ethers.toUtf8Bytes("deepseek-v3.1"));

  beforeEach(async () => {
    [owner, recorder, stranger] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("DecisionChain");
    dc = await Factory.deploy();
    await dc.waitForDeployment();
    await dc.addRecorder(recorder.address);
  });

  describe("recordDecision", () => {
    it("授权记录者应可记录决策", async () => {
      const tx = await dc.connect(recorder).recordDecision(1, inputHash, outputHash, modelHash, 3);
      await tx.wait();
      expect(await dc.getDecisionCount(1)).to.equal(1);
    });

    it("应发出 DecisionRecorded 事件", async () => {
      await expect(dc.connect(recorder).recordDecision(1, inputHash, outputHash, modelHash, 4))
        .to.emit(dc, "DecisionRecorded");
    });

    it("未授权地址调用应 revert", async () => {
      await expect(dc.connect(stranger).recordDecision(1, inputHash, outputHash, modelHash, 3))
        .to.be.revertedWith("DecisionChain: not authorized recorder");
    });

    it("importance 超出范围应 revert", async () => {
      await expect(dc.connect(recorder).recordDecision(1, inputHash, outputHash, modelHash, 0))
        .to.be.revertedWith("DecisionChain: importance must be 1-5");
      await expect(dc.connect(recorder).recordDecision(1, inputHash, outputHash, modelHash, 6))
        .to.be.revertedWith("DecisionChain: importance must be 1-5");
    });
  });

  describe("verifyProof", () => {
    it("记录后 proofHash 应可验证", async () => {
      const tx = await dc.connect(recorder).recordDecision(1, inputHash, outputHash, modelHash, 3);
      const receipt = await tx.wait();
      
      // 从事件中获取 proofHash
      const event = receipt?.logs.find(log => {
        try {
          const parsed = dc.interface.parseLog(log as any);
          return parsed?.name === "DecisionRecorded";
        } catch { return false; }
      });
      const parsed = dc.interface.parseLog(event as any);
      const proofHash = parsed?.args[1];

      expect(await dc.verifyProof(proofHash)).to.be.true;
    });

    it("不存在的 proofHash 应返回 false", async () => {
      const fakeHash = ethers.keccak256(ethers.toUtf8Bytes("fake"));
      expect(await dc.verifyProof(fakeHash)).to.be.false;
    });
  });

  describe("getRecentDecisions", () => {
    it("应按倒序返回决策（最新在前）", async () => {
      for (let i = 0; i < 3; i++) {
        const ih = ethers.keccak256(ethers.toUtf8Bytes(`input${i}`));
        await dc.connect(recorder).recordDecision(1, ih, outputHash, modelHash, 3);
      }
      const [decisions, total] = await dc.getRecentDecisions(1, 0, 2);
      expect(total).to.equal(3);
      expect(decisions.length).to.equal(2);
    });
  });

  describe("recordBatchDecisions", () => {
    it("应批量记录多条决策", async () => {
      const inputs = [1, 2, 3].map(i => ethers.keccak256(ethers.toUtf8Bytes(`input${i}`)));
      const outputs = inputs.map(h => ethers.keccak256(h));
      const models = inputs.map(() => modelHash);
      const imps = [1, 2, 3] as number[];

      await dc.connect(recorder).recordBatchDecisions(2, inputs, outputs, models, imps);
      expect(await dc.getDecisionCount(2)).to.equal(3);
    });
  });
});
