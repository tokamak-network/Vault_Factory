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
  const TONFactory = await ethers.getContractFactory("TONVaultFactory");
  const tonVfactory = await TONFactory.deploy();
  console.log("vaultFactory deployed to:", tonVfactory.address);

  await tonVfactory.deployed();

  //rinkeby
  const logicaddr = "0x9906888eB644B49C6D60ceAE0104108a3D1113Fc"

  const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"

  const dividedAddr = "0x41664a6F1b9F1380a2254b42E858A028d5eAD245"

  await tonVfactory.setLogic(
    logicaddr
  )

  await tonVfactory.setUpgradeAdmin(
    upgradeaddr
  )

  await tonVfactory.setLogEventAddress(
    eventAddr
  )

  await tonVfactory.setinfo(
    dividedAddr
  )

  console.log("finish")
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
