// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.
import { ethers } from "hardhat";

async function main() {
  // Hardhat always runs the compile task when running scripts with its command
  // line interface.
  //
  // If this script is run directly using `node` you may want to call compile
  // manually to make sure everything is compiled
  // await hre.run('compile');

  // We get the contract to deploy
  const BFactory = await ethers.getContractFactory("TOSVaultProxy");
  const bfactory = await BFactory.deploy();

  await bfactory.deployed();

  console.log("vaultFactory deployed to:", bfactory.address);

  //npx hardhat verify --network rinkeby 0xA52b7735042B51995C8e7A36b5798629b9e80265 --contract contracts/TOSVault/TOSVaultProxy.sol:TOSVaultProxy
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
