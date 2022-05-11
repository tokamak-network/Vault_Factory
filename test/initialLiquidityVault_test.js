const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;

const JSBI = require('jsbi');

//chai.use(require("chai-bn")(BN));
chai.use(solidity);
require("chai").should();
const univ3prices = require('@thanpolas/univ3prices');
const utils = require("./utils");

// const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");
const bn = require('bignumber.js');

const {
  deployedUniswapV3Contracts,
  FeeAmount,
  TICK_SPACINGS,
  getMinTick,
  getMaxTick,
  getNegativeOneTick,
  getPositiveOneMaxTick,
  encodePriceSqrt,
  getUniswapV3Pool,
  getBlock,
  mintPosition2,
  getTick,
  // getMaxLiquidityPerTick,
} = require("./uniswap-v3/uniswap-v3-contracts");

let TOSToken = require('../abis/TOS.json');
let ERC20TokenA = require('../abis/ERC20A.json');
let UniswapV3Factory = require('../abis/UniswapV3Factory.json');
let UniswapV3Pool = require('../abis/UniswapV3Pool.json');


//-- rinkeby
// - TOS  0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd
// - DOC 0xb109f4c20bdb494a63e32aa035257fba0a4610a4
// DOC/TOS (0.3 %)  0x831a1f01ce17b6123a7d1ea65c26783539747d6d

let liquidityVaultAddress = "0xAEaCF11D49d7d1Bec5aeAaf20CB33Ea47AcC56CC";
let tosAddress = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153";
let tokenAAddress = "0x0e498afce58dE8651B983F136256fA3b8d9703bc";
let poolAddress = "0x369bca127b8858108536b71528ab3befa1deb6fc";


//-- mainnet
//- TOS 0x409c4D8cd5d2924b9bc5509230d16a61289c8153
//- DOC 0x0e498afce58dE8651B983F136256fA3b8d9703bc
// DOC/TOS (0.3 %)  0x369bca127b8858108536b71528ab3befa1deb6fc


// let liquidityVaultAddress = "0xAEaCF11D49d7d1Bec5aeAaf20CB33Ea47AcC56CC";
// let tosAddress = "0x409c4D8cd5d2924b9bc5509230d16a61289c8153";
// let tokenAAddress = "0x0e498afce58dE8651B983F136256fA3b8d9703bc";
// let poolAddress = "0x369bca127b8858108536b71528ab3befa1deb6fc";


let eventLogAddress = null;


