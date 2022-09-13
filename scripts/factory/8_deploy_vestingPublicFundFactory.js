
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");
const {getUniswapInfo} = require("../uniswap_info");


async function main() {
  let deployer, user2;

  let {chainId, networkName, uniswapInfo } = await getUniswapInfo();

  let info = uniswapInfo;

  [deployer, user2] = await ethers.getSigners();
  // console.log('deployer',deployer.address);
  // console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }

  const VestingPublicFundFactory = await ethers.getContractFactory("VestingPublicFundFactory");
  const vestingPublicFundFactory  = await VestingPublicFundFactory.deploy();

  let tx0 = await vestingPublicFundFactory.deployed();
  console.log("VestingPublicFundFactory tx0:", tx0.deployTransaction.hash);
  console.log("VestingPublicFundFactory deployed to:", vestingPublicFundFactory.address );

  deployInfo = {
      name: "VestingPublicFundFactory",
      address: vestingPublicFundFactory.address
  }

  save(networkName, deployInfo);

  const EventLog = loadDeployed(networkName, "EventLog");
  const VestingPublicFund = loadDeployed(networkName, "VestingPublicFund");
  const vestingPublicFundFactoryContract = await ethers.getContractAt("VestingPublicFundFactory", vestingPublicFundFactory.address);

  tx = await vestingPublicFundFactoryContract.connect(deployer).setUpgradeAdmin(
    info.vestingUpgradeAdmin
  );
  await tx.wait();
  console.log("setUpgradeAdmin:", tx.hash);

  tx = await vestingPublicFundFactoryContract.connect(deployer).setBaseInfo(
        [uniswapInfo.ton, uniswapInfo.vestingDao]
      );
  await tx.wait();
  console.log("setBaseInfo:", tx.hash);


  tx = await vestingPublicFundFactoryContract.connect(deployer).setLogEventAddress(EventLog);
  await tx.wait();
  console.log("setLogEventAddress:", tx.hash);

  tx = await vestingPublicFundFactoryContract.connect(deployer).setLogic(VestingPublicFund);
  await tx.wait();
  console.log("setLogic:", tx.hash);

  if(chainId == 1 || chainId == 4 || chainId == 5)
    await run("verify", {
      address: vestingPublicFundFactoryContract.address,
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
