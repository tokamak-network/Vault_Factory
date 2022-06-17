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

let eventLogAddress = null;


//  LYDA InitialLiquidity vault
let liquidityVaultAddress = "0x620c86FD58E40f534545Aa433f49eF0271755E17";
// LYDA
let tokenAddress = "0xE1B0630D7649CdF503eABc2b6423227Be9605247";

// let poolAddress = "0x831a1f01ce17b6123a7d1ea65c26783539747d6d";



describe("InitialLiquidityVault", function () {

    let tokenA, initialLiquidityVaultFactory, initialLiquidityVaultLogic,  initialLiquidityVault, initialLiquidityVaultProxy, provider;
    let uniswapV3Factory, uniswapV3Pool ;
    let deployedUniswapV3 , tosToken , vaultAddress, testLogicAddress, testLogicContract;

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
        projectToken:  ethers.BigNumber.from("274"),
        initSqrtPrice: 0,
        initTick: 0,
        targetPriceInterval: 1,
        targetInterval: 1,
        tickPrice: 0
    }

  // main-net
  let uniswapInfo={
        poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        wethUsdcPool: "",
        wtonWethPool: "",
        wtonTosPool: "",
        wton: "0xc4A11aaf6ea915Ed7Ac194161d2fC9384F15bff2",
        tos: "0x409c4D8cd5d2924b9bc5509230d16a61289c8153",
        weth: "",
        usdc: "",
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
        tokenInfo.admin = admin1;
    });

    describe("InitialLiquidityVault  ", function () {

        it("3-1. generatePoolAddress  ", async function () {
            let abi = require("../abis/InitialLiquidityVault.json").abi;
            //initialLiquidityVault = await ethers.getContractFactory("InitialLiquidityVault", liquidityVaultAddress);
            initialLiquidityVault = await ethers.getContractAt(abi, liquidityVaultAddress, provider);

            // console.log('uniswapInfo.tos',uniswapInfo.tos);
            // console.log('tokenAddress',tokenAddress );

            let poolAddress = await initialLiquidityVault["computePoolAddress(address,address,uint24)"](uniswapInfo.tos, tokenAddress, ethers.BigNumber.from("3000"));

            // console.log('uniswapInfo.tos, poolInfo.allocateToken.address', uniswapInfo.tos, tokenAddress);
            console.log('poolAddress',poolAddress);
            poolInfo.poolAddress = poolAddress.pool;
            // poolInfo.poolAddress = poolAddress;

            poolInfo.token0 = poolAddress.token0;
            poolInfo.token1 = poolAddress.token1;


            //
            /*
            if(poolInfo.token0.toLowerCase() == uniswapInfo.tos.toLowerCase()){

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

            console.log('** initSqrtPrice',sqrtPrice);


            price.initSqrtPrice = sqrtPrice;
            //
            price.initSqrtPrice = ethers.BigNumber.from("131145399113454840259099904918");
            */

            /**
            * Calculates the sqrt ratio as a Q64.96 corresponding to a given ratio of amount1 and amount0
            *
            * @param {bigint} amount1 the numerator amount, i.e. amount of token1.
            * @param {bigint} amount0 the denominator amount, i.en amount of token0.
            * @return {bigint} the sqrt ratio.
            */

            //let amount1 = Math.floor(price.tos.toNumber()/price.projectToken.toNumber());
            // let amount1 = Math.floor(price.projectToken.toNumber()/price.tos.toNumber());
            // let amount0 = 1;
            let amount1 = price.projectToken.toNumber();
            let amount0 = price.tos.toNumber();

            console.log('** amount1',amount1);
            if(poolAddress.token0.toLowerCase() == uniswapInfo.tos.toLowerCase()){
                const encodeSqrtRatioX96 = utils.encodeSqrtRatioX96(amount1, amount0);
                price.initSqrtPrice = encodeSqrtRatioX96.toString();

            } else {
                const encodeSqrtRatioX96 = utils.encodeSqrtRatioX96(amount0, amount1);
                price.initSqrtPrice = encodeSqrtRatioX96.toString();
            }

            console.log('** initSqrtPrice',price.initSqrtPrice);


            //--
            price.initTick = await initialLiquidityVault.getTickAtSqrtRatio(ethers.BigNumber.from(price.initSqrtPrice));
            console.log('price',price);

            var tokenPrice0 = price.initSqrtPrice ** 2 / 2 ** 192; //token0
            var tokenPrice1 = 2 ** 192 / price.initSqrtPrice ** 2;  //token1
            console.log('tokenPrice0', tokenPrice0);
            console.log('tokenPrice1', tokenPrice1);
        });


        // it("2-3. setInitialPrice  ", async function () {
        //     await initialLiquidityVault.connect(poolInfo.admin).setInitialPrice(
        //             price.tos,
        //             price.projectToken,
        //             price.initSqrtPrice
        //         );
        //     expect((await initialLiquidityVault.initialTosPrice()).toNumber()).to.be.eq(price.tos.toNumber());
        //     expect((await initialLiquidityVault.initialTokenPrice()).toNumber()).to.be.eq(price.projectToken.toNumber());
        //     expect(await initialLiquidityVault.initSqrtPriceX96()).to.be.eq(price.initSqrtPrice);
        // });

    });
});