describe("InitialLiquidityVault", function () {

    let tokenA, initialLiquidityVaultFactory, initialLiquidityVaultLogic,  initialLiquidityVault, initialLiquidityVaultProxy, provider;
    let uniswapV3Factory, uniswapV3Pool ;
    let deployedUniswapV3 , tosToken , vaultAddress, testLogicAddress, testLogicContract;
    /*
    let tosInfo={
        name: "TOS",
        symbol: "TOS",
        version: "1.0",
        admin : null,
        totalSupply: ethers.BigNumber.from("1"+"0".repeat(24))
    }

    let tokenInfo={
        name: "tokenA",
        symbol: "tA",
        admin : null,
        totalSupply: ethers.BigNumber.from("1"+"0".repeat(24))
    }
*/
    let poolInfo={
        name: "test",
        allocateToken: null,
        admin : null,
        poolAddress: null,
        token0: null,
        token1: null,
        reserve0: null,
        reserve1: null,
        totalAllocatedAmount: ethers.BigNumber.from("400000000000000000000"),
        claimCounts: ethers.BigNumber.from("4"),
        claimTimes: [] ,
        claimIntervalSeconds : 60*60*24,
        claimAmounts: [
            ethers.BigNumber.from("100000000000000000000"),
            ethers.BigNumber.from("100000000000000000000"),
            ethers.BigNumber.from("100000000000000000000"),
            ethers.BigNumber.from("100000000000000000000")
            ],
        tokenIds: [],
        totalClaimsAmount: ethers.BigNumber.from("0"),
    }

     let price = {
        tos: ethers.BigNumber.from("100"),
        projectToken:  ethers.BigNumber.from("100"),
        initSqrtPrice: 0,
        initTick: 0,
        targetPriceInterval: 1,
        targetInterval: 1,
        tickPrice: 0
    }

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

    //console.log('ERC20TokenA abi',ERC20TokenA.abi);

    before(async function () {
        accounts = await ethers.getSigners();
        [admin1, admin2, user1, user2, minter1, minter2, proxyAdmin, proxyAdmin2 ] = accounts;
        //console.log('admin1',admin1.address);

        provider = ethers.provider;

        poolInfo.admin = admin1;
    });

    describe("InitialLiquidityVault   ", function () {
        it("1. initialLiquidityVault  ", async function () {
            initialLiquidityVault =  await ethers.getContractAt("InitialLiquidityVault", liquidityVaultAddress);
        });

        it("2. generatePoolAddress  ", async function () {
            let poolAddress = await initialLiquidityVault.computePoolAddress(tosAddress, tokenAAddress, 3000);

            console.log('uniswapInfo.tos, poolInfo.allocateToken.address', tosAddress, tokenAAddress );
            console.log('poolAddress',poolAddress);
            poolInfo.poolAddress = poolAddress.pool;
            poolInfo.token0 = poolAddress.token0;
            poolInfo.token1 = poolAddress.token1;

            if(poolInfo.token0.toLowerCase() == tosAddress.toLowerCase()){

                if(price.tos.gt(price.projectToken)) {
                    poolInfo.reserve0 = 1;
                    poolInfo.reserve1 = Math.floor(price.tos.toNumber()/price.projectToken.toNumber());
                } else {
                    poolInfo.reserve0 = Math.floor(price.projectToken.toNumber()/price.tos.toNumber());
                    poolInfo.reserve1 = 1;
                }

            } else {
                if(price.tos.gt(price.projectToken)) {
                    poolInfo.reserve0 = Math.floor(price.tos.toNumber()/price.projectToken.toNumber());
                    poolInfo.reserve1 = 1;
                } else {
                    poolInfo.reserve0 = 1;
                    poolInfo.reserve1 = Math.floor(price.projectToken.toNumber()/price.tos.toNumber());
                }
            }

            let sqrtPrice = encodePriceSqrt(poolInfo.reserve1,  poolInfo.reserve0);
            console.log('** sqrtPrice',sqrtPrice);
            price.initSqrtPrice = sqrtPrice;

            /**
            * Calculates the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
            *
            * @param {bigint} amount1 the numerator amount, i.e. amount of token1.
            * @param {bigint} amount0 the denominator amount, i.en amount of token0.
            * @return {bigint} the sqrt ratio.
            */
            /*
            let amount1 = Math.floor(price.tos.toNumber()/price.projectToken.toNumber());
            let amount0 = 1;

            if(poolAddress.token0.toLowerCase() == uniswapInfo.tos.toLowerCase()){
                const encodeSqrtRatioX96 = utils.encodeSqrtRatioX96(amount1, amount0);
                price.initSqrtPrice = encodeSqrtRatioX96.toString();

            } else {
                const encodeSqrtRatioX96 = utils.encodeSqrtRatioX96(amount0, amount1);
                price.initSqrtPrice = encodeSqrtRatioX96.toString();
            }

            console.log('** initSqrtPrice',price.initSqrtPrice);
            */
            price.initTick = await initialLiquidityVault.getTickAtSqrtRatio(ethers.BigNumber.from(price.initSqrtPrice));
            console.log('price',price);

            var tokenPrice0 = price.initSqrtPrice ** 2 / 2 ** 192; //token0
            var tokenPrice1 = 2 ** 192 / price.initSqrtPrice ** 2;  //token1
            console.log('tokenPrice0', tokenPrice0);
            console.log('tokenPrice1', tokenPrice1);
        });


    });

});
