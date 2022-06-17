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


//  WTON-TOS pool
// let poolAddress = "0x1c0ce9aaa0c12f53df3b4d8d77b82d6ad343b4e4";

// WTON-ETH pool
let poolAddress = "0xc29271e3a68a7647fd1399298ef18feca3879f59";


describe("WTON-TOS", function () {

    let uniswapV3Factory, uniswapV3Pool ;

     let price = {
        tos: ethers.BigNumber.from("110"),
        projectToken:  ethers.BigNumber.from("290"),
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
    });

    describe("WTON-TOS POOL  ", function () {

        it("3-1. generatePoolAddress  ", async function () {
            let abi = require("../abis/UniswapV3Pool.json").abi;
            uniswapV3Pool = await ethers.getContractAt(abi, poolAddress, provider);

            let secondsAgos = [];

            secondsAgos[0] = 3600;  // from (before)
            secondsAgos[1] = 0; // to (now)

            let curTime = Math.floor(Date.now()/1000);
            let i=0;
            while(curTime > 0) {
                info = await uniswapV3Pool.observations(i);

                // if(info.blockTimestamp == 0) curTime = 0;
                // else {
                    var date = new Date(info.blockTimestamp * 1000);
                    // var hours = date.getTimes();

                    // // Hours part from the timestamp
                    // var hours = date.getHours();
                    // // Minutes part from the timestamp
                    // var minutes = "0" + date.getMinutes();
                    // // Seconds part from the timestamp
                    // var seconds = "0" + date.getSeconds();

                    // // Will display time in 10:30:23 format
                    // var formattedTime = hours + ':' + minutes.substr(-2) + ':' + seconds.substr(-2);


                    console.log(i, date.getTime(), info);
                    i++
                // }
            }


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

