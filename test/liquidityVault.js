const { expect } = require("chai");
const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");

let ERC20TokenA = require('../abis/ERC20A.json');

describe("LiquidityVault", function () {

    let tokenA, liquidityVaultLogic,  liquidityVault, liquidityVaultProxy, provider;
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
        console.log('admin1',admin1.address);

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
        console.log('tx',tx.deployTransaction.hash);
        console.log('tokenA',tokenA.address);
        poolInfo.allocateToken = tokenA;
    });

    it("create LiquidityVault Logic", async function () {
        const LiquidityVault = await ethers.getContractFactory("LiquidityVault");
        let LiquidityVaultLogicDeployed = await LiquidityVault.deploy();
        let tx = await LiquidityVaultLogicDeployed.deployed();
        console.log('tx',tx.deployTransaction.hash);
        console.log("LiquidityVault Logic deployed to:", LiquidityVaultLogicDeployed.address);
        liquidityVaultLogic = LiquidityVaultLogicDeployed.address;
    });

     it("create LiquidityVaultProxy ", async function () {
        const LiquidityVaultProxy = await ethers.getContractFactory("LiquidityVaultProxy");
        let LiquidityVaultProxyDeployed = await LiquidityVaultProxy.deploy();
        let tx = await LiquidityVaultProxyDeployed.deployed();
        console.log('tx',tx.deployTransaction.hash);
        console.log("LiquidityVaultProxy deployed to:", LiquidityVaultProxyDeployed.address);


        liquidityVaultProxy =  await ethers.getContractAt("LiquidityVaultProxy", LiquidityVaultProxyDeployed.address);

        console.log('liquidityVaultProxy' ,liquidityVaultProxy.address);
        liquidityVault =  await ethers.getContractAt("LiquidityVault", LiquidityVaultProxyDeployed.address);
        console.log('liquidityVault' ,liquidityVault.address);
    });

     it("upgradeTo", async function () {

         let tx = await liquidityVaultProxy.connect(poolInfo.admin).upgradeTo(
            liquidityVaultLogic
        );
        console.log('upgradeTo tx',tx.hash );

        await tx.wait();
    });

    it("setBaseInfoProxy", async function () {

         let tx = await liquidityVaultProxy.connect(poolInfo.admin).setBaseInfoProxy(
             poolInfo.name,
            poolInfo.allocateToken.address,
            poolInfo.admin.address,
            price.tos,
            price.projectToken
        );
        console.log('setBaseInfoProxy tx',tx.hash );
        await tx.wait();
    });

    // it("setBaseInfo", async function () {

    //     let tx = await liquidityVaultProxy.connect(poolInfo.admin).setBaseInfo(
    //         poolInfo.name,
    //         poolInfo.allocateToken,
    //         poolInfo.admin.address
    //     );
    //     console.log('setBaseInfo tx',tx.hash );

    // });

    // it("setInitialPrice", async function () {

    //     let tx = await liquidityVaultProxy.connect(poolInfo.admin).setInitialPrice(
    //         price.tos,
    //         price.projectToken
    //     );
    //     console.log('setInitialPrice tx',tx.hash );

    // });

    it("setUniswapInfo", async function () {

        let tx = await liquidityVault.connect(poolInfo.admin).setUniswapInfo(
            uniswapInfo.poolfactory,
            uniswapInfo.npm,
            uniswapInfo.swapRouter
        );
        console.log('setUniswapInfo tx',tx.hash );
        await tx.wait();

        tx = await liquidityVault.connect(poolInfo.admin).setPoolInfo(
            uniswapInfo.wethUsdcPool,
            uniswapInfo.wtonWethPool,
            uniswapInfo.wtonTosPool,
            uniswapInfo.wton,
            uniswapInfo.tos,
            uniswapInfo._fee
        );
        console.log('setPoolInfo tx',tx.hash );
        await tx.wait();

    });


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

});

