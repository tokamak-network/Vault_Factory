// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

const { ethers } = require("hardhat");
const UniswapV3PoolFactoryAbi = require("../abis/UniswapV3Factory.json");
const UniswapV3PoolAbi = require("../abis/UniswapV3Pool.json");
const save = require("./save_deployed");
const loadDeployed = require("./load_deployed");

async function main() {
   let deployer, user2;

  [deployer, user2] = await ethers.getSigners();
  console.log('deployer',deployer.address);
  console.log('user2',user2.address);

  // 프로젝트 토큰
  const AllocatedToken = loadDeployed(process.env.NETWORK, "AllocatedToken");

  //doc 0xb109f4c20bdb494a63e32aa035257fba0a4610a4
  // ercA 0xEbFFB9497237Fc84687E09a1C14DAE2a3be73D9C
  // We get the contract to deploy
  let poolInfo={
    name: "test",
    allocateToken: AllocatedToken,
    admin : "0x5b6e72248b19F2c5b88A4511A6994AD101d0c287"
  }

  let price = {
      tos: ethers.BigNumber.from("10000") ,
      projectToken:  ethers.BigNumber.from("250")
  }

  let deployInfo = {
    name: "",
    address: ""
  }

  poolInfo.admin = deployer.address;


  // rinkeby
  let uniswapInfo={
        poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        wethUsdcPool: "0xfbDc20aEFB98a2dD3842023f21D17004eAefbe68",
        wtonWethPool: "0xE032a3aEc591fF1Ca88122928161eA1053a098AC",
        wtonTosPool: "0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf",
        wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
        tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
        weth: "0xc778417e063141139fce010982780140aa0cd5ab",
        usdc: "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b",
        _fee: ethers.BigNumber.from("3000"),
        NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3"
  }

  // mainnet
  // let uniswapInfo={
  //       poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  //       npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  //       swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  //       wethUsdcPool: "",
  //       wtonWethPool: "",
  //       wtonTosPool: "0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf",
  //       wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
  //       tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
  //       weth: "0xc778417e063141139fce010982780140aa0cd5ab",
  //       usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  //       _fee: ethers.BigNumber.from("3000"),
  //       NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3"
  // }

  const LiquidityVaultProxy = loadDeployed(process.env.NETWORK, "LiquidityVaultProxy");
  const LiquidityVaultContract = await ethers.getContractAt("LiquidityVault", LiquidityVaultProxy);
  console.log("LiquidityVaultProxy :", LiquidityVaultProxy);

  let tx3 = await LiquidityVaultContract.connect(deployer)["setPool()"]();
  await tx3.wait();
  console.log('setPool ',tx3.hash);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
