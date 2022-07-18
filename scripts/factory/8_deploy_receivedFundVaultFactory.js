
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

  // rinkeby
  let info_rinkeby={
        ton: "0x44d4F5d89E9296337b8c48a332B3b2fb2C190CD0",
        dao: "0xeEcFEf9fA8315e72c007F976b9C8d929cf98bd79",
        upgradeAdmin: "0x5b6e72248b19F2c5b88A4511A6994AD101d0c287",
        EventLog: "0x4aad46a82c1d6fb74c5f552cfb947cb05870f0c6",
        wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
        tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
        ReceivedFundVaultAddress: "0x6c85cebe545b03dC72904cAC566935A0689f998f"
  }


  // mainnet
  let info_mainnet={
        ton: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
        dao: "0x2520cd65baa2ceee9e6ad6ebd3f45490c42dd303",
        upgradeAdmin: "0x15280a52e79fd4ab35f4b9acbb376dcd72b44fd1",
        EventLog: "0x508d5fada6871348a5b4fb66f4a1f58b187ce9bd",
        wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
        tos: "0x409c4D8cd5d2924b9bc5509230d16a61289c8153",
        ReceivedFundVaultAddress:  null
  }


async function main() {
  let deployer, user2;

  const { chainId } = await ethers.provider.getNetwork();
  let networkName = "local";
  let info = info_rinkeby;

  if(chainId == 1) {
    networkName = "mainnet";
    info = info_mainnet;
  }
  if(chainId == 4) networkName = "rinkeby";

  [deployer, user2] = await ethers.getSigners();
  // console.log('deployer',deployer.address);
  // console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }
  /*
  const ReceivedFundVaultFactory = await ethers.getContractFactory("ReceivedFundVaultFactory");
  const receivedFundVaultFactory  = await ReceivedFundVaultFactory.deploy();

  let tx0 = await receivedFundVaultFactory.deployed();
  console.log("ReceivedFundVaultFactory tx0:", tx0.deployTransaction.hash);
  console.log("ReceivedFundVaultFactory deployed to:", receivedFundVaultFactory.address );

  deployInfo = {
      name: "ReceivedFundVaultFactory",
      address: receivedFundVaultFactory.address
  }

  save(networkName, deployInfo);

  const receivedFundVaultFactoryContract = await ethers.getContractAt("ReceivedFundVaultFactory", receivedFundVaultFactory.address);
*/

let receivedFundVaultFactoryAddress = "0x61a6c5EF6D2f53a6A3De64ad9b4a51ED7F55A3E3";
const receivedFundVaultFactoryContract = await ethers.getContractAt("ReceivedFundVaultFactory", receivedFundVaultFactoryAddress);

  /*
  tx = await receivedFundVaultFactoryContract.connect(deployer).setUpgradeAdmin(
    info.upgradeAdmin
  );
  await tx.wait();
  console.log("setUpgradeAdmin:", tx.hash);
    */

  tx = await receivedFundVaultFactoryContract.connect(deployer).setBaseInfo(
        [info.ton, info.dao]
      );
  await tx.wait();
  console.log("setBaseInfo:", tx.hash);


  tx = await receivedFundVaultFactoryContract.connect(deployer).setLogEventAddress(info.EventLog);
  await tx.wait();
  console.log("setLogEventAddress:", tx.hash);

  tx = await receivedFundVaultFactoryContract.connect(deployer).setLogic(info.ReceivedFundVaultAddress);
  await tx.wait();
  console.log("setLogic:", tx.hash);

  if(chainId == 1 || chainId == 4)
    await run("verify", {
      address: receivedFundVaultFactoryContract.address,
      constructorArgsParams: [],
    });
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
