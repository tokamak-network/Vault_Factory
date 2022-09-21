
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const vault = await ethers.getContractFactory("TONVault");
  const vaultLogic = await vault.deploy();
  console.log("vaultLogic deployed to:", vaultLogic.address);

  await vaultLogic.deployed();
  
  console.log("finish")

  //npx hardhat verify --contract contracts/TONVault/TONVault.sol:TONVault 0xc3f4EA06A7BB8F218643d622cF1e84B7e5e4229D --network rinkeby
  //npx hardhat verify --contract contracts/TONVault/TONVault.sol:TONVault 0xaf96340E1Bfaf7DD5B58a4188a3E2Cb4586E7BdD --network mainnet
  //npx hardhat verify --contract contracts/TONVault/TONVault.sol:TONVault 0xC597fE33d2066c9929a4AF3a0004f5ec55d39E06 --network goerli
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
