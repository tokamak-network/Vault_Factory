
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

  //npx hardhat verify --contract contracts/TOSVault/TOSVault.sol:TOSVault 0x60A1AA6f8639c5a26240D3fD2855AAc70CD3CA7a --network rinkeby
  //npx hardhat verify --contract contracts/TOSVault/TOSVault.sol:TOSVault 0xEfb52DAB209Fb24A93173ad4A7E8F0e4549624Cb --network mainnet
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
