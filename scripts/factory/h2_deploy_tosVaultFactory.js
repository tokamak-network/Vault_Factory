
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const TOSFactory = await ethers.getContractFactory("TOSVaultFactory");
  const tosVfactory = await TOSFactory.deploy();
  console.log("vaultFactory deployed to:", tosVfactory.address);

  await tosVfactory.deployed();

  //rinkeby
  const logicaddr = "0xE2B9FC078d718c0E3A0A79D4FFA34C3CDb383306"

  const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"

  const dividedAddr = "0x3dE5e554a8E0fc8B5D0cf97bBdb5788D0Ba36E25"

  await tosVfactory.setLogic(
    logicaddr
  )

  await tosVfactory.setUpgradeAdmin(
    upgradeaddr
  )

  await tosVfactory.setLogEventAddress(
    eventAddr
  )

  await tosVfactory.setinfo(
    dividedAddr
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
