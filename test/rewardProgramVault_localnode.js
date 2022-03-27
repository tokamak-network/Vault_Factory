const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;

const JSBI = require('jsbi');

chai.use(solidity);
require("chai").should();
const univ3prices = require('@thanpolas/univ3prices');
const utils = require("./utils");

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
let UniswapV3Staker = require('../abis/UniswapV3Staker.json');


let rewardProgramVaultAddress = "0x7A098f99BE04168B821A3B76EB28Ae44F9fe7E30";
let tokenAAddress = "0x23c6a6da50904C036C9A7d1f54e5F789ADc68aD6";
let poolAddress = "0x090EFde9AD3dc88B01143c3C83DbA97714f5306e";


describe("RewardProgramVault", function () {

    let tokenA, rewardProgramVaultFactory, rewardProgramVaultLogic,  rewardProgramVault, rewardProgramVaultProxy, provider;
    let uniswapV3Factory, uniswapV3Pool, uniswapV3Staker  ;
    let deployedUniswapV3 , tosToken , vaultAddress, testLogicAddress;


    let uniswapStakerInfo = {
        maxIncentiveStartLeadTime : ethers.BigNumber.from("2592000"),
        maxIncentiveDuration : ethers.BigNumber.from("63072000"),
        contract: null,
        address: null
    }

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

    let vaultInfo={
        name: "test",
        allocateToken: null,
        admin : null,
        poolAddress: null,
        rewardToken: null,
        waitStartTime: ethers.BigNumber.from("60"),
        programPeriod: ethers.BigNumber.from("86400"),  //60*60*24
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
        programs: [],
        totalClaimsAmount: ethers.BigNumber.from("0")
    }

    let price = {
        tos: ethers.BigNumber.from("5000"),
        projectToken:  ethers.BigNumber.from("200"),
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

        provider = ethers.provider;

        vaultInfo.admin = admin1;
        tokenInfo.admin = admin1;
    });

    it("create tokenA", async function () {
        const ERC20TokenAContract = await ethers.getContractFactory(ERC20TokenA.abi, ERC20TokenA.bytecode);
        tokenA = await ERC20TokenAContract.deploy(
            tokenInfo.name,
            tokenInfo.symbol,
            tokenInfo.totalSupply,
            tokenInfo.admin.address);

        let tx = await tokenA.deployed();
        vaultInfo.allocateToken = tokenA;
    });


    describe("Deploy UniswapV3 Contracts ", function () {
        it("deployedUniswapV3Contracts", async function () {
            deployedUniswapV3 = await deployedUniswapV3Contracts();
            //console.log('deployedUniswapV3.coreFactory',deployedUniswapV3.coreFactory);
            uniswapInfo.poolfactory = deployedUniswapV3.coreFactory.address;
            uniswapInfo.npm = deployedUniswapV3.nftPositionManager.address;
            uniswapInfo.swapRouter = deployedUniswapV3.swapRouter.address;
            uniswapInfo.NonfungibleTokenPositionDescriptor = deployedUniswapV3.nftDescriptor.address;
            //uniswapInfo.poolfactory = deployedUniswapV3.coreFactory.address;
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

        it("deploy UniswapV3Staker ", async function () {

             const contract = await (
                await ethers.getContractFactory(
                    UniswapV3Staker.abi,
                    UniswapV3Staker.bytecode
                )
            ).deploy(
                uniswapInfo.poolfactory,
                uniswapInfo.npm,
                uniswapStakerInfo.maxIncentiveStartLeadTime,
                uniswapStakerInfo.maxIncentiveDuration
            );

            deployed = await contract.deployed();

            uniswapStakerInfo.address = contract.address;

            uniswapV3Staker = await ethers.getContractAt(UniswapV3Staker.abi, contract.address);
            uniswapStakerInfo.contract = uniswapV3Staker;

            let code = await ethers.provider.getCode(uniswapV3Staker.address);
            expect(code).to.not.eq("0x");

         });

        it("createPool", async function () {
            let tx = await deployedUniswapV3.coreFactory.connect(admin1).createPool(
                uniswapInfo.tos,
                vaultInfo.allocateToken.address,
                3000
            );

            const receipt = await tx.wait();
            let _function ="PoolCreated(address,address,uint24,int24,address)";
            let interface = deployedUniswapV3.coreFactory.interface;

            poolAddress = "0x0";
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    poolAddress = log.args.pool;
                }
            }
            expect(poolAddress).to.not.eq("0x0");
            let code = await ethers.provider.getCode(poolAddress);
            expect(code).to.not.eq("0x");

            vaultInfo.poolAddress = poolAddress;
        });

    });

    it("create RewardProgramVault Logic", async function () {
        const RewardProgramVault = await ethers.getContractFactory("RewardProgramVault");
        let RewardProgramVaultLogicDeployed = await RewardProgramVault.deploy();
        let tx = await RewardProgramVaultLogicDeployed.deployed();
        rewardProgramVaultLogic = RewardProgramVaultLogicDeployed.address;
    });

    it("create RewardProgramVaultFactory ", async function () {
        const RewardProgramVaultFactory = await ethers.getContractFactory("RewardProgramVaultFactory");
        let RewardProgramVaultFactoryDeployed = await RewardProgramVaultFactory.deploy();
        let tx = await RewardProgramVaultFactoryDeployed.deployed();

        rewardProgramVaultFactory =  await ethers.getContractAt("RewardProgramVaultFactory", RewardProgramVaultFactoryDeployed.address);
        let code = await ethers.provider.getCode(rewardProgramVaultFactory.address);
        expect(code).to.not.eq("0x");

    });

    describe("RewardProgramVaultFactory   ", function () {

        it("0-1. setLogic : when not admin, fail ", async function () {

            await expect(
                rewardProgramVaultFactory.connect(user2).setLogic(rewardProgramVaultLogic)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-1. setLogic ", async function () {

            await rewardProgramVaultFactory.connect(admin1).setLogic(rewardProgramVaultLogic);

            expect(await rewardProgramVaultFactory.vaultLogic()).to.be.eq(rewardProgramVaultLogic);
        });

        it("0-2. setUpgradeAdmin : when not admin, fail ", async function () {

            await expect(
                rewardProgramVaultFactory.connect(user2).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-2. setUpgradeAdmin ", async function () {

            await rewardProgramVaultFactory.connect(admin1).setUpgradeAdmin(proxyAdmin.address);
            expect(await rewardProgramVaultFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("0-7. setStaker : when not admin, fail ", async function () {


            await expect(
                rewardProgramVaultFactory.connect(user2).setStaker(uniswapStakerInfo.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-8. setWaitStartSeconds : when not admin, fail ", async function () {

            await expect(
                rewardProgramVaultFactory.connect(user2).setWaitStartSeconds(vaultInfo.waitStartTime)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });


        it("0-3. create : fail when it's not set WaitStartSeconds ", async function () {
            await expect(
                rewardProgramVaultFactory.create(
                    vaultInfo.name,
                    vaultInfo.poolAddress,
                    vaultInfo.allocateToken.address,
                    vaultInfo.admin.address
                )
            ).to.be.revertedWith("zero vaule");
        });

        it("0-8. setWaitStartSeconds   ", async function () {

            await rewardProgramVaultFactory.connect(admin1).setWaitStartSeconds(vaultInfo.waitStartTime);
            expect(await rewardProgramVaultFactory.waitStartSeconds()).to.be.eq(vaultInfo.waitStartTime);

        });

        it("0-3. create : fail when did'nt set staker ", async function () {

            expect(await rewardProgramVaultFactory.staker()).to.be.eq("0x0000000000000000000000000000000000000000");
            await expect(
                    rewardProgramVaultFactory.create(
                        vaultInfo.name,
                        vaultInfo.poolAddress,
                        vaultInfo.allocateToken.address,
                        vaultInfo.admin.address
                    )
            ).to.be.revertedWith("zero address");
        });

        it("0-7. setStaker ", async function () {

            await rewardProgramVaultFactory.connect(admin1).setStaker(uniswapStakerInfo.address);
            expect(await rewardProgramVaultFactory.staker()).to.be.eq(uniswapStakerInfo.address);
        });

        it("0-3/4/5/6. create : RewardProgramVaultProxy ", async function () {

            let tx = await rewardProgramVaultFactory.create(
                    vaultInfo.name,
                    vaultInfo.poolAddress,
                    vaultInfo.allocateToken.address,
                    vaultInfo.admin.address
            );

            const receipt = await tx.wait();
            let _function ="CreatedRewardProgramVault(address,string)";
            let interface = rewardProgramVaultFactory.interface;

            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    vaultAddress = log.args.contractAddress;
                }
            }

            expect(await rewardProgramVaultFactory.totalCreatedContracts()).to.be.eq(1);
            expect((await rewardProgramVaultFactory.getContracts(0)).contractAddress).to.be.eq(vaultAddress);
            expect((await rewardProgramVaultFactory.lastestCreated()).contractAddress).to.be.eq(vaultAddress);

            let VaultContract = await ethers.getContractAt("RewardProgramVaultProxy", vaultAddress);
            expect(await VaultContract.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await VaultContract.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);


            expect(await VaultContract.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await VaultContract.isAdmin(proxyAdmin.address)).to.be.eq(true);

            expect(await rewardProgramVaultFactory.staker()).to.be.eq(await VaultContract.staker());
        });
    });

    it("create RewardProgramVaultProxy ", async function () {
        const RewardProgramVaultProxy = await ethers.getContractFactory("RewardProgramVaultProxy");
        let RewardProgramVaultProxyDeployed = await RewardProgramVaultProxy.deploy();
        let tx = await RewardProgramVaultProxyDeployed.deployed();
        rewardProgramVaultProxy =  await ethers.getContractAt("RewardProgramVaultProxy", RewardProgramVaultProxyDeployed.address);

        rewardProgramVault =  await ethers.getContractAt("RewardProgramVault", RewardProgramVaultProxyDeployed.address);

    });

    describe("RewardProgramVaultProxy : Only Admin ", function () {

        it("1-1. addAdmin : when not admin, fail", async function () {
            expect(await rewardProgramVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(rewardProgramVaultProxy.connect(user2).addAdmin(user2.address)).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });
        it("1-1. addAdmin only proxy admin ", async function () {
            expect(await rewardProgramVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await rewardProgramVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(vaultInfo.admin).addAdmin(user2.address);
        });
        it("1-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(rewardProgramVaultProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });
        it("1-2. removeAdmin ", async function () {
            await rewardProgramVaultProxy.connect(user2).removeAdmin();
        });
        it("1-3. transferAdmin : when not admin, fail ", async function () {
            await expect(rewardProgramVaultProxy.connect(user2).transferAdmin(user1.address)).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-3. transferAdmin ", async function () {
            await rewardProgramVaultProxy.connect(vaultInfo.admin).addAdmin(user2.address);

            expect(await rewardProgramVaultProxy.isAdmin(user2.address)).to.be.eq(true);

            await rewardProgramVaultProxy.connect(user2).transferAdmin(user1.address);
        });

        it("1-4. setImplementation2 : when not proxy admin, fail", async function () {
            await expect(rewardProgramVaultProxy.connect(user1).setImplementation2(rewardProgramVaultLogic,0, true))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-4/5. setImplementation2", async function () {

            let tx = await rewardProgramVaultProxy.connect(vaultInfo.admin).setImplementation2(
                rewardProgramVaultLogic, 0, true
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

            expect(await rewardProgramVaultProxy.isAdmin(user1.address)).to.be.eq(true);
            expect(await rewardProgramVaultProxy.isProxyAdmin(user1.address)).to.be.eq(false);

            await expect(
              rewardProgramVaultProxy.connect(user1).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

            await expect(
              rewardProgramVaultProxy.connect(user1).setAliveImplementation2(
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

            let tx = await rewardProgramVaultProxy.connect(vaultInfo.admin).setImplementation2(
                testLogicAddress, 1, true
            );

            await tx.wait();

            tx = await rewardProgramVaultProxy.connect(vaultInfo.admin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress
            );

            await tx.wait();

            expect(await rewardProgramVaultProxy.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await rewardProgramVaultProxy.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await rewardProgramVaultProxy.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", rewardProgramVaultProxy.address);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await rewardProgramVaultProxy.connect(vaultInfo.admin).setAliveImplementation2(
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
                rewardProgramVaultProxy.connect(user2).setBaseInfoProxy(
                    vaultInfo.name,
                    vaultInfo.poolAddress,
                    vaultInfo.allocateToken.address,
                    uniswapStakerInfo.address,
                    vaultInfo.admin.address,
                    vaultInfo.waitStartTime
                )
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-7. setBaseInfoProxy", async function () {
            expect(await rewardProgramVaultProxy.isAdmin(user1.address)).to.be.eq(true);
            let tx = await rewardProgramVaultProxy.connect(user1).setBaseInfoProxy(
                    vaultInfo.name,
                    vaultInfo.poolAddress,
                    vaultInfo.allocateToken.address,
                    uniswapStakerInfo.address,
                    vaultInfo.admin.address,
                    vaultInfo.waitStartTime
            );
            //console.log('setBaseInfoProxy tx',tx.hash );
            await tx.wait();

            expect(await rewardProgramVaultProxy.name()).to.be.equal(vaultInfo.name);
            expect(await rewardProgramVaultProxy.pool()).to.be.equal(vaultInfo.poolAddress);
            expect(await rewardProgramVaultProxy.token()).to.be.equal(vaultInfo.allocateToken.address);
            expect(await rewardProgramVaultProxy.staker()).to.be.equal(uniswapStakerInfo.address);
            expect(await rewardProgramVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.equal(true);
            expect(await rewardProgramVaultProxy.startWaitTime()).to.be.equal(vaultInfo.waitStartTime);
        });

        it("1-8. setBaseInfoProxy : only once exceute", async function () {

            await expect(
                rewardProgramVaultProxy.connect(vaultInfo.admin).setBaseInfoProxy(
                    vaultInfo.name,
                    vaultInfo.poolAddress,
                    vaultInfo.allocateToken.address,
                    uniswapStakerInfo.address,
                    vaultInfo.admin.address,
                    vaultInfo.waitStartTime
                )
            ).to.be.revertedWith("already set");
        });

        it("     change vault ", async function () {

            rewardProgramVault = await ethers.getContractAt("RewardProgramVault", vaultAddress);
            rewardProgramVaultProxy =  await ethers.getContractAt("RewardProgramVaultProxy", vaultAddress);

            expect(await rewardProgramVaultProxy.name()).to.be.equal(vaultInfo.name);
            expect(await rewardProgramVaultProxy.pool()).to.be.equal(vaultInfo.poolAddress);
            expect(await rewardProgramVaultProxy.token()).to.be.equal(vaultInfo.allocateToken.address);
            expect(await rewardProgramVaultProxy.staker()).to.be.equal(uniswapStakerInfo.address);
            expect(await rewardProgramVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.equal(true);
            expect(await rewardProgramVaultProxy.startWaitTime()).to.be.equal(vaultInfo.waitStartTime);

            expect(await rewardProgramVaultProxy.implementation2(0)).to.be.equal(rewardProgramVaultLogic);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
        });


        it("1-1. addAdmin : when not proxy admin, fail", async function () {
            expect(await rewardProgramVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(rewardProgramVaultProxy.connect(user2).addAdmin(user2.address)).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-1. addAdmin : when not proxy  admin, fail ", async function () {
            expect(await rewardProgramVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await rewardProgramVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                 rewardProgramVaultProxy.connect(vaultInfo.admin).addAdmin(user2.address)
                 ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

         it("1-1. addAdmin ", async function () {
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("1-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(rewardProgramVaultProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-2. removeAdmin ", async function () {
            await rewardProgramVaultProxy.connect(user2).removeAdmin();
        });
        it("1-3. transferAdmin : when not admin, fail ", async function () {
            await expect(rewardProgramVaultProxy.connect(user2).transferAdmin(user1.address))
            .to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-2. addAdmin   ", async function () {
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("1-3. transferAdmin ", async function () {

            expect(await rewardProgramVaultProxy.isAdmin(user2.address)).to.be.eq(true);

            await rewardProgramVaultProxy.connect(user2).transferAdmin(user1.address);

            expect(await rewardProgramVaultProxy.isAdmin(user2.address)).to.be.eq(false);
            expect(await rewardProgramVaultProxy.isAdmin(user1.address)).to.be.eq(true);
        });


        it("1-14. addProxyAdmin : when not proxy admin, fail", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                rewardProgramVaultProxy.connect(vaultInfo.admin).addProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-14. addProxyAdmin : only proxy admin ", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

        });

        it("1-15. removeProxyAdmin : when not proxy admin, fail", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                rewardProgramVaultProxy.connect(vaultInfo.admin).removeProxyAdmin()
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-15. removeProxyAdmin ", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(proxyAdmin2).removeProxyAdmin();
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });

        it("1-16. transferProxyAdmin : when not proxy admin, fail", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                rewardProgramVaultProxy.connect(vaultInfo.admin).transferProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("1-16. transferProxyAdmin ", async function () {

            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await rewardProgramVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);

            await rewardProgramVaultProxy.connect(proxyAdmin).transferProxyAdmin(proxyAdmin2.address);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(false);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

            await rewardProgramVaultProxy.connect(proxyAdmin2).transferProxyAdmin(proxyAdmin.address);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await rewardProgramVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });


        it("1-9. setProxyPause : when not admin, fail", async function () {

            await expect(
                rewardProgramVaultProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("1-9. setProxyPause ", async function () {

            await rewardProgramVaultProxy.connect(vaultInfo.admin).setProxyPause(true);
            expect(await rewardProgramVaultProxy.pauseProxy()).to.be.equal(true);

        });

        it("1-9. setProxyPause : can\'t exceute logic function ", async function () {

            await expect(
                rewardProgramVault.currentRound()
            ).to.be.revertedWith("LiquidityVaultProxy: impl OR proxy is false");
        });

        it("1-9. setProxyPause   ", async function () {
            await rewardProgramVaultProxy.connect(vaultInfo.admin).setProxyPause(false);
        });
    });

    describe("RewardProgramVaultProxy : Can Anybody ", function () {

        it("1-9. fallback : can exceute logic function  ", async function () {
            await rewardProgramVault.currentRound();
        });

    });


    describe("RewardProgramVault : Only Admin ", function () {

        it("2-1. changeStaker : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(user2).changeStaker(uniswapStakerInfo.address)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. changeStaker : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(vaultInfo.admin).changeStaker(uniswapStakerInfo.address)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. changeStaker : when same address, fail", async function () {
            await expect(
                rewardProgramVault.connect(proxyAdmin).changeStaker(uniswapStakerInfo.address)
             ).to.be.revertedWith("same address");
        });

        it("2-1. changeStaker ", async function () {
            await rewardProgramVault.connect(proxyAdmin).changeStaker(testLogicAddress);
            expect(await rewardProgramVaultProxy.staker()).to.be.equal(testLogicAddress);

            await rewardProgramVault.connect(proxyAdmin).changeStaker(uniswapStakerInfo.address);
            expect(await rewardProgramVaultProxy.staker()).to.be.equal(uniswapStakerInfo.address);
        });

        it("2-2. changePool : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(user2).changePool(uniswapStakerInfo.address)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-2. changePool : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(vaultInfo.admin).changePool(vaultInfo.poolAddress)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-2. changePool : when same address, fail", async function () {
            await expect(
                rewardProgramVault.connect(proxyAdmin).changePool(vaultInfo.poolAddress)
             ).to.be.revertedWith("same address");
        });

        it("2-2. changePool ", async function () {
            await rewardProgramVault.connect(proxyAdmin).changePool(testLogicAddress);
            expect(await rewardProgramVaultProxy.pool()).to.be.equal(testLogicAddress);

            await rewardProgramVault.connect(proxyAdmin).changePool(vaultInfo.poolAddress);
            expect(await rewardProgramVaultProxy.pool()).to.be.equal(vaultInfo.poolAddress);
        });

        it("2-3. changeToken : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(user2).changeToken(vaultInfo.allocateToken.address)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-3. changeToken : when not proxy admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(vaultInfo.admin).changeToken(vaultInfo.allocateToken.address)
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-3. changeToken : when same address, fail", async function () {
            await expect(
                rewardProgramVault.connect(proxyAdmin).changeToken(vaultInfo.allocateToken.address)
             ).to.be.revertedWith("same address");
        });

        it("2-3. changeToken ", async function () {
            await rewardProgramVault.connect(proxyAdmin).changeToken(testLogicAddress);
            expect(await rewardProgramVaultProxy.token()).to.be.equal(testLogicAddress);

            await rewardProgramVault.connect(proxyAdmin).changeToken(vaultInfo.allocateToken.address);
            expect(await rewardProgramVaultProxy.token()).to.be.equal(vaultInfo.allocateToken.address);
        });

        it("2-4. changeSetting : when not admin, fail", async function () {
            await expect(
                rewardProgramVault.connect(user2).changeSetting(vaultInfo.waitStartTime )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-4. changeSetting : when value is zero, fail", async function () {
            await expect(
                rewardProgramVault.connect(vaultInfo.admin).changeSetting(ethers.BigNumber.from("0"))
             ).to.be.revertedWith("zero value");
        });

        it("2-4. changeSetting ", async function () {
            await rewardProgramVault.connect(vaultInfo.admin).changeSetting(ethers.BigNumber.from("100") );
            expect(await rewardProgramVaultProxy.startWaitTime()).to.be.equal(ethers.BigNumber.from("100"));

            await rewardProgramVault.connect(vaultInfo.admin).changeSetting(vaultInfo.waitStartTime );
            expect(await rewardProgramVaultProxy.startWaitTime()).to.be.equal(vaultInfo.waitStartTime);
        });

        it("calculate claim variables  ", async function () {
             let block = await ethers.provider.getBlock();
            let sum = ethers.BigNumber.from("0" );
            for(let i=0; i < vaultInfo.claimCounts; i++ ){
                    sum = sum.add(vaultInfo.claimAmounts[i]);
                    let _time = block.timestamp + 100 + (vaultInfo.claimIntervalSeconds*i);
                    vaultInfo.claimTimes.push(_time);
            }
            expect(sum).to.be.eq(vaultInfo.totalAllocatedAmount);
        });

        it("2-5. initialize : fail when not admin ", async function () {

            await expect(
                rewardProgramVault.connect(user2).initialize(
                    vaultInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+vaultInfo.claimCounts),
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-5. initialize : fail when the Vault's project token balances are less than totalAllocatedAmount ", async function () {

            await expect(
                rewardProgramVault.connect(vaultInfo.admin).initialize(
                    vaultInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+vaultInfo.claimCounts),
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("need to input the token");
        });

        it("2-6. initialize   ", async function () {

            await vaultInfo.allocateToken.connect(tokenInfo.admin).transfer(rewardProgramVault.address, vaultInfo.totalAllocatedAmount);

            expect(await vaultInfo.allocateToken.balanceOf(rewardProgramVault.address)).to.be.eq(vaultInfo.totalAllocatedAmount);

            await rewardProgramVault.connect(vaultInfo.admin).initialize(
                    vaultInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+vaultInfo.claimCounts),
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                );

            expect(await rewardProgramVault.totalClaimCounts()).to.be.eq(ethers.BigNumber.from(""+vaultInfo.claimCounts));

            let getClaimInfo = await rewardProgramVault.getClaimInfo();

            let claimTimes = getClaimInfo["_claimTimes"];
            let claimAmounts = getClaimInfo["_claimAmounts"];

            for(let i=0; i< claimTimes.length; i++){
                expect(claimTimes[i]).to.be.eq(vaultInfo.claimTimes[i]);
            }
            for(let i=0; i< claimAmounts.length; i++){
                 expect(claimAmounts[i]).to.be.eq(vaultInfo.claimAmounts[i]);
            }

        });

        it("re-calculate claim variables  ", async function () {
            let block = await ethers.provider.getBlock();
            let sum = ethers.BigNumber.from("0" );
            vaultInfo.claimTimes = [];
            for(let i=0; i < vaultInfo.claimCounts; i++ ){
                    sum = sum.add(vaultInfo.claimAmounts[i]);
                    let _time = block.timestamp + 100 + (vaultInfo.claimIntervalSeconds*i);
                    vaultInfo.claimTimes.push(_time);
            }
            expect(sum).to.be.eq(vaultInfo.totalAllocatedAmount);
        });

        it("2-7. initialize   ", async function () {

            let block = await ethers.provider.getBlock();
            let claimInfo = await rewardProgramVault.getClaimInfo();
            expect(block.timestamp).to.be.lt(claimInfo._claimTimes[0]);

            await rewardProgramVault.connect(vaultInfo.admin).initialize(
                    vaultInfo.totalAllocatedAmount,
                    ethers.BigNumber.from(""+vaultInfo.claimCounts),
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                );

            expect(await rewardProgramVault.totalClaimCounts()).to.be.eq(ethers.BigNumber.from(""+vaultInfo.claimCounts));

            let getClaimInfo = await rewardProgramVault.getClaimInfo();

            let claimTimes = getClaimInfo["_claimTimes"];
            let claimAmounts = getClaimInfo["_claimAmounts"];

            for(let i=0; i< claimTimes.length; i++){
                expect(claimTimes[i]).to.be.eq(vaultInfo.claimTimes[i]);
            }
            for(let i=0; i< claimAmounts.length; i++){
                 expect(claimAmounts[i]).to.be.eq(vaultInfo.claimAmounts[i]);
            }

        });
    });

    describe("RewardProgramVault : Can Anybody ", function () {

        it("3-1. currentRound ", async function () {
            expect(await rewardProgramVault.currentRound()).to.be.eq(0);
        });

        it("3-2. availableUseAmount ", async function () {
            expect(await rewardProgramVault.availableUseAmount(0)).to.be.eq(0);
        });

        it("3-3. createProgram : fail when no claimable amount ", async function () {
            await expect(rewardProgramVault.createProgram()).to.be.revertedWith("no claimable amount");
        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = vaultInfo.claimTimes[0] - block.timestamp +10 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")
        });

        it("3-1. currentRound ", async function () {
            expect(await rewardProgramVault.currentRound()).to.be.eq(1);
        });

        it("3-2. availableUseAmount ", async function () {
            let round = await rewardProgramVault.currentRound();
            expect(await rewardProgramVault.availableUseAmount(round)).to.be.eq(vaultInfo.claimAmounts[round.toNumber()]);
        });

        it("     claimTimes ", async function () {

            let totalClaimCounts =  await rewardProgramVault.totalClaimCounts();
            for(let i = 0; i < totalClaimCounts; i++){
               // let claimTimes =  await rewardProgramVault.claimTimes(i);
                if(i > 0) expect(await rewardProgramVault.getProgramDuration(i)).to.be.eq(vaultInfo.claimIntervalSeconds);
            }

            expect(await rewardProgramVault.getProgramDuration(totalClaimCounts)).to.be.eq(vaultInfo.claimIntervalSeconds);
        });

        it("3-4/5. createProgram ", async function () {
            let round = 1;

            let totalProgramCount = await rewardProgramVault.totalProgramCount();

            let tx = await rewardProgramVault.connect(user2).createProgram();

            const receipt = await tx.wait();
            let _function ="IncentiveCreatedByRewardProgram(uint256,address,address,uint256,uint256,address,uint256)";
            let interface = rewardProgramVault.interface;
            let idx = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    idx = log.args.idx;
                    vaultInfo.programs.push(log.args.idx) ;
                    vaultInfo.totalClaimsAmount = vaultInfo.totalClaimsAmount.add(log.args.reward);
                }
            }

            let total = await rewardProgramVault.totalProgramCount();
            expect(total).to.be.eq(totalProgramCount.add(ethers.BigNumber.from("1")));

            let programInfo = await rewardProgramVault.programs(total.sub(ethers.BigNumber.from("1")));

            expect(programInfo.key['rewardToken'].toLowerCase()).to.be.eq(vaultInfo.allocateToken.address.toLowerCase());
            expect(programInfo.key['pool'].toLowerCase()).to.be.eq(vaultInfo.poolAddress.toLowerCase());
            expect(programInfo.key['endTime'].sub(programInfo.key['startTime'])).to.be.eq(ethers.BigNumber.from(""+vaultInfo.programPeriod));
            expect(programInfo.key['refundee'].toLowerCase()).to.be.eq(rewardProgramVault.address.toLowerCase());
            expect(programInfo.reward).to.be.eq(vaultInfo.claimAmounts[round]);
            expect(vaultInfo.totalClaimsAmount).to.be.eq(vaultInfo.claimAmounts[round]);

            let bal = await vaultInfo.allocateToken.balanceOf(rewardProgramVault.address);
            expect(bal).to.be.eq(vaultInfo.totalAllocatedAmount.sub(vaultInfo.totalClaimsAmount));

        });

        it("3-3. createProgram : fail when no claimable amount ", async function () {
            await expect(rewardProgramVault.createProgram()).to.be.revertedWith("no claimable amount");
        });

        it("3-4. close program and endIncentive ", async function () {
            let block = await ethers.provider.getBlock();
            let programInfo = await rewardProgramVault.programs(ethers.BigNumber.from("0"));

            let passTime = programInfo.key['endTime'].toNumber() - block.timestamp + 10 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")

            await uniswapStakerInfo.contract.connect(user2).endIncentive(programInfo.key);

            expect(await vaultInfo.allocateToken.balanceOf(rewardProgramVault.address))
                .to.be.eq(vaultInfo.totalAllocatedAmount.sub(vaultInfo.totalClaimsAmount).add(programInfo.reward));

            let round = await rewardProgramVault.currentRound();
            expect(await rewardProgramVault.availableUseAmount(round))
                .to.be.eq(programInfo.reward.add(vaultInfo.claimAmounts[round]));

        });

        it("3-4/5. createProgram ", async function () {
            let round = await rewardProgramVault.currentRound();
            let totalProgramCount = await rewardProgramVault.totalProgramCount();
            let preBalance = await vaultInfo.allocateToken.balanceOf(rewardProgramVault.address);
            let tx = await rewardProgramVault.connect(user2).createProgram();

            const receipt = await tx.wait();
            let _function ="IncentiveCreatedByRewardProgram(uint256,address,address,uint256,uint256,address,uint256)";
            let interface = rewardProgramVault.interface;
            let idx = null;
            let reward = null;
            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    idx = log.args.idx;
                    vaultInfo.programs.push(log.args.idx) ;
                    reward = log.args.reward;
                }
            }

            let total = await rewardProgramVault.totalProgramCount();
            expect(total).to.be.eq(totalProgramCount.add(ethers.BigNumber.from("1")));

            let programInfo = await rewardProgramVault.programs(total.sub(ethers.BigNumber.from("1")));
            //console.log(programInfo);

            expect(programInfo.key['rewardToken'].toLowerCase()).to.be.eq(vaultInfo.allocateToken.address.toLowerCase());
            expect(programInfo.key['pool'].toLowerCase()).to.be.eq(vaultInfo.poolAddress.toLowerCase());
            expect(programInfo.key['endTime'].sub(programInfo.key['startTime'])).to.be.eq(ethers.BigNumber.from(""+vaultInfo.programPeriod));
            expect(programInfo.key['refundee'].toLowerCase()).to.be.eq(rewardProgramVault.address.toLowerCase());
            expect(programInfo.reward).to.be.eq(reward);

            let bal = await vaultInfo.allocateToken.balanceOf(rewardProgramVault.address);
            expect(bal).to.be.eq(preBalance.sub(reward));
        });

    });

});

