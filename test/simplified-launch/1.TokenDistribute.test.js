const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;
const _ = require("lodash");
chai.use(solidity);
require("chai").should();

const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");

let tosAdmin = "0x12a936026f072d4e97047696a9d11f97eae47d21";
let TosV2Admin = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1";

describe("TokenDistribute", function () {

  let provider;

  let tokenDistribute, projectToken, projectToken1
  let erc20Info = {
    name: 'TEST1',
    symbol: 'TST'
  }

  before(async () => {
    accounts = await ethers.getSigners();
    [admin1, admin2, user1, user2, user3, user4, user5, user6 ] = accounts;
    //console.log('admin1',admin1.address);
    console.log('admin1',admin1.address);
    provider = ethers.provider;

    await hre.ethers.provider.send("hardhat_setBalance", [
      admin1.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);
    await hre.ethers.provider.send("hardhat_setBalance", [
      user1.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);
    await hre.ethers.provider.send("hardhat_setBalance", [
      user2.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);

    await hre.ethers.provider.send("hardhat_impersonateAccount",[TosV2Admin]);

    _TosV2Admin = await ethers.getSigner(TosV2Admin);

  });

  describe("TokenDistribute ", () => {

    it("deploy ERC20 for test", async function() {
      const erc20mock = await ethers.getContractFactory("ERC20Mock")

      projectToken = await erc20mock.connect(admin1).deploy(
        erc20Info.name, erc20Info.symbol);

      let code = await admin1.provider.getCode(projectToken.address);
      expect(code).to.not.eq("0x");

      expect(await projectToken.name()).to.be.equal(erc20Info.name);
      expect(await projectToken.symbol()).to.be.equal(erc20Info.symbol);
    });

    it("deploy TokenDistribute ", async () => {
      let factory = await ethers.getContractFactory("TokenDistribute")
      tokenDistribute = await factory.deploy();
      await tokenDistribute.deployed();

      let code = await ethers.provider.getCode(tokenDistribute.address);
      expect(code).to.not.eq("0x");
    })

    it("distribute", async () => {
      //   user1, user2, user3, user4, user5
      //   0.1, 0.2, 0.4, 0.1, 0.2
      const totalSupply = await projectToken.totalSupply();
      // console.log("totalSupply", totalSupply.toString());

      let DistributeInfo = [
        {
          to: user1.address,
          amount: ethers.utils.parseEther("100000000")
        },
        {
          to: user2.address,
          amount: ethers.utils.parseEther("200000000")
        },
        {
          to: user3.address,
          amount: ethers.utils.parseEther("400000000")
        },
        {
          to: user4.address,
          amount: ethers.utils.parseEther("100000000")
        },
        {
          to: user5.address,
          amount: ethers.utils.parseEther("200000000")
        }
      ]

      let tx = await projectToken.connect(admin1).approve(
        tokenDistribute.address, totalSupply
      );

      await tx.wait();

      // let allowance = await projectToken.allowance(
      //   admin1.address, tokenDistribute.address
      // );

      let result = await tokenDistribute.connect(admin1).distribute(
          projectToken.address,
          totalSupply,
          DistributeInfo
        );

      expect(await projectToken.balanceOf(user1.address)).to.be.eq(DistributeInfo[0].amount);
      expect(await projectToken.balanceOf(user2.address)).to.be.eq(DistributeInfo[1].amount);
      expect(await projectToken.balanceOf(user3.address)).to.be.eq(DistributeInfo[2].amount);
      expect(await projectToken.balanceOf(user4.address)).to.be.eq(DistributeInfo[3].amount);
      expect(await projectToken.balanceOf(user5.address)).to.be.eq(DistributeInfo[4].amount);

    })

    it("deploy ERC20ApproveAndCallMock for test", async function() {
      const erc20mock = await ethers.getContractFactory("ERC20ApproveAndCallMock")

      projectToken1 = await erc20mock.connect(admin1).deploy(
        erc20Info.name, erc20Info.symbol);

      let code = await admin1.provider.getCode(projectToken.address);
      expect(code).to.not.eq("0x");

      expect(await projectToken1.name()).to.be.equal(erc20Info.name);
      expect(await projectToken1.symbol()).to.be.equal(erc20Info.symbol);
    });

    it("token approveAndCall", async () => {
      //   user1, user2, user3, user4, user5
      //   0.1, 0.2, 0.4, 0.1, 0.2
      const totalSupply = await projectToken1.totalSupply();
      // console.log("totalSupply", totalSupply.toString());

      let DistributeInfo = [
        {
          to: user1.address,
          amount: ethers.utils.parseEther("100000000")
        },
        {
          to: user2.address,
          amount: ethers.utils.parseEther("200000000")
        },
        {
          to: user3.address,
          amount: ethers.utils.parseEther("400000000")
        },
        {
          to: user4.address,
          amount: ethers.utils.parseEther("100000000")
        },
        {
          to: user5.address,
          amount: ethers.utils.parseEther("200000000")
        }
      ]

      const amountInTON = totalSupply;
      const paramsData = ethers.utils.solidityPack(
        ["address", "uint256",
        "address", "uint256",
        "address", "uint256",
        "address", "uint256",
        "address", "uint256"],
        [
          DistributeInfo[0].to, DistributeInfo[0].amount,
          DistributeInfo[1].to, DistributeInfo[1].amount,
          DistributeInfo[2].to, DistributeInfo[2].amount,
          DistributeInfo[3].to, DistributeInfo[3].amount,
          DistributeInfo[4].to, DistributeInfo[4].amount,
        ]
      );

      const data = ethers.utils.solidityPack(
        ["uint256", "bytes"],
        [amountInTON, paramsData]
      );

      const tx = await projectToken1
        .connect(admin1)
        .approveAndCall(tokenDistribute.address, amountInTON, data);
      await tx.wait();

      expect(await projectToken.balanceOf(user1.address)).to.be.eq(DistributeInfo[0].amount);
      expect(await projectToken.balanceOf(user2.address)).to.be.eq(DistributeInfo[1].amount);
      expect(await projectToken.balanceOf(user3.address)).to.be.eq(DistributeInfo[2].amount);
      expect(await projectToken.balanceOf(user4.address)).to.be.eq(DistributeInfo[3].amount);
      expect(await projectToken.balanceOf(user5.address)).to.be.eq(DistributeInfo[4].amount);

    })

  })
})