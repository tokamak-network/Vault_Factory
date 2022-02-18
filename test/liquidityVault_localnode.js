const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;
//chai.use(require("chai-bn")(BN));
chai.use(solidity);
require("chai").should();

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

    let tokenA, liquidityVaultLogic,  liquidityVault, liquidityVaultProxy, provider;
    let uniswapV3Factory, uniswapV3Pool ;
    let deployedUniswapV3 , tosToken;

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
        admin : null
    }

    let price = {
        tos: ethers.BigNumber.from("10000") ,
        projectToken:  ethers.BigNumber.from("250")
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

        it("1-4. upgradeTo : when not admin, fail", async function () {
            await expect(liquidityVaultProxy.connect(user2).upgradeTo(liquidityVaultLogic)).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-4/5. upgradeTo", async function () {

            let tx = await liquidityVaultProxy.connect(poolInfo.admin).upgradeTo(
                liquidityVaultLogic
            );
            //console.log('upgradeTo tx',tx.hash );

            await tx.wait();
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

        it("1-9. setProxyPause : when not admin, fail", async function () {

            await expect(
                liquidityVaultProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-9. setProxyPause ", async function () {

            await liquidityVaultProxy.connect(poolInfo.admin).setProxyPause(true);
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
    });

    describe("LiquidityVault : Can Anybody ", function () {

        it("3-1. setPool  ", async function () {
            await liquidityVault.setPool();
        });

        it("3-2. setPoolInitialize  ", async function () {
            await liquidityVault.setPool();
        });


        // it("3-1. setPool  ", async function () {
        //     await liquidityVault.currentRound();
        // });

        // it("3-1. setPool  ", async function () {
        //     await liquidityVault.currentRound();
        // });

    });

    /*


    it("Already set ", async function () {
        poolInfo.allocateToken = await ethers.getContractAt( ERC20TokenA.abi, tokenAAddress, ethers.provider);
        console.log('allocateToken' ,poolInfo.allocateToken.address);

        liquidityVaultProxy =  await ethers.getContractAt("LiquidityVaultProxy", liquidityVaultAddress);
        liquidityVault =  await ethers.getContractAt("LiquidityVault", liquidityVaultAddress);
        console.log('liquidityVault' ,liquidityVault.address);

    });

    it("UniswapV3Factory", async function () {

        uniswapV3Factory = await ethers.getContractAt( UniswapV3Factory.abi, uniswapInfo.poolfactory, ethers.provider);

        console.log('uniswapInfo.tos' ,uniswapInfo.tos);
        console.log('poolInfo.allocateToken.address' ,poolInfo.allocateToken.address);
        console.log('uniswapInfo._fee' ,uniswapInfo._fee);

        let poolAddress = await uniswapV3Factory.getPool(uniswapInfo.tos, poolInfo.allocateToken.address, uniswapInfo._fee);
        console.log('poolAddress' ,poolAddress);

        // let startingPrice =  price.tos.div(price.projectToken);
        // let pr =  ethers.BigNumber.from(
        //     new bn(price.projectToken.toString())
        //     .div(price.tos.toString())
        //     .sqrt()
        //     .multipliedBy(new bn(2).pow(96))
        //     .integerValue(3)
        //     .toString()
        // )

        console.log('pool', await liquidityVault.pool());
        console.log('initialTosPrice', await liquidityVault.initialTosPrice());
        console.log('initialTokenPrice', await liquidityVault.initialTokenPrice());

        console.log('initialSqrtPriceX96 0', await liquidityVault.initialSqrtPriceX96());
    });

    it("setPool", async function () {
        await liquidityVault.connect(poolInfo.admin)["setPool()"]();
        let poolAddress = await uniswapV3Factory.getPool(uniswapInfo.tos, poolInfo.allocateToken.address, uniswapInfo._fee);
        console.log('uniswapV3Factory poolAddress' ,poolAddress);
        console.log('liquidityVault ' ,await liquidityVault.pool());
     });


     it("UniswapV3Pool", async function () {

        uniswapV3Pool = await ethers.getContractAt(UniswapV3Pool.abi, poolAddress, ethers.provider);

        let slot0 = await uniswapV3Pool.slot0();
        console.log(slot0);

        let sqrtPriceX96 = await liquidityVault.getSqrtRatioAtTick(slot0.tick);
        console.log('sqrtPriceX96',sqrtPriceX96);

     });

    it("mint", async function () {

        uniswapV3Pool = await ethers.getContractAt(UniswapV3Pool.abi, poolAddress, ethers.provider);

        let slot0 = await uniswapV3Pool.slot0();
        console.log(slot0);
        35836

    });
    */
    // it("increaseliquidity", async function () {

    //     uniswapV3Pool = await ethers.getContractAt(UniswapV3Pool.abi, poolAddress, ethers.provider);

    //     let slot0 = await uniswapV3Pool.slot0();
    //     console.log(slot0);

    // });


    /*
     it("getPriceTest", async function () {

        let getPriceTest = await liquidityVault.getPriceTest();
        console.log('getPriceTest ',getPriceTest );


    });
     it("getInitialPrice", async function () {
         //0.025000000000000000
        let getInitialPrice = await liquidityVault.getInitialPrice();
        console.log('getInitialPrice ',getInitialPrice );


    });
     it("calculateSqrtPriceX96", async function () {
        let price = await liquidityVault.getPriceTest();
        let calculateSqrtPriceX96 = await liquidityVault.calculateSqrtPriceX96(price);
        console.log('calculateSqrtPriceX96 ',calculateSqrtPriceX96 );


    });
    */

});

