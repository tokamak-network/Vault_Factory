const { ethers } = require("hardhat");
const {
  keccak256,
} = require("web3-utils");
const JSBI = require('jsbi');
const Web3 = require('web3');
const univ3prices = require('@thanpolas/univ3prices');

const ERC20Abi = require("../abis/ERC20A.json");
const LiquidityAmountsAbi = require("../abis/LiquidityAmounts.json");
const UniswapV3PoolAbi = require("../abis/UniswapV3Pool.json");


const vaultAddress = "0xcd6De1CeDA280ac8764763FfD14B25A75Ca6d1a1";
const poolAddress = "0x054fa5e35b09dd348855e9eb494e53bb8619ab6d";
const liquidityAmount ="0xb8B9C2f8f38E61A8Ef84deDd7898e9DC0E08F18f";

async function main() {
   let deployer, user2;

  [deployer, user2, user3 ] = await ethers.getSigners();
  console.log('deployer',deployer.address);


  const liquidityAmountLib = await ethers.getContractAt(LiquidityAmountsAbi.abi, liquidityAmount,  deployer)
  const poolContract = await ethers.getContractAt(UniswapV3PoolAbi.abi, poolAddress,  deployer)
  const slot0 = await poolContract.slot0();
  console.log(slot0)
  const token0 = await poolContract.token0();
  const token1 = await poolContract.token1();
  console.log("token0", token0)
  console.log("token1", token1)

  const token0Contract = await ethers.getContractAt(ERC20Abi.abi, token0,  deployer)
  const token1Contract = await ethers.getContractAt(ERC20Abi.abi, token1,  deployer)

  const amount0 = await token0Contract.balanceOf(vaultAddress)
  const amount1 = await token1Contract.balanceOf(vaultAddress)

  console.log("amount0", amount0)
  console.log("amount1", amount1)


  const sqrtRatio = slot0.sqrtPriceX96;
  const sqrtRatioAX96 = ethers.BigNumber.from(univ3prices.constants.MIN_SQRT_RATIO.toString());
  const sqrtRatioBX96 = ethers.BigNumber.from(univ3prices.constants.MAX_SQRT_RATIO.toString());
  console.log('sqrtRatio', sqrtRatio);
  console.log('sqrtRatioAX96', sqrtRatioAX96.toString());
  console.log('sqrtRatioBX96', sqrtRatioBX96.toString());

  let liquidity0 = await liquidityAmountLib.getLiquidityForAmount0(sqrtRatioAX96, sqrtRatioBX96, amount0);
  let liquidity1 = await liquidityAmountLib.getLiquidityForAmount1(sqrtRatioAX96, sqrtRatioBX96, amount1);

  console.log('liquidity0', liquidity0);
  console.log('liquidity1', liquidity1);

  let liquidity = liquidity0;
  if(liquidity1.lt(liquidity0)) liquidity = liquidity1;
  console.log('liquidity', liquidity);

  let c_amount0 = await liquidityAmountLib.getAmount0ForLiquidity(sqrtRatio, sqrtRatioBX96, liquidity);
  let c_amount1 = await liquidityAmountLib.getAmount1ForLiquidity(sqrtRatioAX96, sqrtRatio, liquidity);
  console.log('c_amount0', c_amount0);
  console.log('c_amount1', c_amount1);

  let calculatedAmount =  await liquidityAmountLib.getAmountsForLiquidity(sqrtRatio, sqrtRatioAX96, sqrtRatioBX96, liquidity);
  console.log('calculatedAmount', calculatedAmount);

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

