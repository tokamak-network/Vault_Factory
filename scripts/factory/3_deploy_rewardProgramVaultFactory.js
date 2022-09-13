
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");
const {getUniswapInfo} = require("../uniswap_info");


async function main() {
  let deployer, user2;

  let {chainId, networkName, uniswapInfo } = await getUniswapInfo();

  [deployer, user2] = await ethers.getSigners();
  // console.log('deployer',deployer.address);
  // console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }

  const RewardProgramVaultFactory = await ethers.getContractFactory("RewardProgramVaultFactory");
  const rewardProgramVaultFactory  = await RewardProgramVaultFactory.deploy();

  let tx0 = await rewardProgramVaultFactory.deployed();
  console.log("RewardProgramVaultFactory tx0:", tx0.deployTransaction.hash);
  console.log("RewardProgramVaultFactory deployed to:", rewardProgramVaultFactory.address );

  deployInfo = {
      name: "RewardProgramVaultFactory",
      address: rewardProgramVaultFactory.address
  }

  save(networkName, deployInfo);

  const rewardProgramVaultFactoryContract = await ethers.getContractAt("RewardProgramVaultFactory", rewardProgramVaultFactory.address);
  tx = await rewardProgramVaultFactoryContract.connect(deployer).setStaker(uniswapInfo.UniswapV3Staker);
  await tx.wait();
  console.log("setStaker:", tx.hash);

  const EventLog = loadDeployed(networkName, "EventLog");
  tx = await rewardProgramVaultFactoryContract.connect(deployer).setLogEventAddress(EventLog);
  await tx.wait();
  console.log("setLogEventAddress:", tx.hash);

  tx = await rewardProgramVaultFactoryContract.connect(deployer).setWaitStartSeconds(ethers.BigNumber.from("60"));
  await tx.wait();
  console.log("setWaitStartSeconds:", tx.hash);

  const RewardProgramVaultAddress = loadDeployed(networkName, "RewardProgramVault");
  tx = await rewardProgramVaultFactoryContract.connect(deployer).setLogic(RewardProgramVaultAddress);
  await tx.wait();
  console.log("setLogic:", tx.hash);

  if(chainId == 1 || chainId == 4 || chainId == 5)
    await run("verify", {
      address: rewardProgramVaultFactory.address,
      constructorArgsParams: [],
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
