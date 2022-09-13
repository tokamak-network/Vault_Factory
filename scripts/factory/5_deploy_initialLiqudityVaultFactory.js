
const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");
const {getUniswapInfo} = require("../uniswap_info");


async function main() {
  let deployer, user2;

  let {chainId, networkName, uniswapInfo } = await getUniswapInfo();

  [deployer, user2] = await ethers.getSigners();
  // console.log('deployer',deployer.address);
  // console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }

  const InitialLiquidityVaultFactory = await ethers.getContractFactory("InitialLiquidityVaultFactory");
  const initialLiquidityVaultFactory  = await InitialLiquidityVaultFactory.deploy();

  let tx0 = await initialLiquidityVaultFactory.deployed();
  console.log("InitialLiquidityVaultFactory tx0:", tx0.deployTransaction.hash);
  console.log("InitialLiquidityVaultFactory deployed to:", initialLiquidityVaultFactory.address );

  deployInfo = {
      name: "InitialLiquidityVaultFactory",
      address: initialLiquidityVaultFactory.address
  }

  save(networkName, deployInfo);

  const initialLiquidityVaultFactoryContract = await ethers.getContractAt("InitialLiquidityVaultFactory", initialLiquidityVaultFactory.address);

  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setUniswapInfoNTokens(
        [uniswapInfo.poolfactory, uniswapInfo.npm],
        uniswapInfo.tos,
        uniswapInfo.fee
      );
  await tx.wait();

  console.log("setUniswapInfoNTokens:", tx.hash);
  const EventLog = loadDeployed(networkName, "EventLog");
  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setLogEventAddress(EventLog);
  await tx.wait();
  console.log("setLogEventAddress:", tx.hash);


  const InitialLiquidityVaultAddress = loadDeployed(networkName, "InitialLiquidityVault1");
  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setLogic(InitialLiquidityVaultAddress);
  await tx.wait();
  console.log("setLogic:", tx.hash);

  if(chainId == 1 || chainId == 4 || chainId == 5)
    await run("verify", {
      address: initialLiquidityVaultFactory.address,
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
