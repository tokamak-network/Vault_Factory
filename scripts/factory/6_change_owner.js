
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

// rinkeby
let newOwnerAddress = '0x3b9878Ef988B086F13E5788ecaB9A35E74082ED9';
// mainnet
//let newOwnerAddress = '0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1';
//newOwner: 0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1

async function main() {

  console.log('newOwnerAddress',newOwnerAddress);

  /*
  let deployer, user2;

  const { chainId } = await ethers.provider.getNetwork();
  let networkName = "local";

  if(chainId == 1) {
    networkName = "mainnet";
  }
  if(chainId == 4) networkName = "rinkeby";

  [deployer, user2] = await ethers.getSigners();


  const RewardProgramVaultFactoryAddress = loadDeployed(networkName, "RewardProgramVaultFactory");
  const InitialLiquidityVaultFactoryAddress = loadDeployed(networkName, "InitialLiquidityVaultFactory");

  const rewardProgramVaultFactoryContract = await ethers.getContractAt("RewardProgramVaultFactory", RewardProgramVaultFactoryAddress);
  const initialLiquidityVaultFactoryContract = await ethers.getContractAt("InitialLiquidityVaultFactory", InitialLiquidityVaultFactoryAddress);

  console.log("--------------");
  console.log('RewardProgramVaultFactoryAddress',RewardProgramVaultFactoryAddress);

  let tx = await rewardProgramVaultFactoryContract.connect(deployer).setUpgradeAdmin(newOwnerAddress);
  await tx.wait();
  console.log("RewardProgramVaultFactory setUpgradeAdmin(",newOwnerAddress,"):", tx.hash);

  tx = await rewardProgramVaultFactoryContract.connect(deployer).transferAdmin(newOwnerAddress);
  await tx.wait();
  console.log("RewardProgramVaultFactory transferAdmin(",newOwnerAddress,"):", tx.hash);

  let isAdmin0 = await rewardProgramVaultFactoryContract.isAdmin(newOwnerAddress);
  console.log("RewardProgramVaultFactory isAdmin(",newOwnerAddress,"):", isAdmin0);

  let isAdmin1 = await rewardProgramVaultFactoryContract.isAdmin(deployer.address);
  console.log("RewardProgramVaultFactory isAdmin(",deployer.address,"):", isAdmin1);

  console.log("--------------");
  console.log('InitialLiquidityVaultFactoryAddress',InitialLiquidityVaultFactoryAddress);
  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setUpgradeAdmin(newOwnerAddress);
  await tx.wait();
  console.log("InitialLiquidityVaultFactory setUpgradeAdmin(",newOwnerAddress,"):", tx.hash);

  tx = await initialLiquidityVaultFactoryContract.connect(deployer).transferAdmin(newOwnerAddress);
  await tx.wait();
  console.log("InitialLiquidityVaultFactory transferAdmin(",newOwnerAddress,"):", tx.hash);

  isAdmin0 = await initialLiquidityVaultFactoryContract.isAdmin(newOwnerAddress);
  console.log("InitialLiquidityVaultFactory isAdmin(",newOwnerAddress,"):", isAdmin0);

  isAdmin1 = await initialLiquidityVaultFactoryContract.isAdmin(deployer.address);
  console.log("InitialLiquidityVaultFactory isAdmin(",deployer.address,"):", isAdmin1);
  */

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
