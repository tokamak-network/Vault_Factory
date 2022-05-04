
const { ethers } = require("hardhat");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const BFactory = await ethers.getContractFactory("TONVaultProxy");
  const bfactory = await BFactory.deploy();

  await bfactory.deployed();

  console.log("vaultFactory deployed to:", bfactory.address);
  console.log("finish")

  //npx hardhat verify --network rinkeby 0xeDCA0B2E67978DB8Ca0eA79CF702B7a82Ad83eeC --contract contracts/TONVault/TONVaultProxy.sol:TONVaultProxy
  //npx hardhat verify --network rinkeby 0xA52b7735042B51995C8e7A36b5798629b9e80265 --contract contracts/TOSVault/TOSVaultProxy.sol:TOSVaultProxy

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
