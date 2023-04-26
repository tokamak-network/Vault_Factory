
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");
// const {getUniswapInfo} = require("../uniswap_info");


async function main() {
  let deployer, user2;

  // mainnet
  let info = {
    vestingDao: "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1",
    vestingUpgradeAdmin: "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1",
    ton: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5",
    tos: "0x409c4D8cd5d2924b9bc5509230d16a61289c8153",
    poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  }

  const { chainId } = await ethers.provider.getNetwork();

  let networkName = "local";
  if(chainId == 1) networkName = "mainnet";
  if(chainId == 4) networkName = "rinkeby";
  if(chainId == 5) networkName = "goerli";

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

  const Initializer = loadDeployed(networkName, "Initializer");
  const EventLog = loadDeployed(networkName, "EventLog");
  const VestingPublicFund = loadDeployed(networkName, "VestingPublicFund");
  // const vestingPublicFundFactoryAddress = loadDeployed(networkName, "VestingPublicFundFactory");
  // const vestingPublicFundFactoryContract = await ethers.getContractAt("VestingPublicFundFactory", vestingPublicFundFactoryAddress);

  const vestingPublicFundFactoryContract = await ethers.getContractAt("VestingPublicFundFactory", vestingPublicFundFactory.address);

  tx = await vestingPublicFundFactoryContract.connect(deployer).setUpgradeAdmin(
    info.vestingUpgradeAdmin
  );
  await tx.wait();
  console.log("setUpgradeAdmin:", tx.hash);

  tx = await vestingPublicFundFactoryContract.connect(deployer).setBaseInfo(
        [
          info.ton,
          info.tos,
          info.vestingDao,
          info.poolfactory,
          Initializer
        ]
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
