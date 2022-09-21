
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer;

  [deployer] = await ethers.getSigners();
  
  const TypeCVaultFactory = await ethers.getContractFactory("TypeCVaultFactory");
  const typeCfactory = await TypeCVaultFactory.deploy();
  console.log("vaultFactory deployed to:", typeCfactory.address);

  await typeCfactory.deployed();

  // //rinkeby
  // // const logicaddr = "0x19a71b3646C609c77f8AB775a976d3F1a370BcF7"
  // const logicaddr = "0x97f674859dB715b3d3C1b909c844e634F2eA095f"

  // const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  // // const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"
  // const eventAddr = "0x4aAd46a82c1D6fB74c5f552CFB947cB05870F0c6"

  //mainnet
  // const logicaddr = "0xe0F0d15A60a51A4715326cEa2D236239683048C0"
  // const upgradeaddr = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1"
  // const eventAddr = "0x508d5FaDA6871348A5b4fb66f4A1F58b187Ce9Bd"

  //goerli
  const logicaddr = "0xBef737D725993847c345647ebA096500FdAE71c6"
  const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"
  const eventAddr = "0xcCcFc0c04c8c751f0ffF7CAf4340f2155BB352C8"

  await typeCfactory.setLogic(
    logicaddr
  )

  await typeCfactory.setUpgradeAdmin(
    upgradeaddr
  )

  await typeCfactory.setLogEventAddress(
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
