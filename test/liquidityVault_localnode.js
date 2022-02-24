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

let liquidityVaultAddress = "0x7A098f99BE04168B821A3B76EB28Ae44F9fe7E30";
let tokenAAddress = "0x23c6a6da50904C036C9A7d1f54e5F789ADc68aD6";
let poolAddress = "0x090EFde9AD3dc88B01143c3C83DbA97714f5306e";



describe("LiquidityVault", function () {

    let tokenA, liquidityVaultFactory, liquidityVaultLogic,  liquidityVault, liquidityVaultProxy, provider;
    let uniswapV3Factory, uniswapV3Pool ;
    let deployedUniswapV3 , tosToken , vaultAddress, testLogicAddress;

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

    /*
    let price = {
        tos: ethers.BigNumber.from("100") ,
        projectToken:  ethers.BigNumber.from("20"),
        initSqrtPrice: 0,
        initTick: 0,
        targetPriceInterval: 10,
        tickPrice: 0
    } */

     let price = {
        tos: ethers.BigNumber.from("10"),
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
        [admin1, admin2, user1, user2, minter1, minter2 ] = accounts;
        //console.log('admin1',admin1.address);

        provider = ethers.provider;

        poolInfo.admin = admin1;
        tokenInfo.admin = admin1;
    });

    it("create tokenA", async function () {
       // console.log('ERC20TokenA.bytecode',ERC20TokenA.bytecode);

        const ERC20TokenAContract = await ethers.getContractFactory(ERC20TokenA.abi, ERC20TokenA.bytecode);
        tokenA = await ERC20TokenAContract.deploy(
            tokenInfo.name,
            tokenInfo.symbol,
            tokenInfo.totalSupply,
            tokenInfo.admin.address);

        let tx = await tokenA.deployed();
        // console.log('tx',tx.deployTransaction.hash);
        // console.log('tokenA',tokenA.address);
        poolInfo.allocateToken = tokenA;
    });

    it("create LiquidityVault Logic", async function () {
        const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
        let LiquidityVaultLogicDeployed = await LiquidityVault.deploy();
        let tx = await LiquidityVaultLogicDeployed.deployed();
        // console.log('tx',tx.deployTransaction.hash);
        // console.log("LiquidityVault Logic deployed to:", LiquidityVaultLogicDeployed.address);
        liquidityVaultLogic = LiquidityVaultLogicDeployed.address;
    });

    it("create LiquidityVaultFactory ", async function () {
        const LiquidityVaultFactory = await ethers.getContractFactory("LiquidityVaultFactory");
        let LiquidityVaultFactoryDeployed = await LiquidityVaultFactory.deploy();
        let tx = await LiquidityVaultFactoryDeployed.deployed();
        // console.log('tx',tx.deployTransaction.hash);
        // console.log("LiquidityVaultFactory deployed to:", LiquidityVaultFactoryDeployed.address);
        liquidityVaultFactory =  await ethers.getContractAt("LiquidityVaultFactory", LiquidityVaultFactoryDeployed.address);
        let code = await ethers.provider.getCode(liquidityVaultFactory.address);
        expect(code).to.not.eq("0x");

    });

    describe("LiquidityVaultFactory   ", function () {

        it("0-1. setLogic : when not admin, fail ", async function () {

            await expect(
                liquidityVaultFactory.connect(user2).setLogic(liquidityVaultLogic)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-1. setLogic ", async function () {

            await liquidityVaultFactory.connect(admin1).setLogic(liquidityVaultLogic);

            expect(await liquidityVaultFactory.vaultLogic()).to.be.eq(liquidityVaultLogic);
        });

        it("0-2. setUpgradeAdmin : when not admin, fail ", async function () {

            await expect(
                liquidityVaultFactory.connect(user2).setUpgradeAdmin(admin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-2. setUpgradeAdmin ", async function () {

            await liquidityVaultFactory.connect(admin1).setUpgradeAdmin(admin2.address);

            expect(await liquidityVaultFactory.upgradeAdmin()).to.be.eq(admin2.address);
        });

        it("0-3/4/5/6. create : LiquidityVaultProxy ", async function () {

            let tx = await liquidityVaultFactory.create(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
            );

            const receipt = await tx.wait();
            let _function ="CreatedLiquidityVault(address, string)";
            let interface = liquidityVaultFactory.interface;
            let tokenId = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    vaultAddress = log.args.contractAddress;
                }
            }

            expect(await liquidityVaultFactory.totalCreatedContracts()).to.be.eq(1);
            expect((await liquidityVaultFactory.getContracts(0)).contractAddress).to.be.eq(vaultAddress);
            expect((await liquidityVaultFactory.lastestCreated()).contractAddress).to.be.eq(vaultAddress);

        });
    });


    it("create LiquidityVaultProxy ", async function () {
        const LiquidityVaultProxy = await ethers.getContractFactory("LiquidityVaultProxy");
        let LiquidityVaultProxyDeployed = await LiquidityVaultProxy.deploy();
        let tx = await LiquidityVaultProxyDeployed.deployed();
        // console.log('tx',tx.deployTransaction.hash);
        // console.log("LiquidityVaultProxy deployed to:", LiquidityVaultProxyDeployed.address);

        liquidityVaultProxy =  await ethers.getContractAt("LiquidityVaultProxy", LiquidityVaultProxyDeployed.address);

        //console.log('liquidityVaultProxy' ,liquidityVaultProxy.address);
        liquidityVault =  await ethers.getContractAt("LiquidityVault", LiquidityVaultProxyDeployed.address);
        //console.log('liquidityVault' ,liquidityVault.address);
    });

    describe("LiquidityVaultProxy : Only Admin ", function () {


        it("1-1. addAdmin : when not admin, fail", async function () {
            await expect(liquidityVaultProxy.connect(user2).addAdmin(user2.address)).to.be.revertedWith("Accessible: Caller is not an admin");
        });
        it("1-1. addAdmin ", async function () {
            await liquidityVaultProxy.connect(poolInfo.admin).addAdmin(user2.address);
        });
        it("1-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(liquidityVaultProxy.connect(poolInfo.admin).removeAdmin(user2.address)).to.be.revertedWith("AccessControl: can only renounce roles for self");
        });
        it("1-2. removeAdmin ", async function () {
            await liquidityVaultProxy.connect(user2).removeAdmin(user2.address);
        });
        it("1-3. transferAdmin : when not admin, fail ", async function () {
            await expect(liquidityVaultProxy.connect(user2).transferAdmin(user1.address)).to.be.revertedWith("Accessible: Caller is not an admin");
        });
        it("1-3. transferAdmin ", async function () {
            await liquidityVaultProxy.connect(poolInfo.admin).addAdmin(user2.address);
            await liquidityVaultProxy.connect(user2).transferAdmin(user1.address);
        });

        it("1-4. setImplementation2 : when not admin, fail", async function () {
            await expect(liquidityVaultProxy.connect(user2).setImplementation2(liquidityVaultLogic,0, true)).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-4/5. setImplementation2", async function () {

            let tx = await liquidityVaultProxy.connect(poolInfo.admin).setImplementation2(
                liquidityVaultLogic, 0, true
            );

            await tx.wait();
        });

        it("1-10/11. setAliveImplementation2 : Only Admin ", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            await expect(
              liquidityVaultProxy.connect(user2).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress )
            ).to.be.revertedWith("Accessible: Caller is not an admin");

            await expect(
              liquidityVaultProxy.connect(user2).setAliveImplementation2(
                    testLogicAddress, false
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-5/10/11/12/13. setAliveImplementation2", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            let tx = await liquidityVaultProxy.connect(poolInfo.admin).setImplementation2(
                testLogicAddress, 1, true
            );

            await tx.wait();

            await liquidityVaultProxy.connect(poolInfo.admin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress
            );

            await tx.wait();

            expect(await liquidityVaultProxy.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await liquidityVaultProxy.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await liquidityVaultProxy.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", liquidityVaultProxy.address);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await liquidityVaultProxy.connect(poolInfo.admin).setAliveImplementation2(
                testLogicAddress, false
            );

            await tx.wait();

            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");

        });


        it("1-6. setBaseInfoProxy : when not admin, fail", async function () {

            await expect(
                liquidityVaultProxy.connect(user2).setBaseInfoProxy(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-7. setBaseInfoProxy", async function () {

            let tx = await liquidityVaultProxy.connect(poolInfo.admin).setBaseInfoProxy(
                poolInfo.name,
                poolInfo.allocateToken.address,
                poolInfo.admin.address,
                price.tos,
                price.projectToken
            );
            //console.log('setBaseInfoProxy tx',tx.hash );
            await tx.wait();

            expect(await liquidityVaultProxy.name()).to.be.equal(poolInfo.name);
            expect(await liquidityVaultProxy.token()).to.be.equal(poolInfo.allocateToken.address);
            expect(await liquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.equal(true);
            expect(await liquidityVaultProxy.initialTosPrice()).to.be.equal(price.tos);
            expect(await liquidityVaultProxy.initialTokenPrice()).to.be.equal(price.projectToken);
        });

        it("1-8. setBaseInfoProxy : only once exceute", async function () {

            await expect(
                liquidityVaultProxy.connect(poolInfo.admin).setBaseInfoProxy(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
                )
            ).to.be.revertedWith("already set");
        });

        it("     change vault ", async function () {

            liquidityVault = await ethers.getContractAt("LiquidityVault", vaultAddress);
            liquidityVaultProxy =  await ethers.getContractAt("LiquidityVaultProxy", vaultAddress);
            expect(await liquidityVaultProxy.name()).to.be.equal(poolInfo.name);
            expect(await liquidityVaultProxy.token()).to.be.equal(poolInfo.allocateToken.address);
            expect(await liquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.equal(true);
            expect(await liquidityVaultProxy.initialTosPrice()).to.be.equal(price.tos);
            expect(await liquidityVaultProxy.initialTokenPrice()).to.be.equal(price.projectToken);
            expect(await liquidityVaultProxy.implementation2(0)).to.be.equal(liquidityVaultLogic);

        });

        it("1-9. setProxyPause : when not admin, fail", async function () {

            await expect(
                liquidityVaultProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-9. setProxyPause ", async function () {

            await liquidityVaultProxy.connect(poolInfo.admin).setProxyPause(true);
            expect(await liquidityVaultProxy.pauseProxy()).to.be.equal(true);

        });

        it("1-9. setProxyPause : can\'t exceute logic function ", async function () {

            await expect(
                liquidityVault.currentRound()
            ).to.be.revertedWith("LiquidityVaultProxy: impl OR proxy is false");
        });

        it("1-9. setProxyPause   ", async function () {
            await liquidityVaultProxy.connect(poolInfo.admin).setProxyPause(false);
        });
    });

    describe("LiquidityVaultProxy : Can Anybody ", function () {

        it("1-9. fallback : can exceute logic function  ", async function () {
            await liquidityVault.currentRound();
        });

    });

    describe("Deploy UniswapV3 Contracts ", function () {
        it("deployedUniswapV3Contracts", async function () {
            deployedUniswapV3 = await deployedUniswapV3Contracts();

            //console.log('deployedUniswapV3.coreFactory',deployedUniswapV3.coreFactory);

            uniswapInfo.poolfactory = deployedUniswapV3.coreFactory.address;
            uniswapInfo.npm = deployedUniswapV3.nftPositionManager.address;
            uniswapInfo.swapRouter = deployedUniswapV3.swapRouter.address;
            uniswapInfo.NonfungibleTokenPositionDescriptor = deployedUniswapV3.nftDescriptor.address;
            uniswapInfo.poolfactory = deployedUniswapV3.coreFactory.address;

        });

        it("deploy TOS", async function () {

            const contract = await (
                await ethers.getContractFactory(
                    TOSToken.abi,
                    TOSToken.bytecode
                )
            ).deploy(tosInfo.name, tosInfo.symbol, tosInfo.version);
            deployed = await contract.deployed();
            tosToken = await ethers.getContractAt(TOSToken.abi, contract.address);
            tosInfo.contract = tosToken;
            tosInfo.admin = admin1;
            await tosToken.connect(tosInfo.admin).mint(tosInfo.admin.address, tosInfo.totalSupply);

            expect(await tosToken.balanceOf(admin1.address)).to.be.eq(tosInfo.totalSupply);

            uniswapInfo.tos = tosToken.address;
        });
        /*
        it("createPool", async function () {
            let tx = await deployedUniswapV3.coreFactory.connect(admin1).createPool(
                uniswapInfo.tos,
                poolInfo.allocateToken.address,
                3000
            );

            await tx.wait();
            console.log(tx);
        });
        */
    });

    describe("LiquidityVault : Only Admin ", function () {

        it("3-1. setPool : when not set uniswap infos, fail ", async function () {
            await expect(
               liquidityVault.setPool()
             ).to.be.revertedWith("Vault: before setUniswap");

        });

        it("2-1. setUniswapInfo : when not admin, fail", async function () {

            await expect(
                liquidityVault.connect(user2).setUniswapInfo(
                    uniswapInfo.poolfactory,
                    uniswapInfo.npm,
                    uniswapInfo.swapRouter
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-1. setUniswapInfo  ", async function () {

            await liquidityVault.connect(poolInfo.admin).setUniswapInfo(
                uniswapInfo.poolfactory,
                uniswapInfo.npm,
                uniswapInfo.swapRouter
            );

            expect(await liquidityVault.UniswapV3Factory()).to.be.eq(uniswapInfo.poolfactory);
            expect(await liquidityVault.NonfungiblePositionManager()).to.be.eq(uniswapInfo.npm);
            expect(await liquidityVault.SwapRouter()).to.be.eq(uniswapInfo.swapRouter);

        });

        it("2-2. setTokens : when not admin, fail", async function () {

            await expect(
                liquidityVault.connect(user2).setTokens(
                    uniswapInfo.wton,
                    uniswapInfo.tos,
                    uniswapInfo._fee
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-2. setTokens  ", async function () {

            await liquidityVault.connect(poolInfo.admin).setTokens(
                    uniswapInfo.wton,
                    uniswapInfo.tos,
                    uniswapInfo._fee
                );
            expect((await liquidityVault.WTON()).toLowerCase()).to.be.eq(uniswapInfo.wton.toLowerCase());
            expect((await liquidityVault.TOS()).toLowerCase()).to.be.eq(uniswapInfo.tos.toLowerCase());
            expect(await liquidityVault.fee()).to.be.eq(uniswapInfo._fee);

        });

        it("3-1. generatePoolAddress  ", async function () {
            let poolAddress = await liquidityVault.computePoolAddress(uniswapInfo.tos, poolInfo.allocateToken.address, 3000);

            // console.log('uniswapInfo.tos, poolInfo.allocateToken.address', uniswapInfo.tos, poolInfo.allocateToken.address);
            // console.log('poolAddress',poolAddress);
            poolInfo.poolAddress = poolAddress.pool;
            poolInfo.token0 = poolAddress.token0;
            poolInfo.token1 = poolAddress.token1;

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
            // console.log('** sqrtPrice',sqrtPrice);
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
            price.initTick = await liquidityVault.getTickAtSqrtRatio(ethers.BigNumber.from(price.initSqrtPrice));
            //console.log('price',price);

            //var tokenPrice0 = price.initSqrtPrice ** 2 / 2 ** 192; //token0
            //var tokenPrice1 = 2 ** 192 / price.initSqrtPrice ** 2;  //token1
            //console.log('tokenPrice0', tokenPrice0);
            //console.log('tokenPrice1', tokenPrice1);
        });

        it("2-3. setInitialPrice : when not admin, fail", async function () {

            await expect(
                liquidityVault.connect(user2).setInitialPrice(
                    price.tos,
                    price.projectToken,
                    price.initSqrtPrice
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-3. setInitialPrice  ", async function () {
            await liquidityVault.connect(poolInfo.admin).setInitialPrice(
                    price.tos,
                    price.projectToken,
                    price.initSqrtPrice
                );
            expect((await liquidityVault.initialTosPrice()).toNumber()).to.be.eq(price.tos.toNumber());
            expect((await liquidityVault.initialTokenPrice()).toNumber()).to.be.eq(price.projectToken.toNumber());
            expect(await liquidityVault.initSqrtPriceX96()).to.be.eq(price.initSqrtPrice);
        });



    });

    describe("LiquidityVault : Can Anybody ", function () {

        it("3-2. setPool  ", async function () {
            await liquidityVault.setPool();

            expect((await liquidityVault.pool()).toLowerCase()).to.be.eq(poolInfo.poolAddress.toLowerCase());
            expect((await liquidityVault.token0Address()).toLowerCase()).to.be.eq(poolInfo.token0.toLowerCase());
            expect((await liquidityVault.token1Address()).toLowerCase()).to.be.eq(poolInfo.token1.toLowerCase());

            uniswapV3Pool = await ethers.getContractAt(UniswapV3Pool.abi, poolInfo.poolAddress );

            let slot0 = await uniswapV3Pool.slot0();
            //console.log(slot0);
            expect(slot0.sqrtPriceX96).to.be.eq(price.initSqrtPrice);
            expect(slot0.tick).to.be.eq(price.initTick);


            var tokenPrice0 = slot0.sqrtPriceX96 ** 2 / 2 ** 192; //token0
            let sqrt1 = await liquidityVault.getSqrtRatioAtTick(slot0.tick+1);
            var tokenPrice01= sqrt1 ** 2 / 2 ** 192;
            let tickPrice = 0;
            if(tokenPrice01 > tokenPrice0)  tickPrice = tokenPrice01-tokenPrice0;
            else tickPrice = tokenPrice0-tokenPrice01;
            price.tickPrice = tickPrice;
            let targetTickInterval = price.targetPriceInterval / price.tickPrice;
        });

        it("2-4. setTickIntervalMinimum : when not admin, fail ", async function () {
            //console.log('price.targetPriceInterval',price.targetPriceInterval);

            if(price.targetInterval > 0 ){
                // let targetTickInterval = price.targetPriceInterval / price.tickPrice;
                // targetTickInterval = parseInt(targetTickInterval);
                //let interval = ethers.BigNumber.from(""+targetTickInterval);
                // let interval = targetTickInterval;
                // console.log('interval',interval);
                await expect(
                    liquidityVault.connect(user2).setTickIntervalMinimum(price.targetInterval)
                ).to.be.revertedWith("Accessible: Caller is not an admin");
            }
        });

        it("2-4. setTickIntervalMinimum  ", async function () {
            if(price.targetPriceInterval > 0 ){
                // let targetTickInterval = price.targetPriceInterval / price.tickPrice;
                // targetTickInterval = parseInt(targetTickInterval);
                //let interval = ethers.BigNumber.from(""+targetTickInterval);
                // let interval = targetTickInterval;
                // console.log('interval',interval);
                await liquidityVault.connect(poolInfo.admin).setTickIntervalMinimum(price.targetInterval);
                expect(await liquidityVault.tickIntervalMinimum()).to.be.eq(price.targetInterval);
            }
        });

        it("3-3. approveERC20 ", async function () {
            let amount = ethers.BigNumber.from("1"+"0".repeat(20));
            await liquidityVault.connect(user2).approveERC20(tosInfo.contract.address, uniswapInfo.npm, amount);

            expect(await tosInfo.contract.allowance(liquidityVault.address, uniswapInfo.npm)).to.be.eq(amount);
        });

        it("3-4. currentRound ", async function () {
            expect(await liquidityVault.currentRound()).to.be.eq(0);
        });

        it("3-5. availableUseAmount ", async function () {
            expect(await liquidityVault.availableUseAmount(0)).to.be.eq(0);
        });
    });

    describe("LiquidityVault : Only Admin ", function () {
        it("calculate claim variables  ", async function () {
             let block = await ethers.provider.getBlock();
            let sum = ethers.BigNumber.from("0" );
            for(let i=0; i < poolInfo.claimCounts; i++ ){
                    sum = sum.add(poolInfo.claimAmounts[i]);
                    let _time = block.timestamp + 100 + (poolInfo.claimIntervalSeconds*i);
                    poolInfo.claimTimes.push(_time);
            }
            expect(sum).to.be.eq(poolInfo.totalAllocatedAmount);
        });

        it("2-5. initialize : fail when not admin ", async function () {

            await expect(
                liquidityVault.connect(user2).initialize(
                    poolInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+poolInfo.claimCounts),
                    poolInfo.claimTimes,
                    poolInfo.claimAmounts
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-5. initialize : fail when the Vault's project token balances are less than totalAllocatedAmount ", async function () {

            await expect(
                liquidityVault.connect(poolInfo.admin).initialize(
                    poolInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+poolInfo.claimCounts),
                    poolInfo.claimTimes,
                    poolInfo.claimAmounts
                )
             ).to.be.revertedWith("need to input the token");
        });

        it("2-6. initialize   ", async function () {

            await poolInfo.allocateToken.connect(tokenInfo.admin).transfer(liquidityVault.address, poolInfo.totalAllocatedAmount);

            expect(await poolInfo.allocateToken.balanceOf(liquidityVault.address)).to.be.eq(poolInfo.totalAllocatedAmount);

            await liquidityVault.connect(poolInfo.admin).initialize(
                    poolInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+poolInfo.claimCounts),
                    poolInfo.claimTimes,
                    poolInfo.claimAmounts
                );

            expect(await liquidityVault.totalClaimCounts()).to.be.eq(ethers.BigNumber.from(""+poolInfo.claimCounts));

            let getClaimInfo = await liquidityVault.getClaimInfo();

            let claimTimes = getClaimInfo["_claimTimes"];
            let claimAmounts = getClaimInfo["_claimAmounts"];

            for(let i=0; i< claimTimes.length; i++){
                expect(claimTimes[i]).to.be.eq(poolInfo.claimTimes[i]);
            }
            for(let i=0; i< claimAmounts.length; i++){
                 expect(claimAmounts[i]).to.be.eq(poolInfo.claimAmounts[i]);
            }

       });

    });

    describe("LiquidityVault : Can Anybody ", function () {


        it("3-4. mint fail : When the first claim time does not start ", async function () {
            let round = await liquidityVault.currentRound();
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);

            expect(calculateClaimAmount).to.be.eq(ethers.BigNumber.from("0"));
            await expect(
                liquidityVault.connect(user2).mint(-100, 100)
            ).to.be.revertedWith("Vault: not started yet");
        });
        it("     pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = poolInfo.claimTimes[0] - block.timestamp +10 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("3-5. mint fail : when tick interval is lower than tickIntervalMinimum ", async function () {

            let round = await liquidityVault.currentRound();
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);

            expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));

            let tickIntervalMinimum = await liquidityVault.tickIntervalMinimum();
            if(tickIntervalMinimum > 0 ){
                await expect(
                    liquidityVault.connect(user2).mint(1, tickIntervalMinimum-1)
                ).to.be.revertedWith("Vault: tick interval is less than tickIntervalMinimum");
            }

        });

        it("3-6. mint fail : when tos balance is zero", async function () {

            let slot0 = await uniswapV3Pool.slot0();
            var tokenPrice0_1 = slot0.sqrtPriceX96 ** 2 / 2 ** 192; //token0
            var tokenPrice1_1 = 2 ** 192 / slot0.sqrtPriceX96 ** 2;  //token1
            // console.log(' tokenPrice0_1 ',tokenPrice0_1);
            // console.log(' tokenPrice1_1 ',tokenPrice1_1);
            let targetTickInterval = Math.floor(price.targetPriceInterval / price.tickPrice);

            let lowerTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])  ;
            let upperTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]) ;
            //console.log(' slot0.tick ', slot0.tick , 'lowerTick  ', lowerTick, "upperTick ", upperTick);

            let round = await liquidityVault.currentRound();
            expect(round).to.be.gt(ethers.BigNumber.from("0"));
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
            expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));

            if(calculateClaimAmount.lte(ethers.utils.parseUnits("1", 18)) ){
                await expect(
                    liquidityVault.connect(user2).mint(lowerTick, upperTick)
                ).to.be.revertedWith("Vault: tick interval is less than tickIntervalMinimum");
            } else {
                 await expect(
                    liquidityVault.connect(user2).mint(lowerTick, upperTick)
                ).to.be.revertedWith("tos balance is zero");
            }

        });

        it("     TOS transfer to LiquidityVault", async function () {

            // console.log('poolInfo.claimAmounts[0] ',poolInfo.claimAmounts[0]);
            let tosAmount = poolInfo.claimAmounts[0].mul(price.projectToken).div(price.tos);

            // console.log('tosAmount',tosAmount);
            await tosToken.connect(tosInfo.admin).mint(liquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.eq(tosAmount);

        });

        it("3-7. mint fail : when tick is out of range", async function () {

            let slot0 = await uniswapV3Pool.slot0();
            let targetTickInterval = Math.floor(price.targetPriceInterval / price.tickPrice);

            // let lowerTick = slot0.tick + 1;
            // let upperTick = lowerTick + Math.floor(targetTickInterval);
            //console.log(' slot0.tick ', slot0.tick , 'lowerTick  ', lowerTick, "upperTick ", upperTick);

            let lowerTick = slot0.tick + getPositiveOneMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
            let upperTick = slot0.tick + 2 * getPositiveOneMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
            // console.log(' slot0.tick ', slot0.tick , 'lowerTick  ', lowerTick, "upperTick ", upperTick);

            let round = await liquidityVault.currentRound();
            expect(round).to.be.gt(ethers.BigNumber.from("0"));
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
            expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));


            //for (let i = 0; i < 128; i++) {
                // let base =  parseInt(slot0.tick /TICK_SPACINGS[FeeAmount.MEDIUM]);
                // console.log('base ',base);
                // console.log('slot0.tick ',slot0.tick);


                // lowerTick = (base-1) * TICK_SPACINGS[FeeAmount.MEDIUM];
                // upperTick = (255 - base) * TICK_SPACINGS[FeeAmount.MEDIUM]
                // console.log('lowerTick ',lowerTick);
                // console.log('upperTick',upperTick);
                // await liquidityVault.connect(user2).mint(lowerTick, upperTick)
           // }

            await expect(
                liquidityVault.connect(user2).mint(lowerTick, upperTick)
            ).to.be.revertedWith("tick is out of range");
        });
        /*
        it("3-8. mint scripts ", async function () {

            let minTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])  ;
            let maxTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]) ;

            let slot0 = await uniswapV3Pool.slot0();
            let targetTickInterval = Math.floor(price.targetPriceInterval / price.tickPrice);

            let lowerTick = slot0.tick - getTick(1000 , TICK_SPACINGS[FeeAmount.MEDIUM]);

            //slot0.tick - Math.floor(targetTickInterval);
            //let upperTick = slot0.tick + Math.floor(targetTickInterval);
            let upperTick = slot0.tick + getTick(1000 , TICK_SPACINGS[FeeAmount.MEDIUM]);

            console.log(' slot0.tick ', slot0.tick , 'lowerTick  ', lowerTick, "upperTick ", upperTick);
            console.log(' minTick ', minTick , ' maxTick ', maxTick );

            // let lowerTick = slot0.tick - Math.floor(targetTickInterval / 2);
            // let upperTick = slot0.tick + Math.floor(targetTickInterval / 2);
            let tosAmount = ethers.BigNumber.from("2500000000000000");
            let tokenAmount = ethers.BigNumber.from("10000000000000000");

            await tokenA.connect(tokenInfo.admin).mint(user2.address, tokenAmount);
            await tosToken.connect(tosInfo.admin).mint(user2.address, tosAmount);
            let balanceToken = await tokenA.balanceOf(user2.address);
            let balanceTOS = await tosToken.balanceOf(user2.address);
            console.log(' balanceToken ',balanceToken);
            console.log(' balanceTOS ',balanceTOS);

            expect(balanceToken).to.be.eq(tokenAmount);
            expect(balanceTOS).to.be.eq(tosAmount);

            //console.log(' deployedUniswapV3.npm.address ',deployedUniswapV3.nftPositionManager);
            console.log(' deployedUniswapV3.npm.address ',uniswapInfo.npm);

            await tokenA.connect(user2).approve(uniswapInfo.npm, tokenAmount) ;

            await tokenA.connect(user2).approve(uniswapInfo.npm, tokenAmount) ;
            await tosToken.connect(user2).approve(uniswapInfo.npm, tosAmount) ;

            let allowanceToken = await tokenA.allowance(user2.address, uniswapInfo.npm);
            let allowanceTOS = await tosToken.allowance(user2.address, uniswapInfo.npm);
            console.log(' allowanceToken ',allowanceToken);
            console.log(' allowanceTOS ',allowanceTOS);

            expect(allowanceToken).to.be.eq(tokenAmount);
            expect(allowanceTOS).to.be.eq(tosAmount);

            let amount0Desired = tosAmount;
            let amount1Desired = tokenAmount;

            if(poolInfo.token0.toLowerCase() != tosToken.address ){
                amount0Desired = tokenAmount;
                amount1Desired = tosAmount;
            }

            await deployedUniswapV3.nftPositionManager.connect(user2).mint({
                token0: poolInfo.token0,
                token1: poolInfo.token1,
                fee: FeeAmount.MEDIUM,
                tickLower: minTick,
                tickUpper: maxTick,
                amount0Desired,
                amount1Desired,
                amount0Min: 0,
                amount1Min: 0,
                recipient: user2.address,
                deadline: 100000000000000
                }) ;
        });
        */
        it("3-8. mint : cover the whole price ", async function () {
            let preTosBalance = await tosToken.balanceOf(liquidityVault.address);
            let preTokenBalance = await tokenA.balanceOf(liquidityVault.address);

            let round = await liquidityVault.currentRound();
            expect(round).to.be.gt(ethers.BigNumber.from("0"));
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
            expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));

            //let tosAmount = ethers.BigNumber.from("2500000000000000000");
            let tokenAmount = calculateClaimAmount;

            let lowerTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])  ;
            let upperTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]) ;

            let tx = await liquidityVault.connect(user2).mintToken(lowerTick, upperTick, preTosBalance, tokenAmount) ;

            const receipt = await tx.wait();
            //console.log('receipt',receipt);
            let _function ="MintedInVault(address, uint256, uint128, uint256, uint256)";
            let interface = liquidityVault.interface;
            let tokenId = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokenId = log.args.tokenId;
                    poolInfo.tokenIds.push(log.args.tokenId) ;
                    if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount1);
                    } else {
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount0);
                    }

                   // console.log(log.args)
                }
            }

            expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(liquidityVault.address);
            expect(await liquidityVault.totalClaimsAmount()).to.be.eq(poolInfo.totalClaimsAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.lt(preTosBalance);
            expect(await tokenA.balanceOf(liquidityVault.address)).to.be.lt(preTokenBalance);
        });

        it("     TOS transfer to LiquidityVault", async function () {
            let tosAmount = ethers.BigNumber.from("2500000000000000000");

            await tosToken.connect(tosInfo.admin).mint(liquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.gte(tosAmount);

        });

        it("3-10. mint fail: when calculated claimable amount is small (1 ether) ", async function () {

            let round = await liquidityVault.currentRound();
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
            expect(round).to.be.eq(ethers.BigNumber.from("1"));
            expect(calculateClaimAmount).to.be.lt(ethers.BigNumber.from("100000000000000000000"));

            let minTick = getMinTick(TICK_SPACINGS[FeeAmount.MEDIUM])  ;
            let maxTick = getMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]) ;
            let tosAmount = ethers.BigNumber.from("1000000000000000000");
            await expect(
                liquidityVault.connect(user2).mintToken(minTick, maxTick, tosAmount, calculateClaimAmount)
            ).to.be.revertedWith("small token amount");

        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = poolInfo.claimTimes[1] - block.timestamp +10 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("3-12. increaseLiquidity ", async function () {
            let slot0 = await uniswapV3Pool.slot0();
            // let targetTickInterval = Math.floor(price.targetPriceInterval / price.tickPrice);
            let round = await liquidityVault.currentRound();
            expect(round).to.be.eq(ethers.BigNumber.from("2"));
            let availableUseAmount = await liquidityVault.availableUseAmount(round);
            //console.log(availableUseAmount);
            expect(availableUseAmount).to.be.gte(poolInfo.claimAmounts[1]);

            expect(poolInfo.tokenIds.length).to.be.gt(0);

            let preTokenBalance = await tokenA.balanceOf(liquidityVault.address);
            let preTosBalance = await tosToken.balanceOf(liquidityVault.address);
            let amount0Desired = 0;
            let amount1Desired = 0;
            if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                amount0Desired = preTosBalance;
                amount1Desired = availableUseAmount;
            } else {
                amount0Desired = availableUseAmount;
                amount1Desired = preTosBalance;
            }
            // console.log('tosToken.address.toLowerCase()',tosToken.address.toLowerCase());
            // console.log('poolInfo.token0.toLowerCase()',poolInfo.token0.toLowerCase());

            let tx = await liquidityVault.connect(user2).increaseLiquidity(poolInfo.tokenIds[0],
                 amount0Desired, amount1Desired, 100000000000000);
            const receipt = await tx.wait();
            let _function ="IncreaseLiquidityInVault(uint256, uint128, uint256, uint256)";
            let interface = liquidityVault.interface;
            let tokenId = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokenId = log.args.tokenId;

                    if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount1);
                    } else {
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount0);
                    }

                   //console.log(log.args)
                }
            }
            //console.log('poolInfo.totalClaimsAmount',poolInfo.totalClaimsAmount);
            expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(liquidityVault.address);
            expect(await liquidityVault.totalClaimsAmount()).to.be.eq(poolInfo.totalClaimsAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.lt(preTosBalance);
            expect(await tokenA.balanceOf(liquidityVault.address)).to.be.lt(preTokenBalance);
        });

        it("3-13. decreaseLiquidity fail : when token is not out of range  ", async function () {

            let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[0]);
            let ownerOf = await deployedUniswapV3.nftPositionManager.ownerOf(poolInfo.tokenIds[0]);
            let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)
            // console.log('position', position)
            expect(ownerOf).to.be.eq(liquidityVault.address);
            expect(position.liquidity).to.be.gt(ethers.BigNumber.from("0"));
            expect(position.tickLower).to.be.lt(slot0.tick);
            expect(position.tickUpper).to.be.gt(slot0.tick);

            let liquidity = position.liquidity.div(ethers.BigNumber.from('2'));

            await expect(
                liquidityVault.connect(user2).decreaseLiquidity(
                    poolInfo.tokenIds[0],liquidity, 0,0 , 100000000000000)
            ).to.be.revertedWith("tick is not out of range");

        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = poolInfo.claimTimes[2] - block.timestamp +10 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("     TOS transfer to LiquidityVault", async function () {

            let tosAmount = poolInfo.claimAmounts[0].mul(price.projectToken).div(price.tos);

            await tosToken.connect(tosInfo.admin).mint(liquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.gte(tosAmount);

        });

        it("3-9. mint : particular range ", async function () {
            let preTosBalance = await tosToken.balanceOf(liquidityVault.address);
            let preTokenBalance = await tokenA.balanceOf(liquidityVault.address);

            let round = await liquidityVault.currentRound();
            expect(round).to.be.gt(ethers.BigNumber.from("0"));
            let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
            expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));

            let tokenAmount = calculateClaimAmount;

            let slot0 = await uniswapV3Pool.slot0();
            let tickIntervalMinimum = await liquidityVault.tickIntervalMinimum();

            //tickIntervalMinimum/TICK_SPACINGS[FeeAmount.MEDIUM]
            let lowerTick = slot0.tick + getNegativeOneTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
            let upperTick = slot0.tick + getPositiveOneMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
            //console.log('slot0',slot0.tick);
            //console.log('slot0.tick',slot0.tick);
            //for (let i = 0; i < 128; i++) {
                let base =  parseInt(slot0.tick /TICK_SPACINGS[FeeAmount.MEDIUM]);
                //console.log('base',base);
                lowerTick = (base-1) * TICK_SPACINGS[FeeAmount.MEDIUM];
                upperTick = (base+1) * TICK_SPACINGS[FeeAmount.MEDIUM]

           // }
            //console.log('lowerTick',lowerTick,'upperTick',upperTick );
            let tx = await liquidityVault.connect(user2).mintToken(lowerTick, upperTick, preTosBalance, tokenAmount) ;

            const receipt = await tx.wait();

            let _function ="MintedInVault(address, uint256, uint128, uint256, uint256)";
            let interface = liquidityVault.interface;
            let tokenId = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokenId = log.args.tokenId;
                    //console.log('tokenId',tokenId );
                    poolInfo.tokenIds.push(log.args.tokenId) ;
                    if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount1);
                    } else {
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount0);
                    }

                }
            }

            expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(liquidityVault.address);
            expect(await liquidityVault.totalClaimsAmount()).to.be.eq(poolInfo.totalClaimsAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.lt(preTosBalance);
            expect(await tokenA.balanceOf(liquidityVault.address)).to.be.lt(preTokenBalance);

            // let slot01 = await uniswapV3Pool.slot0();
            // console.log('slot01.tick',slot01.tick);
        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = poolInfo.claimTimes[1] - block.timestamp +10 ;

            ethers.provider.send("evm_increaseTime", [3000])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("3-14. decreaseLiquidity  : when token is out of range  ", async function () {

            let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[1]);
            let ownerOf = await deployedUniswapV3.nftPositionManager.ownerOf(poolInfo.tokenIds[1]);
            let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)
            // console.log('position', position)
            expect(ownerOf).to.be.eq(liquidityVault.address);
            expect(position.liquidity).to.be.gt(ethers.BigNumber.from("0"));
            // expect(position.tickLower).to.be.lt(slot0.tick);
            // expect(position.tickUpper).to.be.gt(slot0.tick);

            let liquidity = position.liquidity.div(ethers.BigNumber.from('2'));

            await expect(
                liquidityVault.connect(user2).decreaseLiquidity(
                    poolInfo.tokenIds[1],liquidity, 0,0 , 100000000000000)
            ).to.be.revertedWith("tick is not out of range");

            // let position1 = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[1]);
            // let slot01 = await uniswapV3Pool.slot0();
            // console.log('slot01', slot01)
            // console.log('position1', position1)

        });

        it("      swap ", async function () {
            let swapAmountTOS = ethers.utils.parseUnits("500", 18);
            let swapAmountToken = ethers.utils.parseUnits("0.25", 18);

            await tosToken.connect(tosInfo.admin).mint(user2.address, swapAmountTOS);
            let tosbalanceBefore = await tosToken.balanceOf(user2.address);
            let tokenbalanceBefore = await poolInfo.allocateToken.balanceOf(user2.address);

            await tosToken.connect(user2).approve(
                deployedUniswapV3.swapRouter.address,
                swapAmountTOS
                );

            let allowance = await tosToken.allowance(user2.address, deployedUniswapV3.swapRouter.address);
            //console.log('allowance', allowance);
            expect(allowance).to.be.gte(swapAmountTOS);

            const params = {
                tokenIn: tosToken.address,
                tokenOut: poolInfo.allocateToken.address,
                fee: FeeAmount.MEDIUM,
                recipient: user2.address,
                deadline: 100000000000000,
                amountIn: swapAmountTOS,
                amountOutMinimum: ethers.BigNumber.from("0"),
                sqrtPriceLimitX96: ethers.BigNumber.from("0"),
            };

            const tx = await deployedUniswapV3.swapRouter
                .connect(user2)
                .exactInputSingle(params);
            await tx.wait();

            const tokenBalance = await poolInfo.allocateToken.balanceOf(user2.address);
            const tosBalance = await tosToken.balanceOf(user2.address);

            expect(tokenBalance).to.be.gt(tokenbalanceBefore);
            expect(tosBalance).to.be.lt(tosbalanceBefore);


            // console.log('tokenBalance', tokenBalance)
            // console.log('tosBalance', tokenBalance)
            // console.log('used tosBalance', tosbalanceBefore.sub(tosBalance))

            // let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)

            // let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[1]);
            // console.log('position', position)

        });

        it("3-15. decreaseLiquidity  ", async function () {

            let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[1]);
            let ownerOf = await deployedUniswapV3.nftPositionManager.ownerOf(poolInfo.tokenIds[1]);
            let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)
            // console.log('position', position)
            expect(ownerOf).to.be.eq(liquidityVault.address);
            expect(position.liquidity).to.be.gt(ethers.BigNumber.from("0"));
            // expect(position.tickLower).to.be.lt(slot0.tick);
            // expect(position.tickUpper).to.be.gt(slot0.tick);

            let liquidity = position.liquidity.div(ethers.BigNumber.from('2'));

            await liquidityVault.connect(user2).decreaseLiquidity(
                    poolInfo.tokenIds[1],liquidity, 0,0 , 100000000000000);

            position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[1]);
            let slot01 = await uniswapV3Pool.slot0();
            // console.log('slot01', slot01)
            // console.log('position', position)

            expect(position.tokensOwed0.add(position.tokensOwed1)).to.be.gt(ethers.BigNumber.from("0"));
        });

        it("3-16. collect  ", async function () {
            let tokenIndex= 1;

            let tokenBalance = await tokenA.balanceOf(liquidityVault.address);
            let tosBalance = await tosToken.balanceOf(liquidityVault.address);
            let positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);

            const tx = await liquidityVault.connect(user2).collect(
                    poolInfo.tokenIds[tokenIndex], positions.tokensOwed0, positions.tokensOwed1);

            const receipt = await tx.wait();

            let _function ="CollectInVault(uint256, uint256, uint256)";
            let interface = liquidityVault.interface;
            let tokensOwed0 = ethers.BigNumber.from("0");
            let tokensOwed1 = ethers.BigNumber.from("0");
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokensOwed0 = log.args.amount0;
                    tokensOwed1 = log.args.amount1;
                    //console.log(log.args);
                    if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount1);
                    } else {
                        poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount0);
                    }
                }
            }

            let tokenBalanceAfter = await tokenA.balanceOf(liquidityVault.address);
            let tosBalanceAfter = await tosToken.balanceOf(liquidityVault.address);

            if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed0));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed1));

            } else {
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed1));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed0));
            }

            expect(await liquidityVault.totalClaimsAmount()).to.be.equal(poolInfo.totalClaimsAmount);
            positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);
            expect(positions.tokensOwed0).to.be.equal(ethers.BigNumber.from("0"));
            expect(positions.tokensOwed1).to.be.equal(ethers.BigNumber.from("0"));

        });

        it("     TOS transfer to LiquidityVault", async function () {

            let tosAmount = poolInfo.claimAmounts[0].mul(price.projectToken).div(price.tos);

            await tosToken.connect(tosInfo.admin).mint(liquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(liquidityVault.address)).to.be.gte(tosAmount);

        });
        it("3-11. mint : If you have an amount that you can mint  ", async function () {

            let tokenBalance = await tokenA.balanceOf(liquidityVault.address);

            if(tokenBalance.gt(ethers.BigNumber.from("0"))){
                let tosAmount = poolInfo.claimAmounts[0].mul(price.projectToken).div(price.tos);
                await tosToken.connect(tosInfo.admin).mint(liquidityVault.address, tosAmount);
                expect(await tosToken.balanceOf(liquidityVault.address)).to.be.gte(tosAmount);

                let preTosBalance = await tosToken.balanceOf(liquidityVault.address);
                let preTokenBalance = await tokenA.balanceOf(liquidityVault.address);

                let round = await liquidityVault.currentRound();
                expect(round).to.be.gt(ethers.BigNumber.from("0"));
                let calculateClaimAmount = await liquidityVault.availableUseAmount(round);
                expect(calculateClaimAmount).to.be.gt(ethers.BigNumber.from("0"));

                let tokenAmount = calculateClaimAmount;

                let slot0 = await uniswapV3Pool.slot0();
                let tickIntervalMinimum = await liquidityVault.tickIntervalMinimum();
                let lowerTick = slot0.tick + getNegativeOneTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
                let upperTick = slot0.tick + getPositiveOneMaxTick(TICK_SPACINGS[FeeAmount.MEDIUM]);
                //console.log('slot0',slot0.tick);
                //console.log('slot0.tick',slot0.tick);
                //for (let i = 0; i < 128; i++) {
                    let base =  parseInt(slot0.tick /TICK_SPACINGS[FeeAmount.MEDIUM]);
                    //console.log('base',base);
                    lowerTick = (base-1) * TICK_SPACINGS[FeeAmount.MEDIUM];
                    upperTick = (base+1) * TICK_SPACINGS[FeeAmount.MEDIUM]

            // }
                //console.log('lowerTick',lowerTick,'upperTick',upperTick );
                let tx = await liquidityVault.connect(user2).mintToken(lowerTick, upperTick, preTosBalance, tokenAmount) ;

                const receipt = await tx.wait();

                let _function ="MintedInVault(address, uint256, uint128, uint256, uint256)";
                let interface = liquidityVault.interface;
                let tokenId = null;
                for(let i=0; i< receipt.events.length; i++){
                    if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                        let data = receipt.events[i].data;
                        let topics = receipt.events[i].topics;
                        let log = interface.parseLog(
                        {  data,  topics } );
                        tokenId = log.args.tokenId;
                        //console.log('tokenId',tokenId );
                        poolInfo.tokenIds.push(log.args.tokenId) ;
                        if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                            poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount1);
                        } else {
                            poolInfo.totalClaimsAmount = poolInfo.totalClaimsAmount.add(log.args.amount0);
                        }

                    }
                }

                expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(liquidityVault.address);
                expect(await liquidityVault.totalClaimsAmount()).to.be.eq(poolInfo.totalClaimsAmount);
                expect(await tosToken.balanceOf(liquidityVault.address)).to.be.lt(preTosBalance);
                expect(await tokenA.balanceOf(liquidityVault.address)).to.be.lt(preTokenBalance);

            } else {
                console.log("token is zero balance ");
            }
        });


    });

});

