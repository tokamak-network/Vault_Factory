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
  const typeCFactory = await ethers.getContractFactory("TypeCVaultFactory");
  const factory = await typeCFactory.deploy();
  console.log("vaultFactory deployed to:", factory.address);

  await factory.deployed();

  //rinkeby
  const logicaddr = "0x092105c74432a05b03Dc8529f6A51f64C3669F07"

  const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"

  await factory.setLogic(
    logicaddr
  )

  await factory.setUpgradeAdmin(
    upgradeaddr
  )

  await factory.setLogEventAddress(
    eventAddr
  )

  console.log("finish")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
