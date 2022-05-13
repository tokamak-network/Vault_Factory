
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const vault = await ethers.getContractFactory("TOSVault");
  const vaultLogic = await vault.deploy();
  console.log("vaultLogic deployed to:", vaultLogic.address);

  await vaultLogic.deployed();
  
  console.log("finish")

  //npx hardhat verify --contract contracts/TOSVault/TOSVault.sol:TOSVault 0x4A210161E479b589FE0336cce94a4cA50b9Fc5d0 --network rinkeby
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });