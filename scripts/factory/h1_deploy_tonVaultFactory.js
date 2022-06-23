
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const TONFactory = await ethers.getContractFactory("TONVaultFactory");
  const tonVfactory = await TONFactory.deploy();
  console.log("vaultFactory deployed to:", tonVfactory.address);

  await tonVfactory.deployed();

  //rinkeby
  // // const logicaddr = "0x9906888eB644B49C6D60ceAE0104108a3D1113Fc"
  // const logicaddr = "0x8Be08835EF4AfF5d14220BeBC8B7622b3F8D8B83"

  // const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  // // const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"
  // const eventAddr = "0x4aAd46a82c1D6fB74c5f552CFB947cB05870F0c6"

  // // const dividedAddr = "0x41664a6F1b9F1380a2254b42E858A028d5eAD245"
  // const dividedAddr = "0x9aCb022B3A8a334618f5cea15A046C10FEE1352f"

  //mainnet
  const logicaddr = "0xaf96340E1Bfaf7DD5B58a4188a3E2Cb4586E7BdD"
  const upgradeaddr = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1"
  const eventAddr = "0x508d5FaDA6871348A5b4fb66f4A1F58b187Ce9Bd"
  const dividedAddr = "0x06245F89576536E9cF844C5804a8ad1CCeDb2642"

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

  console.log("set finish")

  // await tonVfactory.transferAdmin(upgradeaddr)
  // await tonVfactory.transferProxyAdmin(upgradeaddr)

  // console.log("finish owner change")

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
