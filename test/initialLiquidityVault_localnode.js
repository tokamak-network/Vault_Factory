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
let eventLogAddress = null;


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
        tos: ethers.BigNumber.from("1000"),
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
        poolInfo.allocateToken = tokenA;
    });


    describe("Deploy UniswapV3 Contracts ", function () {
        it("deployedUniswapV3Contracts", async function () {
            deployedUniswapV3 = await deployedUniswapV3Contracts();

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

         it("deploy TEST address", async function () {

             const contract = await (
                await ethers.getContractFactory(
                    TOSToken.abi,
                    TOSToken.bytecode
                )
            ).deploy(tosInfo.name, tosInfo.symbol, tosInfo.version);
            deployed = await contract.deployed();
            let testTemp = await ethers.getContractAt(TOSToken.abi, contract.address);

            uniswapInfo.wethUsdcPool = testTemp.address;
            uniswapInfo.wtonWethPool = testTemp.address;
            uniswapInfo.wtonTosPool = testTemp.address;
            uniswapInfo.wton = testTemp.address;

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

    it("create EventLog", async function () {
        const EventLog = await ethers.getContractFactory("EventLog");
        let EventLogDeployed = await EventLog.deploy();
        let tx = await EventLogDeployed.deployed();
        eventLogAddress = EventLogDeployed.address;
    });

    it("create InitialLiquidityVault Logic", async function () {
        const InitialLiquidityVault = await ethers.getContractFactory("InitialLiquidityVault");
        let InitialLiquidityVaultLogicDeployed = await InitialLiquidityVault.deploy();
        let tx = await InitialLiquidityVaultLogicDeployed.deployed();
        initialLiquidityVaultLogic = InitialLiquidityVaultLogicDeployed.address;
    });

    it("create InitialLiquidityVaultFactory ", async function () {
        const InitialLiquidityVaultFactory = await ethers.getContractFactory("InitialLiquidityVaultFactory");
        let InitialLiquidityVaultFactoryDeployed = await InitialLiquidityVaultFactory.deploy();
        let tx = await InitialLiquidityVaultFactoryDeployed.deployed();
        initialLiquidityVaultFactory =  await ethers.getContractAt("InitialLiquidityVaultFactory", InitialLiquidityVaultFactoryDeployed.address);
        let code = await ethers.provider.getCode(initialLiquidityVaultFactory.address);
        expect(code).to.not.eq("0x");

    });

    describe("InitialLiquidityVaultFactory   ", function () {

        it("0-1. setLogic : when not admin, fail ", async function () {

            await expect(
                initialLiquidityVaultFactory.connect(user2).setLogic(initialLiquidityVaultLogic)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-1. setLogic ", async function () {

            await initialLiquidityVaultFactory.connect(admin1).setLogic(initialLiquidityVaultLogic);

            expect(await initialLiquidityVaultFactory.vaultLogic()).to.be.eq(initialLiquidityVaultLogic);
        });

        it("0-2. setUpgradeAdmin : when not admin, fail ", async function () {

            await expect(
                initialLiquidityVaultFactory.connect(user2).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-2. setUpgradeAdmin ", async function () {

            await initialLiquidityVaultFactory.connect(admin1).setUpgradeAdmin(proxyAdmin.address);
            expect(await initialLiquidityVaultFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("0-7. setUniswapInfoNTokens : when not admin, fail ", async function () {


            await expect(
                initialLiquidityVaultFactory.connect(user2).setUniswapInfoNTokens(
                    [uniswapInfo.poolfactory,
                    uniswapInfo.npm ],
                    uniswapInfo.tos,
                    ethers.BigNumber.from("3000")
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-9. setLogEventAddress : when not admin, fail ", async function () {

            await expect(
                initialLiquidityVaultFactory.connect(user2).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });
        it("0-7. setUniswapInfoNTokens ", async function () {

            await initialLiquidityVaultFactory.connect(admin1).setUniswapInfoNTokens(
                [uniswapInfo.poolfactory,
                uniswapInfo.npm],
                uniswapInfo.tos,
                ethers.BigNumber.from("3000")
                );
            expect(await initialLiquidityVaultFactory.uniswapV3Factory()).to.be.eq(uniswapInfo.poolfactory);
            expect(await initialLiquidityVaultFactory.nonfungiblePositionManager()).to.be.eq(uniswapInfo.npm);
            expect(await initialLiquidityVaultFactory.tos()).to.be.eq(uniswapInfo.tos);
            expect(await initialLiquidityVaultFactory.fee()).to.be.eq(ethers.BigNumber.from("3000"));
        });

        it("0-9. setLogEventAddress   ", async function () {
            await initialLiquidityVaultFactory.connect(admin1).setLogEventAddress(eventLogAddress);
            expect(await initialLiquidityVaultFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("0-3/4/5/6. create : InitialLiquidityVaultFactory ", async function () {

            let tx = await initialLiquidityVaultFactory.create(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
            );

            const receipt = await tx.wait();
            let _function ="CreatedInitialLiquidityVault(address, string)";
            let interface = initialLiquidityVaultFactory.interface;
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

            expect(await initialLiquidityVaultFactory.totalCreatedContracts()).to.be.eq(1);
            expect((await initialLiquidityVaultFactory.getContracts(0)).contractAddress).to.be.eq(vaultAddress);
            expect((await initialLiquidityVaultFactory.lastestCreated()).contractAddress).to.be.eq(vaultAddress);

            let VaultContract = await ethers.getContractAt("InitialLiquidityVaultProxy", vaultAddress);
            expect(await VaultContract.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await VaultContract.isAdmin(poolInfo.admin.address)).to.be.eq(true);

            expect(await VaultContract.isProxyAdmin(poolInfo.admin.address)).to.be.eq(false);
            expect(await VaultContract.isAdmin(proxyAdmin.address)).to.be.eq(true);

            expect(await initialLiquidityVaultFactory.uniswapV3Factory()).to.be.eq(await VaultContract.UniswapV3Factory() );
            expect(await initialLiquidityVaultFactory.nonfungiblePositionManager()).to.be.eq(await VaultContract.NonfungiblePositionManager());
            expect(await initialLiquidityVaultFactory.tos()).to.be.eq( await VaultContract.TOS());
            expect(await initialLiquidityVaultFactory.fee()).to.be.eq( await VaultContract.fee());

        });

        it("0-8. upgradeContractLogic : when not admin, fail ", async function () {
            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;
            testLogicContract = await ethers.getContractAt("TestLogic", testLogicAddress);

            await expect(
                initialLiquidityVaultFactory.connect(user2).upgradeContractLogic(
                    vaultAddress, testLogicAddress, 1, true
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-9. upgradeContractFunction : when not admin, fail   ", async function () {

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            await expect(
                initialLiquidityVaultFactory.connect(user2).upgradeContractFunction(
                    vaultAddress, [_func1, _func2], testLogicAddress
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-8/9. upgradeContractLogic , upgradeContractFunction  ", async function () {

            let tx = await initialLiquidityVaultFactory.connect(admin1).upgradeContractLogic(
                    vaultAddress, testLogicAddress, 1, true
                );

            await tx.wait();

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            tx =  await initialLiquidityVaultFactory.connect(admin1).upgradeContractFunction(
                    vaultAddress, [_func1, _func2], testLogicAddress
                );

            await tx.wait();


            const proxyContract = await ethers.getContractAt("InitialLiquidityVaultProxy", vaultAddress);
            expect(await proxyContract.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await proxyContract.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await proxyContract.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", vaultAddress);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await initialLiquidityVaultFactory.connect(admin1).upgradeContractLogic(
                vaultAddress, testLogicAddress, 1, false
            );

            await tx.wait();

            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.reverted ;

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.reverted ;

            /*
            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");
            */

        });


    });


    it("create InitialLiquidityVaultProxy ", async function () {
        const InitialLiquidityVaultProxy = await ethers.getContractFactory("InitialLiquidityVaultProxy");
        let InitialLiquidityVaultProxyDeployed = await InitialLiquidityVaultProxy.deploy();
        let tx = await InitialLiquidityVaultProxyDeployed.deployed();

        initialLiquidityVaultProxy =  await ethers.getContractAt("InitialLiquidityVaultProxy", InitialLiquidityVaultProxyDeployed.address);

        //console.log('initialLiquidityVaultProxy' ,initialLiquidityVaultProxy.address);
        initialLiquidityVault =  await ethers.getContractAt("InitialLiquidityVault", InitialLiquidityVaultProxyDeployed.address);
        //console.log('initialLiquidityVault' ,initialLiquidityVault.address);
    });

    describe("InitialLiquidityVaultProxy : Only Admin ", function () {

        it("1-1. addAdmin : when not admin, fail", async function () {
            expect(await initialLiquidityVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(initialLiquidityVaultProxy.connect(user2).addAdmin(user2.address)).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });
        it("1-1. addAdmin only proxy admin ", async function () {
            expect(await initialLiquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.eq(true);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(poolInfo.admin.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(poolInfo.admin).addAdmin(user2.address);
        });
        it("1-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(initialLiquidityVaultProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });
        it("1-2. removeAdmin ", async function () {
            await initialLiquidityVaultProxy.connect(user2).removeAdmin();
        });
        it("1-3. transferAdmin : when not admin, fail ", async function () {
            await expect(initialLiquidityVaultProxy.connect(user2).transferAdmin(user1.address)).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-3. transferAdmin ", async function () {
            await initialLiquidityVaultProxy.connect(poolInfo.admin).addAdmin(user2.address);

            expect(await initialLiquidityVaultProxy.isAdmin(user2.address)).to.be.eq(true);

            await initialLiquidityVaultProxy.connect(user2).transferAdmin(user1.address);
        });

        it("1-4. setImplementation2 : when not proxy admin, fail", async function () {
            await expect(initialLiquidityVaultProxy.connect(user1).setImplementation2(initialLiquidityVaultLogic,0, true))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-4/5. setImplementation2", async function () {

            let tx = await initialLiquidityVaultProxy.connect(poolInfo.admin).setImplementation2(
                initialLiquidityVaultLogic, 0, true
            );

            await tx.wait();
        });

        it("1-10/11. setAliveImplementation2 : Only proxy admin ", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            expect(await initialLiquidityVaultProxy.isAdmin(user1.address)).to.be.eq(true);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(user1.address)).to.be.eq(false);

            await expect(
              initialLiquidityVaultProxy.connect(user1).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

            await expect(
              initialLiquidityVaultProxy.connect(user1).setAliveImplementation2(
                    testLogicAddress, false
                )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-5/10/11/12/13. setAliveImplementation2", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            let tx = await initialLiquidityVaultProxy.connect(poolInfo.admin).setImplementation2(
                testLogicAddress, 1, true
            );

            await tx.wait();

            tx = await initialLiquidityVaultProxy.connect(poolInfo.admin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress
            );

            await tx.wait();

            expect(await initialLiquidityVaultProxy.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await initialLiquidityVaultProxy.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await initialLiquidityVaultProxy.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", initialLiquidityVaultProxy.address);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await initialLiquidityVaultProxy.connect(poolInfo.admin).setAliveImplementation2(
                testLogicAddress, false
            );

            await tx.wait();


            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.reverted ;

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.reverted ;

            /*
            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.revertedWith("function selector was not recognized and there's no fallback function");
                */
        });


        it("1-6. setBaseInfoProxy : when not admin, fail", async function () {

            await expect(
                initialLiquidityVaultProxy.connect(user2).setBaseInfoProxy(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-7. setBaseInfoProxy", async function () {
            expect(await initialLiquidityVaultProxy.isAdmin(user1.address)).to.be.eq(true);
            let tx = await initialLiquidityVaultProxy.connect(user1).setBaseInfoProxy(
                poolInfo.name,
                poolInfo.allocateToken.address,
                poolInfo.admin.address,
                price.tos,
                price.projectToken
            );
            //console.log('setBaseInfoProxy tx',tx.hash );
            await tx.wait();

            expect(await initialLiquidityVaultProxy.name()).to.be.equal(poolInfo.name);
            expect(await initialLiquidityVaultProxy.token()).to.be.equal(poolInfo.allocateToken.address);
            expect(await initialLiquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.equal(true);
            expect(await initialLiquidityVaultProxy.initialTosPrice()).to.be.equal(price.tos);
            expect(await initialLiquidityVaultProxy.initialTokenPrice()).to.be.equal(price.projectToken);
        });

        it("1-8. setBaseInfoProxy : only once exceute", async function () {

            await expect(
                initialLiquidityVaultProxy.connect(poolInfo.admin).setBaseInfoProxy(
                    poolInfo.name,
                    poolInfo.allocateToken.address,
                    poolInfo.admin.address,
                    price.tos,
                    price.projectToken
                )
            ).to.be.revertedWith("already set");
        });

        it("     change vault ", async function () {

            initialLiquidityVault = await ethers.getContractAt("InitialLiquidityVault", vaultAddress);
            initialLiquidityVaultProxy =  await ethers.getContractAt("InitialLiquidityVaultProxy", vaultAddress);
            expect(await initialLiquidityVaultProxy.name()).to.be.equal(poolInfo.name);
            expect(await initialLiquidityVaultProxy.token()).to.be.equal(poolInfo.allocateToken.address);
            expect(await initialLiquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.equal(true);
            expect(await initialLiquidityVaultProxy.initialTosPrice()).to.be.equal(price.tos);
            expect(await initialLiquidityVaultProxy.initialTokenPrice()).to.be.equal(price.projectToken);
            expect(await initialLiquidityVaultProxy.implementation2(0)).to.be.equal(initialLiquidityVaultLogic);

            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);

        });


        it("1-1. addAdmin : when not proxy admin, fail", async function () {
            expect(await initialLiquidityVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(initialLiquidityVaultProxy.connect(user2).addAdmin(user2.address)).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });
        it("1-1. addAdmin : when not proxy  admin, fail ", async function () {
            expect(await initialLiquidityVaultProxy.isAdmin(poolInfo.admin.address)).to.be.eq(true);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(poolInfo.admin.address)).to.be.eq(false);
            await expect(
                 initialLiquidityVaultProxy.connect(poolInfo.admin).addAdmin(user2.address)
                 ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });
         it("1-1. addAdmin ", async function () {
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("1-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(initialLiquidityVaultProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });
        it("1-2. removeAdmin ", async function () {
            await initialLiquidityVaultProxy.connect(user2).removeAdmin();
        });
        it("1-3. transferAdmin : when not admin, fail ", async function () {
            await expect(initialLiquidityVaultProxy.connect(user2).transferAdmin(user1.address))
            .to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-2. addAdmin   ", async function () {
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("1-3. transferAdmin ", async function () {

            expect(await initialLiquidityVaultProxy.isAdmin(user2.address)).to.be.eq(true);

            await initialLiquidityVaultProxy.connect(user2).transferAdmin(user1.address);

            expect(await initialLiquidityVaultProxy.isAdmin(user2.address)).to.be.eq(false);
            expect(await initialLiquidityVaultProxy.isAdmin(user1.address)).to.be.eq(true);
        });


        it("1-14. addProxyAdmin : when not proxy admin, fail", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(poolInfo.admin.address)).to.be.eq(false);
            await expect(
                initialLiquidityVaultProxy.connect(poolInfo.admin).addProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-14. addProxyAdmin : only proxy admin ", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

        });

        it("1-15. removeProxyAdmin : when not proxy admin, fail", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(poolInfo.admin.address)).to.be.eq(false);
            await expect(
                initialLiquidityVaultProxy.connect(poolInfo.admin).removeProxyAdmin()
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-15. removeProxyAdmin ", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(proxyAdmin2).removeProxyAdmin();
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });

        it("1-16. transferProxyAdmin : when not proxy admin, fail", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(poolInfo.admin.address)).to.be.eq(false);
            await expect(
                initialLiquidityVaultProxy.connect(poolInfo.admin).transferProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-16. transferProxyAdmin ", async function () {

            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await initialLiquidityVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);

            await initialLiquidityVaultProxy.connect(proxyAdmin).transferProxyAdmin(proxyAdmin2.address);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(false);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

            await initialLiquidityVaultProxy.connect(proxyAdmin2).transferProxyAdmin(proxyAdmin.address);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await initialLiquidityVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });


        it("1-9. setProxyPause : when not admin, fail", async function () {

            await expect(
                initialLiquidityVaultProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-9. setProxyPause ", async function () {

            await initialLiquidityVaultProxy.connect(poolInfo.admin).setProxyPause(true);
            expect(await initialLiquidityVaultProxy.pauseProxy()).to.be.equal(true);

        });

        it("1-9. setProxyPause : can\'t exceute logic function ", async function () {

            await expect(initialLiquidityVault.getMinTick()
            ).to.be.revertedWith("Proxy: impl OR proxy is false");
        });

        it("1-9. setProxyPause   ", async function () {
            await initialLiquidityVaultProxy.connect(poolInfo.admin).setProxyPause(false);
        });
    });

    describe("InitialLiquidityVaultProxy : Can Anybody ", function () {

        it("1-9. fallback : can exceute logic function  ", async function () {
            await initialLiquidityVault.getMinTick();
        });

    });


    describe("InitialLiquidityVault : Only Admin ", function () {


        it("2-1. setUniswapInfo : when not admin, fail", async function () {

            await expect(
                initialLiquidityVault.connect(user2).setUniswapInfo(
                    uniswapInfo.poolfactory,
                    uniswapInfo.npm
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. setUniswapInfo : Fail if address is 0 or equal to existing address ", async function () {
            await expect(
                initialLiquidityVault.connect(proxyAdmin).setUniswapInfo(
                    uniswapInfo.poolfactory,
                    uniswapInfo.npm
                )
            ).to.be.revertedWith("zero or same UniswapV3Factory");

            expect(await initialLiquidityVault.UniswapV3Factory()).to.be.eq(uniswapInfo.poolfactory);
            expect(await initialLiquidityVault.NonfungiblePositionManager()).to.be.eq(uniswapInfo.npm);

        });

        it("2-1. setUniswapInfo  ", async function () {

            await initialLiquidityVault.connect(proxyAdmin).setUniswapInfo(
                    uniswapInfo.tos,
                    uniswapInfo.tos
                );

            expect(await initialLiquidityVault.UniswapV3Factory()).to.be.eq(uniswapInfo.tos);
            expect(await initialLiquidityVault.NonfungiblePositionManager()).to.be.eq(uniswapInfo.tos);

            await initialLiquidityVault.connect(proxyAdmin).setUniswapInfo(
                    uniswapInfo.poolfactory,
                    uniswapInfo.npm
                ) ;

            expect(await initialLiquidityVault.UniswapV3Factory()).to.be.eq(uniswapInfo.poolfactory);
            expect(await initialLiquidityVault.NonfungiblePositionManager()).to.be.eq(uniswapInfo.npm);


        });

        it("2-2. setTokens : when not admin, fail", async function () {

            await expect(
                initialLiquidityVault.connect(user2).setTokens(
                    uniswapInfo.tos,
                    uniswapInfo._fee
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-2. setTokens : Fail if address is 0 or equal to existing address", async function () {

            await expect(
                initialLiquidityVault.connect(proxyAdmin).setTokens(
                    uniswapInfo.tos,
                    uniswapInfo._fee
                )
             ).to.be.revertedWith("same tos");
        });

        it("2-2. setTokens  ", async function () {

            await initialLiquidityVault.connect(proxyAdmin).setTokens(
                    uniswapInfo.swapRouter,
                    uniswapInfo._fee
                );

            expect((await initialLiquidityVault.TOS()).toLowerCase()).to.be.eq(uniswapInfo.swapRouter.toLowerCase());

            await initialLiquidityVault.connect(proxyAdmin).setTokens(
                    uniswapInfo.tos,
                    uniswapInfo._fee
                );

            expect((await initialLiquidityVault.TOS()).toLowerCase()).to.be.eq(uniswapInfo.tos.toLowerCase());
            expect(await initialLiquidityVault.fee()).to.be.eq(uniswapInfo._fee);

        });

        it("3-1. generatePoolAddress  ", async function () {
            let poolAddress = await initialLiquidityVault.computePoolAddress(uniswapInfo.tos, poolInfo.allocateToken.address, 3000);

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
            price.initTick = await initialLiquidityVault.getTickAtSqrtRatio(ethers.BigNumber.from(price.initSqrtPrice));
            //console.log('price',price);

            //var tokenPrice0 = price.initSqrtPrice ** 2 / 2 ** 192; //token0
            //var tokenPrice1 = 2 ** 192 / price.initSqrtPrice ** 2;  //token1
            //console.log('tokenPrice0', tokenPrice0);
            //console.log('tokenPrice1', tokenPrice1);
        });

        it("2-3. setInitialPrice : when not admin, fail", async function () {

            await expect(
                initialLiquidityVault.connect(user2).setInitialPrice(
                    price.tos,
                    price.projectToken,
                    price.initSqrtPrice
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-3. setInitialPrice  ", async function () {
            await initialLiquidityVault.connect(poolInfo.admin).setInitialPrice(
                    price.tos,
                    price.projectToken,
                    price.initSqrtPrice
                );
            expect((await initialLiquidityVault.initialTosPrice()).toNumber()).to.be.eq(price.tos.toNumber());
            expect((await initialLiquidityVault.initialTokenPrice()).toNumber()).to.be.eq(price.projectToken.toNumber());
            expect(await initialLiquidityVault.initSqrtPriceX96()).to.be.eq(price.initSqrtPrice);
        });

    });


    describe("InitialLiquidityVault : Can Anybody ", function () {

        it("3-1. setPool : fail when boolReadyToCreatePool is false ", async function () {
            expect(await initialLiquidityVault.boolReadyToCreatePool()).to.be.eq(false);

            await expect(
                initialLiquidityVault.setPool()
             ).to.be.revertedWith("Vault: not ready to CreatePool");

        });
        it("2-11. setBoolReadyToCreatePool : fail when caller is not admin ", async function () {
            expect(await initialLiquidityVault.isAdmin(user2.address)).to.be.eq(false);

            await expect(
                initialLiquidityVault.connect(user2).setBoolReadyToCreatePool(true)
             ).to.be.revertedWith("Accessible: Caller is not an admin");

        });
        it("2-11. setBoolReadyToCreatePool  ", async function () {
            expect(await initialLiquidityVault.isAdmin(poolInfo.admin.address)).to.be.eq(true);

            await initialLiquidityVault.connect(poolInfo.admin).setBoolReadyToCreatePool(true);

            expect(await initialLiquidityVault.boolReadyToCreatePool()).to.be.eq(true);
        });

        it("2-11. setBoolReadyToCreatePool : fail when values are same ", async function () {
            expect(await initialLiquidityVault.isAdmin(poolInfo.admin.address)).to.be.eq(true);
            expect(await initialLiquidityVault.boolReadyToCreatePool()).to.be.eq(true);
            await expect(
                initialLiquidityVault.connect(poolInfo.admin).setBoolReadyToCreatePool(true)
             ).to.be.revertedWith("same boolReadyToCreatePool");
        });

        it("3-4. mint fail : when pool is not set", async function () {
            await expect(
                initialLiquidityVault.connect(user2).mint()
            ).to.be.revertedWith("zero address");
        });

        it("3-2. setPool  ", async function () {
            await initialLiquidityVault.setPool();

            expect((await initialLiquidityVault.pool()).toLowerCase()).to.be.eq(poolInfo.poolAddress.toLowerCase());
            expect((await initialLiquidityVault.token0Address()).toLowerCase()).to.be.eq(poolInfo.token0.toLowerCase());
            expect((await initialLiquidityVault.token1Address()).toLowerCase()).to.be.eq(poolInfo.token1.toLowerCase());

            uniswapV3Pool = await ethers.getContractAt(UniswapV3Pool.abi, poolInfo.poolAddress );

            let slot0 = await uniswapV3Pool.slot0();
            //console.log(slot0);
            expect(slot0.sqrtPriceX96).to.be.eq(price.initSqrtPrice);
            expect(slot0.tick).to.be.eq(price.initTick);


            var tokenPrice0 = slot0.sqrtPriceX96 ** 2 / 2 ** 192; //token0
            let sqrt1 = await initialLiquidityVault.getSqrtRatioAtTick(slot0.tick+1);
            var tokenPrice01= sqrt1 ** 2 / 2 ** 192;
            let tickPrice = 0;
            if(tokenPrice01 > tokenPrice0)  tickPrice = tokenPrice01-tokenPrice0;
            else tickPrice = tokenPrice0-tokenPrice01;
            price.tickPrice = tickPrice;
        });

    });

    describe("InitialLiquidityVault : Only Admin ", function () {

        it("2-5. initialize : fail when not admin ", async function () {

            await expect(
                initialLiquidityVault.connect(user2).initialize(
                    poolInfo.totalAllocatedAmount
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-5. initialize : fail when the Vault's project token balances are less than totalAllocatedAmount ", async function () {

            await expect(
                initialLiquidityVault.connect(poolInfo.admin).initialize(
                    poolInfo.totalAllocatedAmount
                )
             ).to.be.revertedWith("need to input the token");
        });

        it("2-6. initialize   ", async function () {

            await poolInfo.allocateToken.connect(tokenInfo.admin).transfer(initialLiquidityVault.address, poolInfo.totalAllocatedAmount);

            expect(await poolInfo.allocateToken.balanceOf(initialLiquidityVault.address)).to.be.eq(poolInfo.totalAllocatedAmount);

            await initialLiquidityVault.connect(poolInfo.admin).initialize(
                    poolInfo.totalAllocatedAmount
                );

            expect(await initialLiquidityVault.totalAllocatedAmount()).to.be.eq(poolInfo.totalAllocatedAmount);

       });

        it("2-8. withdraw : fail when not admin ", async function () {
            await expect(
                initialLiquidityVault.connect(user2).withdraw(
                    tosToken.address, user2.address, ethers.BigNumber.from("100")
                    )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });
    });


    describe("InitialLiquidityVault : Can Anybody ", function () {

        it("3-6. mint fail : when tos balance is zero", async function () {
            await expect( initialLiquidityVault.connect(user2).mint()).to.be.revertedWith("balance is insufficient");

        });

        it("     TOS transfer to InitialLiquidityVault", async function () {

            //let tosAmount = poolInfo.totalAllocatedAmount.mul(price.projectToken).div(price.tos);
            //let tosAmount = poolInfo.totalAllocatedAmount;
            let tosAmount = ethers.BigNumber.from("10000000000000000000");

            // console.log('tosAmount',tosAmount);
            await tosToken.connect(tosInfo.admin).mint(initialLiquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(initialLiquidityVault.address)).to.be.eq(tosAmount);

        });

        it("2-9. withdraw : fail when never minted ", async function () {

            await expect(
                initialLiquidityVault.connect(poolInfo.admin).withdraw(
                    tosToken.address, user2.address, ethers.BigNumber.from("100")
                )
             ).to.be.revertedWith("It is not minted yet");

        });

        it("3-8. mint : cover the whole price ", async function () {
            let preTosBalance = await tosToken.balanceOf(initialLiquidityVault.address);
            let preTokenBalance = await tokenA.balanceOf(initialLiquidityVault.address);

            let tx = await initialLiquidityVault.connect(user2).mint() ;

            const receipt = await tx.wait();
            //console.log('receipt',receipt);
            let _function ="MintedInVault(address, uint256, uint128, uint256, uint256)";
            let interface = initialLiquidityVault.interface;
            let tokenId = null;

            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokenId = log.args.tokenId;
                    poolInfo.tokenIds.push(log.args.tokenId) ;
                   // console.log(log.args)
                }
            }

            expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(initialLiquidityVault.address);

            let balanceTos = await tosToken.balanceOf(initialLiquidityVault.address);
            let balanceToken = await tokenA.balanceOf(initialLiquidityVault.address);
            expect(balanceTos).to.be.lt(preTosBalance);
            expect(balanceToken).to.be.lt(preTokenBalance);

            // console.log('balanceTos',balanceTos) ;
            // console.log('balanceToken',balanceToken) ;
        });

        it("2-9. withdraw : fail when it has project tokens ", async function () {
             await expect(
                initialLiquidityVault.connect(poolInfo.admin).withdraw(
                    tokenA.address, user2.address, ethers.BigNumber.from("100")
                )
             ).to.be.revertedWith("Has project tokens");
        });

        it("     TOS transfer to InitialLiquidityVault", async function () {

            //let tosAmount = poolInfo.totalAllocatedAmount.mul(price.projectToken).div(price.tos);
            let tosAmount = poolInfo.totalAllocatedAmount;
            //let tosAmount = ethers.BigNumber.from("10000000000000000000");

            // console.log('tosAmount',tosAmount);
            await tosToken.connect(tosInfo.admin).mint(initialLiquidityVault.address, tosAmount);
            expect(await tosToken.balanceOf(initialLiquidityVault.address)).to.be.eq(tosAmount);

        });

        it("      swap ", async function () {

            // let swapAmountTOS = poolInfo.totalAllocatedAmount.mul(price.projectToken).div(price.tos);
            let swapAmountTOS = ethers.utils.parseUnits("1", 18);
            // let swapAmountToken = ethers.utils.parseUnits("0.25", 18);

            await tosToken.connect(tosInfo.admin).mint(user2.address, swapAmountTOS);
            let tosbalanceBefore = await tosToken.balanceOf(user2.address);
            let tokenbalanceBefore = await poolInfo.allocateToken.balanceOf(user2.address);
            // console.log('user2 tosbalanceBefore', tosbalanceBefore)
            // console.log('user2 tokenbalanceBefore', tokenbalanceBefore)

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
            // console.log('tosBalance', tosBalance)
            // console.log('used tosBalance', tosbalanceBefore.sub(tosBalance))

            // let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)

            // let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[0]);
            // console.log('position', position)
            // console.log(poolInfo.tokenIds);

        });

        it("3-8. mint : IncreaseLiquidityInVault ", async function () {
            let preTosBalance = await tosToken.balanceOf(initialLiquidityVault.address);
            let preTokenBalance = await tokenA.balanceOf(initialLiquidityVault.address);

            let tx = await initialLiquidityVault.connect(user2).mint() ;

            const receipt = await tx.wait();
            //console.log('receipt',receipt);
            let _function ="IncreaseLiquidityInVault(uint256, uint128, uint256, uint256)";
            let interface = initialLiquidityVault.interface;
            let tokenId = null;

            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    tokenId = log.args.tokenId;
                    poolInfo.tokenIds.push(log.args.tokenId) ;
                   // console.log(log.args)
                }
            }

            expect(await deployedUniswapV3.nftPositionManager.ownerOf(tokenId)).to.be.eq(initialLiquidityVault.address);

            let balanceTos = await tosToken.balanceOf(initialLiquidityVault.address);
            let balanceToken = await tokenA.balanceOf(initialLiquidityVault.address);
            expect(balanceTos).to.be.lt(preTosBalance);
            expect(balanceToken).to.be.lt(preTokenBalance);

            // console.log('balanceTos',balanceTos) ;
            // console.log('balanceToken',balanceToken) ;
        });

        it("2-10. withdraw : project token can not withdraw ", async function () {
             await expect(
                initialLiquidityVault.connect(poolInfo.admin).withdraw(
                    tokenA.address, user2.address, ethers.BigNumber.from("100")
                )
             ).to.be.revertedWith("project token can not withdraw");
        });

        it("2-9. withdraw  ", async function () {
             await initialLiquidityVault.connect(poolInfo.admin).withdraw(
                    tosToken.address, user2.address, ethers.BigNumber.from("1000000000000000000")
                );
        });



        it("      swap ", async function () {

            let swapAmountTOS = poolInfo.totalAllocatedAmount.mul(price.projectToken).div(price.tos);
            // let swapAmountTOS = ethers.utils.parseUnits("500", 18);
            // let swapAmountToken = ethers.utils.parseUnits("0.25", 18);

            await tosToken.connect(tosInfo.admin).mint(user2.address, swapAmountTOS);
            let tosbalanceBefore = await tosToken.balanceOf(user2.address);
            let tokenbalanceBefore = await poolInfo.allocateToken.balanceOf(user2.address);
            // console.log('user2 tosbalanceBefore', tosbalanceBefore)
            // console.log('user2 tokenbalanceBefore', tokenbalanceBefore)

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
            // console.log('tosBalance', tosBalance)
            // console.log('used tosBalance', tosbalanceBefore.sub(tosBalance))

            // let slot0 = await uniswapV3Pool.slot0();
            // console.log('slot0', slot0)

            // let position = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[0]);
            // console.log('position', position)
            // console.log(poolInfo.tokenIds);

        });

        it("3-10. collect  ", async function () {
            let tokenIndex= 0;

            let tokenBalance = await tokenA.balanceOf(initialLiquidityVault.address);
            let tosBalance = await tosToken.balanceOf(initialLiquidityVault.address);
            let positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);

            const tx = await initialLiquidityVault.connect(user2).collect();

            const receipt = await tx.wait();

            let _function ="CollectInVault(uint256, uint256, uint256)";
            let interface = initialLiquidityVault.interface;
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
                }
            }


            positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);
           // console.log('positions after ', positions)

            let tokenBalanceAfter = await tokenA.balanceOf(initialLiquidityVault.address);
            let tosBalanceAfter = await tosToken.balanceOf(initialLiquidityVault.address);

            if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed0));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed1));

            } else {
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed1));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed0));
            }

            positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);
           // console.log('positions', positions)

        });

        it("3-10. collect  ", async function () {
            let tokenIndex= 0;

            let tokenBalance = await tokenA.balanceOf(initialLiquidityVault.address);
            let tosBalance = await tosToken.balanceOf(initialLiquidityVault.address);
            let positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);

            const tx = await initialLiquidityVault.connect(user2).collect();

            const receipt = await tx.wait();

            let _function ="CollectInVault(uint256, uint256, uint256)";
            let interface = initialLiquidityVault.interface;
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
                }
            }


            positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);
           // console.log('positions after ', positions)

            let tokenBalanceAfter = await tokenA.balanceOf(initialLiquidityVault.address);
            let tosBalanceAfter = await tosToken.balanceOf(initialLiquidityVault.address);

            if(poolInfo.token0.toLowerCase() == tosToken.address.toLowerCase()){
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed0));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed1));

            } else {
                expect(tosBalanceAfter).to.be.equal(tosBalance.add(tokensOwed1));
                expect(tokenBalanceAfter).to.be.equal(tokenBalance.add(tokensOwed0));
            }

            positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[tokenIndex]);
           // console.log('positions', positions)

        });

        it("3-10. collect : fail when there is no collectable amount ", async function () {
            let positions = await deployedUniswapV3.nftPositionManager.positions(poolInfo.tokenIds[0]);

            expect(positions.tokensOwed0).to.be.equal(ethers.BigNumber.from("0"));
            expect(positions.tokensOwed1).to.be.equal(ethers.BigNumber.from("0"));

            await expect(
                initialLiquidityVault.connect(user2).collect()
            ).to.be.revertedWith("there is no collectable amount");

        });

        it("3-4. lpToken  ", async function () {

            expect(await initialLiquidityVault.connect(user2).lpToken()).to.be.equal(poolInfo.tokenIds[0]);

        });

    });

});

