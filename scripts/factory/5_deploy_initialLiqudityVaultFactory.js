
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

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
        fee: ethers.BigNumber.from("3000"),
        NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3",
        UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65"
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


async function main() {
  let deployer, user2;

  [deployer, user2] = await ethers.getSigners();
  console.log('deployer',deployer.address);
  console.log('user2',user2.address);

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

  save(process.env.NETWORK, deployInfo);

  const initialLiquidityVaultFactoryContract = await ethers.getContractAt("InitialLiquidityVaultFactory", initialLiquidityVaultFactory.address);

  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setUniswapInfoNTokens(
        [uniswapInfo.poolfactory, uniswapInfo.npm],
        uniswapInfo.tos,
        uniswapInfo.fee
      );
  await tx.wait();

  console.log("setUniswapInfoNTokens:", tx.hash);
  const EventLog = loadDeployed(process.env.NETWORK, "EventLog");
  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setLogEventAddress(EventLog);
  await tx.wait();
  console.log("setLogEventAddress:", tx.hash);


  const InitialLiquidityVaultAddress = loadDeployed(process.env.NETWORK, "InitialLiquidityVault");
  tx = await initialLiquidityVaultFactoryContract.connect(deployer).setLogic(InitialLiquidityVaultAddress);
  await tx.wait();
  console.log("setLogic:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
