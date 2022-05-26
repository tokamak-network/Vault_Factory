
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const TypeBVaultFactory = await ethers.getContractFactory("TypeBVaultFactory");
  const typeBfactory = await TypeBVaultFactory.deploy();
  console.log("vaultFactory deployed to:", typeBfactory.address);

  await typeBfactory.deployed();

  // //rinkeby
  // // const logicaddr = "0x19a71b3646C609c77f8AB775a976d3F1a370BcF7"
  // const logicaddr = "0x83BCf174672DEa073cD48d1a7e18AbA5e897b8b4"

  // const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  // // const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"
  // const eventAddr = "0x4aAd46a82c1D6fB74c5f552CFB947cB05870F0c6"

  //mainnet
  const logicaddr = "0xdBDDbdAF786953addbad443aeF5941229A42e7D9"
  const upgradeaddr = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1"
  const eventAddr = "0x508d5FaDA6871348A5b4fb66f4A1F58b187Ce9Bd"


  await typeBfactory.setLogic(
    logicaddr
  )

  await typeBfactory.setUpgradeAdmin(
    upgradeaddr
  )

  await typeBfactory.setLogEventAddress(
    eventAddr
  )

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
