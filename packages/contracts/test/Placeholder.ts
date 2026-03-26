import { expect } from "chai";
import { ethers } from "hardhat";

describe("Placeholder", () => {
  it("exposes the bootstrap name", async () => {
    const factory = await ethers.getContractFactory("Placeholder");
    const contract = await factory.deploy();
    await contract.waitForDeployment();

    expect(await contract.NAME()).to.equal("SealMind Bootstrap");
  });
});
