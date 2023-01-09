
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const vault = await ethers.getContractFactory("TOSVaultProxy");
  const vaultLogic = await vault.deploy();
  console.log("vaultLogic deployed to:", vaultLogic.address);

  await vaultLogic.deployed();
  
  console.log("finish")

  //npx hardhat verify 0xC0b514aC90856336cb1B783b6F8235DAA9D33ED2 --network rinkeby --contract contracts/TOSVault/TOSVaultProxy.sol:TOSVaultProxy
  //npx hardhat verify 0x59165cb69878ED06790c459D59E0f7aFAa1662CB --network mainnet --contract contracts/TOSVault/TOSVaultProxy.sol:TOSVaultProxy
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
