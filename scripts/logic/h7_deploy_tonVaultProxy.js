
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

  //npx hardhat verify 0x274f1fEee5219380ff84df41F4F19c0dBD420C63 --network rinkeby --contract contracts/TONVault/TONVaultProxy.sol:TONVaultProxy
  //npx hardhat verify 0xBc78272DcDac34706b974FF3d6F77D91Ed6DBedE --network mainnet --contract contracts/TONVault/TONVaultProxy.sol:TONVaultProxy
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
