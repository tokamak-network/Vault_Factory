const { ethers, run } = require("hardhat");
const save = require("./save_deployed");
const loadDeployed = require("./load_deployed");

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

    let factory = await ethers.getContractFactory("FinalLogic")
    finalLogic = await factory.deploy();
    await finalLogic.deployed()

    console.log("FinalLogic: ", finalLogic.address);

    deployInfo = {
        name: "FinalLogic",
        address: finalLogic.address
    }

    save(networkName, deployInfo);

    if(chainId == 1 || chainId == 4 || chainId == 5) {

      await run("verify", {
        address: finalLogic.address,
        constructorArgsParams: [],
      });

    }

    console.log("finalLogic verified");

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });