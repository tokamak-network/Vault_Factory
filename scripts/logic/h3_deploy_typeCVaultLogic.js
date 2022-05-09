
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const vault = await ethers.getContractFactory("TypeCVault");
  const vaultLogic = await vault.deploy();
  console.log("vaultLogic deployed to:", vaultLogic.address);

  await vaultLogic.deployed();
  
  console.log("finish")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
