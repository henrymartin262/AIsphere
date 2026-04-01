import { expect } from "chai";
import { ethers } from "hardhat";
import { time } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import type { BountyBoard } from "../typechain-types";
import type { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// ==================== 测试辅助常量 ====================

const MIN_REWARD = ethers.parseEther("0.001");
const ONE_ETH   = ethers.parseEther("1.0");
const ONE_DAY   = 24 * 60 * 60;

const ZERO_BYTES32 = ethers.ZeroHash;

// 示例验收标准哈希
const CRITERIA_HASH  = ethers.keccak256(ethers.toUtf8Bytes("deliver a working prototype"));
const PROOF_HASH     = ethers.keccak256(ethers.toUtf8Bytes("result proof data"));

// BountyStatus 枚举映射（与合约保持一致）
enum BountyStatus {
  Open      = 0,
  Assigned  = 1,
  Submitted = 2,
  Completed = 3,
  Disputed  = 4,
  Expired   = 5,
  Cancelled = 6,
}

// ==================== 辅助函数 ====================

/** 返回当前区块时间戳 + delta 秒 */
async function futureTimestamp(delta: number): Promise<number> {
  const now = await time.latest();
  return now + delta;
}

/** 部署 BountyBoard 合约 */
async function deployBountyBoard(): Promise<BountyBoard> {
  const Factory = await ethers.getContractFactory("BountyBoard");
  const contract = await Factory.deploy();
  await contract.waitForDeployment();
  return contract;
}

// ==================== 测试套件 ====================

describe("BountyBoard", () => {
  let board: BountyBoard;
  let owner: HardhatEthersSigner;
  let creator: HardhatEthersSigner;
  let agent1Owner: HardhatEthersSigner;
  let agent2Owner: HardhatEthersSigner;
  let stranger: HardhatEthersSigner;

  beforeEach(async () => {
    [owner, creator, agent1Owner, agent2Owner, stranger] = await ethers.getSigners();
    board = await deployBountyBoard();
  });

  // ==================== 部署验证 ====================

  describe("部署", () => {
    it("应正确设置 owner", async () => {
      expect(await board.owner()).to.equal(owner.address);
    });

    it("应正确设置 MIN_REWARD 和 DISPUTE_PERIOD", async () => {
      expect(await board.MIN_REWARD()).to.equal(MIN_REWARD);
      expect(await board.DISPUTE_PERIOD()).to.equal(3 * ONE_DAY);
    });

    it("初始 Bounty 总数应为 0", async () => {
      expect(await board.getTotalBounties()).to.equal(0);
    });
  });

  // ==================== 创建 Bounty ====================

  describe("createBounty", () => {
    it("应成功创建 Bounty 并发出事件", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      await expect(
        board.connect(creator).createBounty(
          "测试任务",
          "任务描述",
          deadline,
          CRITERIA_HASH,
          { value: ONE_ETH }
        )
      )
        .to.emit(board, "BountyCreated")
        .withArgs(1, creator.address, ONE_ETH, deadline);
    });

    it("创建后合约余额应增加赏金金额", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      await board.connect(creator).createBounty(
        "任务1", "描述", deadline, CRITERIA_HASH,
        { value: ONE_ETH }
      );

      const contractBalance = await ethers.provider.getBalance(await board.getAddress());
      expect(contractBalance).to.equal(ONE_ETH);
    });

    it("创建后 Bounty 状态应为 Open", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty(
        "任务1", "描述", deadline, CRITERIA_HASH,
        { value: ONE_ETH }
      );

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Open);
      expect(bounty.creator).to.equal(creator.address);
      expect(bounty.reward).to.equal(ONE_ETH);
      expect(bounty.criteriaHash).to.equal(CRITERIA_HASH);
      expect(bounty.parentBountyId).to.equal(0);
    });

    it("总数应递增", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T1", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      await board.connect(creator).createBounty("T2", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      expect(await board.getTotalBounties()).to.equal(2);
    });

    it("赏金不足 MIN_REWARD 应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      const tooLow = MIN_REWARD - 1n;

      await expect(
        board.connect(creator).createBounty("任务", "描述", deadline, CRITERIA_HASH, { value: tooLow })
      ).to.be.revertedWith("BountyBoard: reward below minimum");
    });

    it("deadline 在过去应 revert", async () => {
      const pastDeadline = await futureTimestamp(-ONE_DAY);

      await expect(
        board.connect(creator).createBounty("任务", "描述", pastDeadline, CRITERIA_HASH, { value: ONE_ETH })
      ).to.be.revertedWith("BountyBoard: deadline must be in the future");
    });

    it("标题为空应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      await expect(
        board.connect(creator).createBounty("", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH })
      ).to.be.revertedWith("BountyBoard: title cannot be empty");
    });

    it("getBountiesByCreator 应返回创建者的 Bounty ID 列表", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T1", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      await board.connect(creator).createBounty("T2", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });

      const ids = await board.getBountiesByCreator(creator.address);
      expect(ids.length).to.equal(2);
      expect(ids[0]).to.equal(1);
      expect(ids[1]).to.equal(2);
    });
  });

  // ==================== 接单流程 ====================

  describe("acceptBounty", () => {
    let bountyId: bigint;
    let deadline: number;

    beforeEach(async () => {
      deadline = await futureTimestamp(ONE_DAY);
      const tx = await board.connect(creator).createBounty(
        "接单测试", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH }
      );
      const receipt = await tx.wait();
      // 第一个 Bounty ID 为 1
      bountyId = 1n;
    });

    it("应成功接单并发出事件", async () => {
      await expect(
        board.connect(agent1Owner).acceptBounty(bountyId, 42, agent1Owner.address)
      )
        .to.emit(board, "BountyAccepted")
        .withArgs(bountyId, 42, agent1Owner.address);
    });

    it("接单后状态应变为 Assigned", async () => {
      await board.connect(agent1Owner).acceptBounty(bountyId, 42, agent1Owner.address);

      const bounty = await board.getBounty(bountyId);
      expect(bounty.status).to.equal(BountyStatus.Assigned);
      expect(bounty.assignedAgentId).to.equal(42);
      expect(bounty.assignedOwner).to.equal(agent1Owner.address);
    });

    it("getBountiesByAgent 应返回接单记录", async () => {
      await board.connect(agent1Owner).acceptBounty(bountyId, 42, agent1Owner.address);
      const ids = await board.getBountiesByAgent(42);
      expect(ids.length).to.equal(1);
      expect(ids[0]).to.equal(bountyId);
    });

    it("非 Open 状态不可接单（应 revert）", async () => {
      await board.connect(agent1Owner).acceptBounty(bountyId, 42, agent1Owner.address);

      await expect(
        board.connect(agent2Owner).acceptBounty(bountyId, 99, agent2Owner.address)
      ).to.be.revertedWith("BountyBoard: bounty is not open");
    });

    it("agentOwner 为零地址应 revert", async () => {
      await expect(
        board.connect(agent1Owner).acceptBounty(bountyId, 42, ethers.ZeroAddress)
      ).to.be.revertedWith("BountyBoard: agentOwner cannot be zero address");
    });

    it("截止时间已过应 revert", async () => {
      // 推进时间到 deadline 之后
      await time.increase(ONE_DAY + 1);

      await expect(
        board.connect(agent1Owner).acceptBounty(bountyId, 42, agent1Owner.address)
      ).to.be.revertedWith("BountyBoard: bounty has expired");
    });
  });

  // ==================== 完整完成流程 ====================

  describe("完整完成流程：create → accept → submit → approve", () => {
    it("赏金应正确转移给接单 Agent owner", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      // 1. 创建
      await board.connect(creator).createBounty(
        "完整流程测试", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH }
      );

      // 2. 接单
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);

      // 3. 提交结果
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);

      // 记录 agent1Owner 提交前余额
      const balanceBefore = await ethers.provider.getBalance(agent1Owner.address);

      // 4. 验收（creator 调用）
      const tx = await board.connect(creator).approveBounty(1);
      await tx.wait();

      const balanceAfter = await ethers.provider.getBalance(agent1Owner.address);

      // 余额增加了约 1 ETH（接受者不支付 gas，所以是精确的）
      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);
    });

    it("approveBounty 应发出 BountyCompleted 事件", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);

      await expect(board.connect(creator).approveBounty(1))
        .to.emit(board, "BountyCompleted")
        .withArgs(1, agent1Owner.address, ONE_ETH);
    });

    it("完成后合约余额应为 0", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);
      await board.connect(creator).approveBounty(1);

      const contractBalance = await ethers.provider.getBalance(await board.getAddress());
      expect(contractBalance).to.equal(0);
    });

    it("完成后 status 应为 Completed", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);
      await board.connect(creator).approveBounty(1);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Completed);
      expect(bounty.completedAt).to.be.greaterThan(0);
    });

    it("非 creator/owner 调用 approveBounty 应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);

      await expect(
        board.connect(stranger).approveBounty(1)
      ).to.be.revertedWith("BountyBoard: not authorized to approve");
    });

    it("submitResult 时 proofHash 为零值应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);

      await expect(
        board.connect(agent1Owner).submitResult(1, ZERO_BYTES32)
      ).to.be.revertedWith("BountyBoard: proof hash cannot be zero");
    });

    it("非接单人调用 submitResult 应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);

      await expect(
        board.connect(stranger).submitResult(1, PROOF_HASH)
      ).to.be.revertedWith("BountyBoard: not authorized to submit");
    });
  });

  // ==================== 取消 Bounty ====================

  describe("cancelBounty", () => {
    it("creator 取消应退回赏金", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await board.connect(creator).cancelBounty(1);
      const receipt = await tx.wait();
      const gasUsed = receipt!.gasUsed * receipt!.gasPrice;
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      // 退款 1 ETH 减去 gas 消耗
      expect(balanceAfter - balanceBefore + gasUsed).to.equal(ONE_ETH);
    });

    it("取消应发出 BountyCancelled 事件", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      await expect(board.connect(creator).cancelBounty(1))
        .to.emit(board, "BountyCancelled")
        .withArgs(1, ONE_ETH);
    });

    it("取消后状态应为 Cancelled", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(creator).cancelBounty(1);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Cancelled);
    });

    it("非 creator 且非 owner 调用应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      await expect(
        board.connect(stranger).cancelBounty(1)
      ).to.be.revertedWith("BountyBoard: not authorized to cancel");
    });

    it("已接单（非 Open）状态取消应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);

      await expect(
        board.connect(creator).cancelBounty(1)
      ).to.be.revertedWith("BountyBoard: can only cancel open bounties");
    });

    it("owner 可取消他人发布的任务", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      await expect(board.connect(owner).cancelBounty(1))
        .to.emit(board, "BountyCancelled");
    });
  });

  // ==================== 超时退款 ====================

  describe("expireBounty", () => {
    it("Open 状态超时应退回赏金", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      // 推进时间到 deadline 之后
      await time.increase(ONE_DAY + 1);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      const tx = await board.connect(stranger).expireBounty(1);  // 任何人可触发
      const receipt = await tx.wait();
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      // creator 得到退款（stranger 支付 gas，creator 无 gas 损耗）
      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);
    });

    it("Assigned 状态超时也应退回赏金", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);

      await time.increase(ONE_DAY + 1);

      await expect(board.connect(stranger).expireBounty(1))
        .to.emit(board, "BountyExpired")
        .withArgs(1, ONE_ETH);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Expired);
    });

    it("未到 deadline 应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });

      await expect(
        board.connect(stranger).expireBounty(1)
      ).to.be.revertedWith("BountyBoard: deadline not reached");
    });

    it("Submitted 状态不可超时（应 revert）", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);

      await time.increase(ONE_DAY + 1);

      await expect(
        board.connect(stranger).expireBounty(1)
      ).to.be.revertedWith("BountyBoard: cannot expire in current status");
    });
  });

  // ==================== 争议仲裁 ====================

  describe("争议仲裁流程", () => {
    beforeEach(async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(1, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(1, PROOF_HASH);
    });

    it("creator 可对 Submitted 任务发起争议", async () => {
      await expect(board.connect(creator).disputeBounty(1))
        .to.emit(board, "BountyDisputed")
        .withArgs(1);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Disputed);
    });

    it("非 creator 发起争议应 revert", async () => {
      await expect(
        board.connect(stranger).disputeBounty(1)
      ).to.be.revertedWith("BountyBoard: only creator can dispute");
    });

    it("owner 仲裁通过：赏金转给接单方", async () => {
      await board.connect(creator).disputeBounty(1);

      const balanceBefore = await ethers.provider.getBalance(agent1Owner.address);
      await board.connect(owner).resolveDispute(1, true);
      const balanceAfter = await ethers.provider.getBalance(agent1Owner.address);

      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Completed);
    });

    it("owner 仲裁否决：赏金退回发布方", async () => {
      await board.connect(creator).disputeBounty(1);

      const balanceBefore = await ethers.provider.getBalance(creator.address);
      await board.connect(owner).resolveDispute(1, false);
      const balanceAfter = await ethers.provider.getBalance(creator.address);

      expect(balanceAfter - balanceBefore).to.equal(ONE_ETH);

      const bounty = await board.getBounty(1);
      expect(bounty.status).to.equal(BountyStatus.Cancelled);
    });

    it("resolveDispute 应发出 BountyDisputeResolved 事件", async () => {
      await board.connect(creator).disputeBounty(1);

      await expect(board.connect(owner).resolveDispute(1, true))
        .to.emit(board, "BountyDisputeResolved")
        .withArgs(1, true);
    });

    it("非 owner 调用 resolveDispute 应 revert", async () => {
      await board.connect(creator).disputeBounty(1);

      await expect(
        board.connect(stranger).resolveDispute(1, true)
      ).to.be.revertedWith("BountyBoard: not owner");
    });
  });

  // ==================== 子任务 ====================

  describe("createSubBounty", () => {
    it("应成功创建子任务并发出事件", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      // 先创建父任务
      await board.connect(creator).createBounty("父任务", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH });

      // 创建子任务
      const subDeadline = await futureTimestamp(ONE_DAY / 2);
      await expect(
        board.connect(agent1Owner).createSubBounty(
          1, "子任务", "子任务描述", subDeadline, CRITERIA_HASH, 42,
          { value: MIN_REWARD }
        )
      )
        .to.emit(board, "SubBountyCreated")
        .withArgs(1, 2, MIN_REWARD);
    });

    it("子任务的 parentBountyId 应指向父任务", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("父任务", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH });

      const subDeadline = await futureTimestamp(ONE_DAY / 2);
      await board.connect(agent1Owner).createSubBounty(
        1, "子任务", "描述", subDeadline, CRITERIA_HASH, 42, { value: MIN_REWARD }
      );

      const sub = await board.getBounty(2);
      expect(sub.parentBountyId).to.equal(1);
      expect(sub.creatorAgentId).to.equal(42);
      expect(sub.status).to.equal(BountyStatus.Open);
    });

    it("父任务不存在时应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);

      await expect(
        board.connect(creator).createSubBounty(
          999, "子任务", "描述", deadline, CRITERIA_HASH, 1, { value: MIN_REWARD }
        )
      ).to.be.revertedWith("BountyBoard: bounty does not exist");
    });

    it("父任务已取消时不可创建子任务", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("父任务", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(creator).cancelBounty(1);

      const subDeadline = await futureTimestamp(ONE_DAY / 2);
      await expect(
        board.connect(agent1Owner).createSubBounty(
          1, "子任务", "描述", subDeadline, CRITERIA_HASH, 1, { value: MIN_REWARD }
        )
      ).to.be.revertedWith("BountyBoard: parent bounty is not active");
    });

    it("子任务赏金不足应 revert", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("父任务", "描述", deadline, CRITERIA_HASH, { value: ONE_ETH });

      const subDeadline = await futureTimestamp(ONE_DAY / 2);
      await expect(
        board.connect(agent1Owner).createSubBounty(
          1, "子任务", "描述", subDeadline, CRITERIA_HASH, 1, { value: MIN_REWARD - 1n }
        )
      ).to.be.revertedWith("BountyBoard: reward below minimum");
    });
  });

  // ==================== 查询函数 ====================

  describe("查询函数", () => {
    beforeEach(async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      // 创建 3 个 Bounty
      await board.connect(creator).createBounty("T1", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      await board.connect(creator).createBounty("T2", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      await board.connect(creator).createBounty("T3", "D", deadline, CRITERIA_HASH, { value: MIN_REWARD });
      // 接单并取消 T3
      await board.connect(creator).cancelBounty(3);
    });

    it("getBounties 应支持分页", async () => {
      const [result, total] = await board.getBounties(0, 2);
      expect(total).to.equal(3);
      expect(result.length).to.equal(2);
      expect(result[0].id).to.equal(1);
      expect(result[1].id).to.equal(2);
    });

    it("getBounties offset 超出范围应返回空数组", async () => {
      const [result, total] = await board.getBounties(10, 5);
      expect(total).to.equal(3);
      expect(result.length).to.equal(0);
    });

    it("getBountiesByStatus 应按状态筛选", async () => {
      const [openBounties, total] = await board.getBountiesByStatus(BountyStatus.Open, 0, 0);
      expect(total).to.equal(2);
      expect(openBounties.length).to.equal(2);

      const [cancelledBounties,] = await board.getBountiesByStatus(BountyStatus.Cancelled, 0, 0);
      expect(cancelledBounties.length).to.equal(1);
      expect(cancelledBounties[0].id).to.equal(3);
    });

    it("getTotalRewardPool 应统计 Open 状态的赏金总和", async () => {
      // T1 和 T2 为 Open，T3 已 Cancelled
      const pool = await board.getTotalRewardPool();
      expect(pool).to.equal(MIN_REWARD * 2n);
    });

    it("getTotalRewardPool 应包含 Submitted 状态", async () => {
      const deadline = await futureTimestamp(ONE_DAY);
      await board.connect(creator).createBounty("T4", "D", deadline, CRITERIA_HASH, { value: ONE_ETH });
      await board.connect(agent1Owner).acceptBounty(4, 1, agent1Owner.address);
      await board.connect(agent1Owner).submitResult(4, PROOF_HASH);

      // T1 + T2 (MIN_REWARD * 2) + T4 (ONE_ETH)
      const pool = await board.getTotalRewardPool();
      expect(pool).to.equal(MIN_REWARD * 2n + ONE_ETH);
    });
  });
});
