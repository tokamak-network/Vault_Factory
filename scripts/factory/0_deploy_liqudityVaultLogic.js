
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

async function main() {
  let deployer, user2;

  [deployer, user2] = await ethers.getSigners();
  console.log('deployer',deployer.address);
  console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }

  const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
  const liquidityVault  = await LiquidityVault.deploy();

  let tx0 = await liquidityVault.deployed();
  console.log("LiquidityVault tx0:", tx0.deployTransaction.hash);
  console.log("LiquidityVault deployed to:", liquidityVault.address);

  deployInfo = {
      name: "LiquidityVault",
      address: liquidityVault.address
  }

  save(process.env.NETWORK, deployInfo);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
