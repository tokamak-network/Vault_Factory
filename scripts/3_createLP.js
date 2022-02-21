// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// When running the script with `npx hardhat run <script>` you'll find the Hardhat
// Runtime Environment's members available in the global scope.

const { ethers } = require("hardhat");
const {
  keccak256,
} = require("web3-utils");
const JSBI = require('jsbi');
const Web3 = require('web3');

const {
  encodePriceSqrt,
  getNegativeOneTick,
  getPositiveOneMaxTick,
  getTick,
  TICK_SPACINGS,
  FeeAmount,
  getMinTick,
  getMaxTick
} = require("../test/uniswap-v3/uniswap-v3-contracts");


const ERC20Abi = require("../abis/ERC20A.json");
const UniswapV3PoolFactoryAbi = require("../abis/UniswapV3Factory.json");
const UniswapV3PoolAbi = require("../abis/UniswapV3Pool.json");
const NonfungiblePositionManagerAbi = require("../abis/NonfungiblePositionManager.json");


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

  const MINTER_ROLE = keccak256("MINTER_ROLE");
  const ERC20TokenAddress = loadDeployed(process.env.NETWORK, "AllocatedToken");
  const NPMAddress = loadDeployed(process.env.NETWORK, "NonfungiblePositionManager");

  const TOSAddress = loadDeployed(process.env.NETWORK, "TOS");
  console.log("ERC20TokenAddress :", ERC20TokenAddress);

  const TOS = await ethers.getContractAt(ERC20Abi.abi, TOSAddress);

  const ERC20Token = await ethers.getContractAt(ERC20Abi.abi, ERC20TokenAddress);
  console.log("ERC20Token balance :", await ERC20Token.balanceOf(deployer.address));
  console.log("ERC20Token hasRole MINTER_ROLE :", await ERC20Token.hasRole(MINTER_ROLE, deployer.address));

  const LiquidityVaultProxy = loadDeployed(process.env.NETWORK, "LiquidityVaultProxy");
  const LiquidityVaultContract = await ethers.getContractAt("LiquidityVault", LiquidityVaultProxy);
  console.log("LiquidityVaultProxy :", LiquidityVaultProxy);

  let tokenAmount = ethers.BigNumber.from("100000000000000000000");

  let bal = await ERC20Token.balanceOf(LiquidityVaultProxy);
  console.log("LiquidityVaultProxy  balanceOf :", bal);

  if(bal.lt(tokenAmount)){
    let tx = await ERC20Token.connect(deployer).transfer(LiquidityVaultProxy, tokenAmount);
    await tx.wait();
  }
  bal = await ERC20Token.balanceOf(LiquidityVaultProxy);


  let allowance = await ERC20Token.allowance(LiquidityVaultProxy, NPMAddress);
  if(allowance.lt(tokenAmount)){
    let tx = await LiquidityVaultContract.connect(deployer).approveERC20(ERC20TokenAddress, NPMAddress, tokenAmount);
    await tx.wait();
    allowance = await ERC20Token.allowance(LiquidityVaultProxy, NPMAddress);
  }

  bal = await ERC20Token.balanceOf(LiquidityVaultProxy);

  console.log("ERC20Token balance :", await ERC20Token.balanceOf(LiquidityVaultProxy));
  console.log("ERC20Token allowance :", await ERC20Token.allowance(LiquidityVaultProxy, NPMAddress));


  bal = await TOS.balanceOf(LiquidityVaultProxy);
  if(bal.lt(tokenAmount)){
    let tx = await TOS.connect(deployer).transfer(LiquidityVaultProxy, tokenAmount);
    await tx.wait();
  }
  allowance = await TOS.allowance(LiquidityVaultProxy, NPMAddress);
  if(allowance.lt(tokenAmount)){
    let tx = await LiquidityVaultContract.connect(deployer).approveERC20(TOSAddress, NPMAddress, tokenAmount);
    await tx.wait();
    allowance = await TOS.allowance(LiquidityVaultProxy, NPMAddress);
  }

  bal = await ERC20Token.balanceOf(LiquidityVaultProxy);
  console.log("TOS balance :", await TOS.balanceOf(LiquidityVaultProxy));
  console.log("TOS allowance :", await TOS.allowance(LiquidityVaultProxy, NPMAddress));

  let applySwapPrice = false;

  let poolAddress = await LiquidityVaultContract.pool();
  console.log('poolAddress', poolAddress);

  let UniswapV3PoolContract = await ethers.getContractAt(UniswapV3PoolAbi.abi, poolAddress);

  let slot0 =  await UniswapV3PoolContract.slot0();
  console.log('slot0', slot0);

  let sqrtPriceX96 = slot0.sqrtPriceX96;

  var tokenPrice0 = sqrtPriceX96 ** 2 / 2 ** 192; //token0
  var tokenPrice1 = 2 ** 192 / sqrtPriceX96 ** 2;  //token1
  console.log('tokenPrice0', tokenPrice0);
  console.log('tokenPrice1', tokenPrice1);

  let tickIntervalMinimum = await LiquidityVaultContract.tickIntervalMinimum();
  console.log('tickIntervalMinimum', tickIntervalMinimum);

  // let tick1 = slot0.tick - (tickIntervalMinimum/2) -1  ;
  // let tick2 = slot0.tick + (tickIntervalMinimum/2) + 1  ;

  // let tick1 = slot0.tick -10000  ;
  // let tick2 = slot0.tick +10000  ;

  let tick1 = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])  ;
  let tick2 = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]) ;

  let getSqrtRatioAtTick1 = await LiquidityVaultContract.getSqrtRatioAtTick(tick1);
  console.log('tick1', tick1, getSqrtRatioAtTick1, getSqrtRatioAtTick1 ** 2 / 2 ** 192 );
  let getSqrtRatioAtTick2 = await LiquidityVaultContract.getSqrtRatioAtTick(tick2);
  console.log('tick2', tick2, getSqrtRatioAtTick2, getSqrtRatioAtTick2 ** 2 / 2 ** 192);

  /*
  let tick3 = 34141 ;
  let getSqrtRatioAtTick3 = await LiquidityVaultContract.getSqrtRatioAtTick(tick3);
  console.log('tick3', tick3, getSqrtRatioAtTick3, getSqrtRatioAtTick3 ** 2 / 2 ** 192);

  let tick4 = 31140;
  let tick5 = 37140;


  let getSqrtRatioAtTick4 = await LiquidityVaultContract.getSqrtRatioAtTick(tick4);
  console.log('tick4', tick4, getSqrtRatioAtTick4, getSqrtRatioAtTick4 ** 2 / 2 ** 192);

  let getSqrtRatioAtTick5 = await LiquidityVaultContract.getSqrtRatioAtTick(tick5);
  console.log('tick5', tick5, getSqrtRatioAtTick5, getSqrtRatioAtTick5 ** 2 / 2 ** 192);
  */


   // let tx3 = await LiquidityVaultContract.connect(deployer).createLP(tokenAmount, applySwapPrice);
  // await tx3.wait();
  // console.log('createLP ',tx3.hash);

  let token0 =  await LiquidityVaultContract.token0Address();
  let token1 =  await LiquidityVaultContract.token1Address();

  let amount0Desired = ethers.BigNumber.from("999999999999999982");
  let amount1Desired = ethers.BigNumber.from("25988263981680822");

  let NPMContract = await ethers.getContractAt(NonfungiblePositionManagerAbi.abi, NPMAddress);


  let tx1 = await NPMContract.connect(deployer).mint({
          token0: token0,
          token1: token1,
          fee: 3000,
          tickLower: tick1,
          tickUpper: tick2,
          amount0Desired,
          amount1Desired,
          amount0Min: 0,
          amount1Min: 0,
          recipient: deployer.address,
          deadline: 100000000000000
        }
    );

    //['0x73a54e5c054aa64c1ae7373c2b5474d8afea08bd','0xebffb9497237fc84687e09a1c14dae2a3be73d9c',]
    //[‘0x73a54e5c054aa64c1ae7373c2b5474d8afea08bd’,’0xebffb9497237fc84687e09a1c14dae2a3be73d9c’,3000,35689,35983,
    //2500000000000000000,100000000000000000000,0,0,’0x865264b30eb29A2978b9503B8AfE2A2DDa33eD7E’,1644921216]);
  console.log('tx1 ',tx1);
  // amount0Desired 2500000000000000000, amount1Desired 100000000000000000000


  // let tx  = await LiquidityVaultContract.mint(
  //   tick1, tick2,
  //    ethers.BigNumber.from("2500000000000000000"),
  //   ethers.BigNumber.from("100000000000000000000")
  // );

  //  console.log('tx ',tx);

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
