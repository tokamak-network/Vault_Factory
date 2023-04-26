const { ethers, run } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
    const accounts = await ethers.getSigners();
    const deployer = accounts[0];
    console.log("deployer: ", deployer.address);

    const { chainId } = await ethers.provider.getNetwork();
    let networkName = "local";
    if(chainId == 1) networkName = "mainnet";
    if(chainId == 4) networkName = "rinkeby";
    if(chainId == 5) networkName = "goerli";

    let deployInfo = {
        name: "",
        address: ""
    }

    let factory = await ethers.getContractFactory("LiquidityAmounts")
    liquidityAmounts = await factory.deploy();
    await liquidityAmounts.deployed()

    console.log("LiquidityAmounts: ", liquidityAmounts.address);

    deployInfo = {
        name: "LiquidityAmounts",
        address: liquidityAmounts.address
    }

    save(networkName, deployInfo);

    if(chainId == 1 || chainId == 4 || chainId == 5) {

      await run("verify", {
        address: liquidityAmounts.address,
        constructorArgsParams: [],
      });

    }

    console.log("LiquidityAmounts verified");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });