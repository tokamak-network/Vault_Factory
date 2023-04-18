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

const tosAddress = "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9";
const vaultAddress = "0xcd6De1CeDA280ac8764763FfD14B25A75Ca6d1a1";
const poolAddress = "0x054fa5e35b09dd348855e9eb494e53bb8619ab6d";
const liquidityAmount ="0xb8B9C2f8f38E61A8Ef84deDd7898e9DC0E08F18f";

async function main() {
   let deployer, user2;

  [deployer, user2, user3 ] = await ethers.getSigners();
  console.log('deployer',deployer.address);

  const poolContract = await ethers.getContractAt(UniswapV3PoolAbi.abi, poolAddress,  deployer)
  const slot0 = await poolContract.slot0();
  console.log(slot0)
  const token0 = await poolContract.token0();
  const token1 = await poolContract.token1();
  console.log("token0", token0)
  console.log("token1", token1)

  const token0Contract = await ethers.getContractAt(ERC20Abi.abi, token0,  deployer)
  const token1Contract = await ethers.getContractAt(ERC20Abi.abi, token1,  deployer)

  const amount0Balance = await token0Contract.balanceOf(vaultAddress)
  const amount1Balance = await token1Contract.balanceOf(vaultAddress)

  console.log("amount0Balance", amount0Balance)
  console.log("amount1Balance", amount1Balance)

  const sqrtRatio = slot0.sqrtPriceX96;
  const price = univ3prices([18,18], sqrtRatio).toAuto();
  console.log('sqrtRatio', sqrtRatio);
  console.log('price', price); // price token0 / token1
  // let reversePrice = 1/price;
  // console.log('reversePrice', reversePrice);

  let tosAmount = 0;
  if (tosAddress == token0) {
    let price_ = price * 1e18;
    let inToken0Amount = amount1Balance.mul(ethers.BigNumber.from(price_+"")).div(ethers.utils.parseEther("1"));
    inToken0Amount = inToken0Amount * 0.9;
    console.log('amount1Balance', amount1Balance.toString());
    console.log('inToken0Amount', inToken0Amount.toString());
    tosAmount = inToken0Amount;

  } else {
    let reversePrice = 1/price * 1e18;;
    let inToken1Amount = amount0Balance.mul(ethers.BigNumber.from(reversePrice+"")).div(ethers.utils.parseEther("1"));
    inToken1Amount = inToken1Amount * 0.9;
    console.log('amount0Balance', amount0Balance.toString());
    console.log('inToken0Amount', inToken1Amount.toString());
    tosAmount = inToken1Amount;
  }

  console.log('tosAmount', tosAmount);
}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

