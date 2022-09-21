
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
  // // const logicaddr = "0xE2B9FC078d718c0E3A0A79D4FFA34C3CDb383306"
  // const logicaddr = "0x4A210161E479b589FE0336cce94a4cA50b9Fc5d0"

  // const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"

  // // const eventAddr = "0x6eAb73266e1BDE7D823f278414e928e67C78FE20"
  // const eventAddr = "0x4aAd46a82c1D6fB74c5f552CFB947cB05870F0c6"

  // // const dividedAddr = "0x3dE5e554a8E0fc8B5D0cf97bBdb5788D0Ba36E25"
  // const dividedAddr = "0x5adc7de3a0B4A4797f02C3E99265cd7391437568"

   //mainnet
  //  const logicaddr = "0xEfb52DAB209Fb24A93173ad4A7E8F0e4549624Cb"
  //  const upgradeaddr = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1"
  //  const eventAddr = "0x508d5FaDA6871348A5b4fb66f4A1F58b187Ce9Bd"
  //  const dividedAddr = "0x69b4A202Fa4039B42ab23ADB725aA7b1e9EEBD79"

  //goerli
  const logicaddr = "0x988A796F5ca1d4848d00daC1c17d0A2Bbca18a9b"
  const upgradeaddr = "0x8c595DA827F4182bC0E3917BccA8e654DF8223E1"
  const eventAddr = "0xcCcFc0c04c8c751f0ffF7CAf4340f2155BB352C8"
  const dividedAddr = "0xa59B0e009BebC5496ca38A2EE5611f6cFe343dAB" //LockTOSDividendProxy 주소 넣어야함

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
