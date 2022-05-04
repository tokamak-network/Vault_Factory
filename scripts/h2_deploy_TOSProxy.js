
const { ethers } = require("hardhat");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const BFactory = await ethers.getContractFactory("TOSVaultProxy");
  const bfactory = await BFactory.deploy();

  await bfactory.deployed();

  console.log("vaultFactory deployed to:", bfactory.address);
  console.log("finish")

  //npx hardhat verify --network rinkeby 0x6F08b7E4988d0AB3028f48d2F802ee0A32DE8Cb1 --contract contracts/TONVault/TONVaultProxy.sol:TONVaultProxy
  //npx hardhat verify --network rinkeby 0xb1F3581A9CdC5f9fe372ffC2c0D5f0F04B38F08e --contract contracts/TOSVault/TOSVaultProxy.sol:TOSVaultProxy

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
