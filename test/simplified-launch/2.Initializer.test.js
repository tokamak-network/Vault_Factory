const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;
const _ = require("lodash");
chai.use(solidity);
require("chai").should();
const {getUniswapInfo} = require("../config_info");

const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");

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
} = require("../uniswap-v3/uniswap-v3-contracts");

let tosAdmin = "0x12a936026f072d4e97047696a9d11f97eae47d21";
let TosV2Admin = "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1";


let UniswapV3FactoryABI = require("../../abis/UniswapV3Factory.json");
let PublicSaleProxyFactoryABI = require("../../abis/PublicSaleProxyFactory.json");
const { solidityPack } = require("ethers/lib/utils");
// let PublicSaleProxyABI = require("../../abis/PublicSaleProxy.abi");
// let PublicSaleABI = require("../../abis/PublicSaleProxy.abi");
let poolCheckAbi =[{
  "inputs": [
    {
      "internalType": "address",
      "name": "tokenA",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "tokenB",
      "type": "address"
    },
    {
      "internalType": "uint24",
      "name": "_fee",
      "type": "uint24"
    }
  ],
  "name": "computePoolAddress",
  "outputs": [
    {
      "internalType": "address",
      "name": "pool",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "token0",
      "type": "address"
    },
    {
      "internalType": "address",
      "name": "token1",
      "type": "address"
    }
  ],
  "stateMutability": "view",
  "type": "function"
}]
describe("Multicall", function () {

  let provider, deployer;

  let tokenDistribute, projectToken,   multicall
  let uniswapInfo;
  let vaults = {
    vestingVault: "",
    initialLiquidityVault: "",
    tonStaker: "",
    tosStaker: "",
    rewardVault: "",
    daoVault: "",
    marketingVault: "",
    publicSaleVault: "",
    initialLiquidityVaultIndex: 0
  }

  let initializeCalls = {
    vestingVault: "",
    initialLiquidityVault: "",
    tonStaker: "",
    tosStaker: "",
    rewardVault: "",
    daoVault: "",
    marketingVault: "",
    publicSaleVault: "",
  }

  let claimTmes, claimAmounts ;
  let vestingPublicFundLogic, vestingPublicFundFactory, eventLogAddress;
  let liquidityVaultLogic, InitialLiquidityVaultFactory;
  let RewardProgramVaultLogic, RewardProgramVaultFactory;

  let initializer;

  let erc20Info = {
    name: 'TEST1',
    symbol: 'TST'
  }

  before(async () => {
    accounts = await ethers.getSigners();
    [admin1, admin2, user1, user2, user3, user4, user5, user6 ] = accounts;
    //console.log('admin1',admin1.address);
    console.log('admin1',admin1.address);
    provider = ethers.provider;
    deployer =admin1;
    info = await getUniswapInfo();
    uniswapInfo= info.uniswapInfo;

    console.log('uniswapInfo', uniswapInfo);
    await hre.ethers.provider.send("hardhat_setBalance", [
      admin1.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);
    await hre.ethers.provider.send("hardhat_setBalance", [
      user1.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);
    await hre.ethers.provider.send("hardhat_setBalance", [
      user2.address,
      "0x4EE2D6D415B85ACEF8100000000",
    ]);

    await hre.ethers.provider.send("hardhat_impersonateAccount",[TosV2Admin]);

    _TosV2Admin = await ethers.getSigner(TosV2Admin);

  });

  describe("TokenDistribute ", () => {

    it("deploy ERC20 for test", async function() {
      const erc20mock = await ethers.getContractFactory("ERC20Mock")

      projectToken = await erc20mock.connect(admin1).deploy(
        erc20Info.name, erc20Info.symbol);

      let code = await admin1.provider.getCode(projectToken.address);
      expect(code).to.not.eq("0x");

      expect(await projectToken.name()).to.be.equal(erc20Info.name);
      expect(await projectToken.symbol()).to.be.equal(erc20Info.symbol);
    });

    it("deploy TokenDistribute ", async () => {
      let factory = await ethers.getContractFactory("TokenDistribute")
      tokenDistribute = await factory.deploy();
      await tokenDistribute.deployed();
      console.log("tokenDistribute.address", tokenDistribute.address)
      let code = await ethers.provider.getCode(tokenDistribute.address);
      expect(code).to.not.eq("0x");
    })

    it("deploy Multicall ", async () => {
      let factory = await ethers.getContractFactory("Multicall")
      multicall = await factory.deploy();
      await multicall.deployed();

      let code = await ethers.provider.getCode(multicall.address);
      console.log("multicall.address", multicall.address)

      expect(code).to.not.eq("0x");
    })

    it("deploy Initializer ", async () => {
      let factory = await ethers.getContractFactory("Initializer")
      initializer = await factory.deploy();
      await initializer.deployed();

      let code = await ethers.provider.getCode(initializer.address);
      console.log("initializer.address", initializer.address)

      expect(code).to.not.eq("0x");
    })

    it("create EventLog", async function () {
      const EventLog = await ethers.getContractFactory("EventLog");
      let EventLogDeployed = await EventLog.deploy();
      let tx = await EventLogDeployed.deployed();
      eventLogAddress = EventLogDeployed.address;
  });

  it("create VestingPublicFund Logic", async function () {
    const VestingPublicFund = await ethers.getContractFactory("VestingPublicFund");
    let VestingPublicFundLogicDeployed = await VestingPublicFund.deploy();
    let tx = await VestingPublicFundLogicDeployed.deployed();
    vestingPublicFundLogic = VestingPublicFundLogicDeployed.address;
    console.log("vestingPublicFundLogic", vestingPublicFundLogic)
  });

  it("create VestingPublicFundFactory ", async function () {
      const VestingPublicFundFactory = await ethers.getContractFactory("VestingPublicFundFactory");
      let VestingPublicFundFactoryDeployed = await VestingPublicFundFactory.deploy();
      let tx = await VestingPublicFundFactoryDeployed.deployed();

      vestingPublicFundFactory =  await ethers.getContractAt("VestingPublicFundFactory", VestingPublicFundFactoryDeployed.address);
      let code = await ethers.provider.getCode(vestingPublicFundFactory.address);

      console.log("vestingPublicFundFactory", vestingPublicFundFactory.address)

      expect(code).to.not.eq("0x");
      await vestingPublicFundFactory.connect(admin1).setLogEventAddress(eventLogAddress);
      await vestingPublicFundFactory.connect(admin1).setLogic(vestingPublicFundLogic);
      // await vestingPublicFundFactory.connect(admin1).setUpgradeAdmin(admin1.address);
      await vestingPublicFundFactory.connect(admin1).setBaseInfo(
        [
            uniswapInfo.ton,
            uniswapInfo.tos,
            admin2.address,
            uniswapInfo.poolfactory,
            initializer.address
        ]
        );
      vaultLogic =  await vestingPublicFundFactory.vaultLogic();

      expect(vaultLogic).to.be.eq(vestingPublicFundLogic);
  });

  it("create liquidityVaultLogic ", async function () {
    const InitialLiquidityVault1 = await ethers.getContractFactory("InitialLiquidityVault1");
    let initialLiquidityVault1 = await InitialLiquidityVault1.deploy();
    let tx = await initialLiquidityVault1.deployed();
    liquidityVaultLogic = initialLiquidityVault1.address;
  });

  it("create InitialLiquidityVaultFactory ", async function () {
      const LiquidityVaultFactory = await ethers.getContractFactory("InitialLiquidityVaultFactory");
      let liquidityVaultFactoryDeployed = await LiquidityVaultFactory.deploy();
      let tx = await liquidityVaultFactoryDeployed.deployed();

      InitialLiquidityVaultFactory =  await ethers.getContractAt("InitialLiquidityVaultFactory", liquidityVaultFactoryDeployed.address);
      let code = await ethers.provider.getCode(InitialLiquidityVaultFactory.address);
      expect(code).to.not.eq("0x");

      await InitialLiquidityVaultFactory.connect(admin1).setLogEventAddress(eventLogAddress);
      await InitialLiquidityVaultFactory.connect(admin1).setLogic(liquidityVaultLogic);
      await InitialLiquidityVaultFactory.connect(admin1).setUniswapInfoNTokens(
        [
          uniswapInfo.poolfactory,
          uniswapInfo.npm
        ],
        uniswapInfo.tos,
        3000
      );
  });

  it("create RewardProgramVault Logic", async function () {
    const RewardProgramVault = await ethers.getContractFactory("RewardProgramVault");
    let RewardProgramVaultLogicDeployed = await RewardProgramVault.deploy();
    let tx = await RewardProgramVaultLogicDeployed.deployed();
    RewardProgramVaultLogic = RewardProgramVaultLogicDeployed.address;
    console.log("RewardProgramVaultLogic", RewardProgramVaultLogic)
  });

  it("create RewardProgramVaultFactory ", async function () {
      const RewardProgramVaultFactory1 = await ethers.getContractFactory("RewardProgramVaultFactory");
      let RewardProgramVaultFactoryDeployed = await RewardProgramVaultFactory1.deploy();
      let tx = await RewardProgramVaultFactoryDeployed.deployed();

      RewardProgramVaultFactory =  await ethers.getContractAt("RewardProgramVaultFactory", RewardProgramVaultFactoryDeployed.address);
      let code = await ethers.provider.getCode(RewardProgramVaultFactory.address);

      console.log("RewardProgramVaultFactory", RewardProgramVaultFactory.address)

      expect(code).to.not.eq("0x");
      await RewardProgramVaultFactory.connect(admin1).setLogEventAddress(eventLogAddress);
      await RewardProgramVaultFactory.connect(admin1).setLogic(RewardProgramVaultLogic);
      await RewardProgramVaultFactory.connect(admin1).setWaitStartSeconds(120);
      await RewardProgramVaultFactory.connect(admin1).setStaker(uniswapInfo.UniswapV3Staker);
      // await RewardProgramVaultFactory.connect(admin1).setInitializer(initializer.address);

      vaultLogic =  await RewardProgramVaultFactory.vaultLogic();
      expect(vaultLogic).to.be.eq(RewardProgramVaultLogic);
  });


    it("deploy VestingVault ", async () => {
      // vestingPublicFundFactory =  await ethers.getContractAt("VestingPublicFundFactory", uniswapInfo.vestingVaultFactory);

      let tx = await vestingPublicFundFactory.connect(admin1).create(
        "vesting",
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedVestingPublicFund(address,string)";
      let interface = vestingPublicFundFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.vestingVault = log.args.contractAddress;
          }
      }
      console.log("VestingVault", vaults.vestingVault)

      vaultLogic =  await vestingPublicFundFactory.vaultLogic();
      console.log("vaultLogic", vaultLogic)
      expect(vaultLogic).to.be.eq(vestingPublicFundLogic);

      let VestingVault =  await ethers.getContractAt("VestingPublicFund", vaults.vestingVault);
      imp =  await VestingVault.proxyImplementation(0);
      console.log("imp", imp)

    })

    it("deploy InitialLiquidityVault ", async () => {
      // InitialLiquidityVaultFactory =  await ethers.getContractAt("InitialLiquidityVaultFactory", uniswapInfo.initialLiquidityVaultFactory);

      vaults.initialLiquidityVaultIndex  =  await InitialLiquidityVaultFactory.totalCreatedContracts();
      console.log('vaults.initialLiquidityVaultIndex',vaults.initialLiquidityVaultIndex)

      let tx = await InitialLiquidityVaultFactory.connect(admin1).create(
        "InitialLiquidityVault",
        projectToken.address,
        admin1.address,
        ethers.constants.One,
        ethers.constants.One
      );

      const receipt = await tx.wait();
      let _function ="CreatedInitialLiquidityVault(address,string)";
      let interface = InitialLiquidityVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.initialLiquidityVault = log.args.contractAddress;
          }
      }
      console.log("initialLiquidityVault", vaults.initialLiquidityVault)

      let info = await InitialLiquidityVaultFactory.getContracts(vaults.initialLiquidityVaultIndex);
      console.log("info", info)

    })

    it("deploy RewardProgramVault ", async () => {

      poolAddressCheck  = new ethers.Contract(uniswapInfo.poolAddressCheck, poolCheckAbi, provider);

      let pool= await poolAddressCheck.computePoolAddress(uniswapInfo.tos, projectToken.address, 3000);

      // RewardProgramVaultFactory =  await ethers.getContractAt("RewardProgramVaultFactory", uniswapInfo.rewardVaultFactory);

      let tx = await RewardProgramVaultFactory.connect(admin1).create(
        "RewardProgramVault",
        pool[0],
        projectToken.address,
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedRewardProgramVault(address,string)";
      let interface = RewardProgramVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.rewardVault = log.args.contractAddress;
          }
      }
      console.log("RewardProgramVault", vaults.rewardVault)
    })
    /*
    it("deploy TONVault ", async () => {
      TONVaultFactory =  await ethers.getContractAt("TONVaultFactory", uniswapInfo.tonStakerFactory);

      let tx = await TONVaultFactory.connect(admin1).create(
        "TONVault",
        projectToken.address,
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedTONVaultProxy(address,string)";
      let interface = TONVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.tonStaker = log.args.contractAddress;
          }
      }
      console.log("TONVault", vaults.tonStaker)
    })

    it("deploy TOSVault ", async () => {
      TOSVaultFactory =  await ethers.getContractAt("TOSVaultFactory", uniswapInfo.tosStakerFactory);

      let tx = await TOSVaultFactory.connect(admin1).create(
        "TOSVault",
        projectToken.address,
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedTOSVaultProxy(address,string)";
      let interface = TOSVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.tosStaker = log.args.contractAddress;
          }
      }
      console.log("TOSVault", vaults.tosStaker)
    })
    */

    /*
    it("deploy daoVaultFactory ", async () => {
      daoVaultFactory =  await ethers.getContractAt("TypeBVaultFactory", uniswapInfo.daoVaultFactory);

      let tx = await daoVaultFactory.connect(admin1).createTypeB(
        "daoVault",
        projectToken.address,
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedTypeBVault(address,string)";
      let interface = daoVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.daoVault = log.args.contractAddress;
          }
      }
      console.log("daoVault ", vaults.daoVault)
    })

    it("deploy marketingVaultFactory ", async () => {
      marketingVaultFactory =  await ethers.getContractAt("TypeCVaultFactory", uniswapInfo.marketiogVaultFactory);

      let tx = await marketingVaultFactory.connect(admin1).createTypeC(
        "marketingVault",
        projectToken.address,
        admin1.address
      );

      const receipt = await tx.wait();
      let _function ="CreatedTypeCVault(address,string)";
      let interface = marketingVaultFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              vaults.marketingVault = log.args.contractAddress;
          }
      }
      console.log("marketingVault ", vaults.marketingVault)
    })


    it("deploy PublicSaleVault ", async () => {

      publicSaleFactory = new ethers.Contract(uniswapInfo.publicSaleFactory, PublicSaleProxyFactoryABI.abi, provider)
      // InitialLiquidityVaultFactory
      let tx = await publicSaleFactory.connect(admin1).create(
        "PublicSaleVault",
        admin1.address,
        [
          projectToken.address,
          admin1.address,
          vaults.initialLiquidityVault
        ],
        vaults.initialLiquidityVaultIndex
      );

      const receipt = await tx.wait();
      let _function ="CreatedPublicSaleProxy(address,string)";
      let interface = publicSaleFactory.interface;

      for(let i=0; i< receipt.events.length; i++){
          if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
              let data = receipt.events[i].data;
              let topics = receipt.events[i].topics;
              let log = interface.parseLog(
              {  data,  topics } );
              console.log('log.args', log.args)
              vaults.publicSaleVault = log.args.contractAddress;
          }
      }
      console.log("PublicSaleVault ", vaults.publicSaleVault)


      console.log("vaults ", vaults)

    })
    */
  })

  describe("TokenDistribute : distribute ", () => {

    it("distribute", async () => {
      const totalSupply = await projectToken.totalSupply();

      let DistributeInfo = [
        {
          to: vaults.initialLiquidityVault,
          amount: ethers.utils.parseEther("500000000")
        },
        {
          to: vaults.rewardVault,
          amount: ethers.utils.parseEther("500000000")
        },
      ]

      let tx = await projectToken.connect(admin1).approve(
        tokenDistribute.address, totalSupply
      );

      await tx.wait();

      let result = await tokenDistribute.connect(admin1).distribute(
          projectToken.address,
          totalSupply,
          DistributeInfo
        );

      expect(await projectToken.balanceOf(vaults.initialLiquidityVault)).to.be.eq(DistributeInfo[0].amount);
      expect(await projectToken.balanceOf(vaults.rewardVault)).to.be.eq(DistributeInfo[1].amount);

    })
  })

  describe("Initializer ", () => {

    it("initializeCalls : vestingVault ", async () => {
      let _block = await ethers.provider.getBlock();

      claimTmes = [
        _block.timestamp+(60*60*24*1),
        _block.timestamp+(60*60*24*2),
        _block.timestamp+(60*60*24*3)
      ];

      claimAmounts = [
        ethers.BigNumber.from("20"),
        ethers.BigNumber.from("40"),
        ethers.BigNumber.from("100")
      ];
      console.log('claimTmes',claimTmes);
      console.log('claimAmounts',claimAmounts);
      console.log('vaults.publicSaleVault',vaults.publicSaleVault);
      console.log('projectToken.address,',projectToken.address,);

      let vestingPublicFund =  await ethers.getContractAt("VestingPublicFund", vaults.vestingVault);

      let calldata =  vestingPublicFund.interface.encodeFunctionData(
        "initialize",
        [
          "0x45e28CBD36e0782498e2570d0A867Cd0475997c5", //vaults.publicSaleVault,
          projectToken.address,
          claimTmes,
          claimAmounts,
          3000
        ])

      initializeCalls.vestingVault = {
        target: vaults.vestingVault,
        callData: calldata
      }

    })
    /*
    it("initializeCalls : initialLiquidityVault ", async () => {

      let initialLiquidityVault =  await ethers.getContractAt("InitialLiquidityVault1", vaults.initialLiquidityVault);
      let sqrtPrice = encodePriceSqrt(ethers.constants.One, ethers.constants.One);
      let _block = await ethers.provider.getBlock();

      let c1 = _block.timestamp + (60*60*24) - 10;
      let calldata = initialLiquidityVault.interface.encodeFunctionData(
        "initialize",
        [
          ethers.utils.parseEther("100000000"),
          uniswapInfo.tos,
          projectToken.address,
          sqrtPrice,
          ethers.BigNumber.from(""+c1)
        ]);

      console.log("c1", c1)
      console.log("sqrtPrice", sqrtPrice)
      console.log("calldata", calldata)

      initializeCalls.initialLiquidityVault = {
        target: vaults.initialLiquidityVault,
        callData: calldata
      }
    })
    */
   /*
    it("initializeCalls : rewardVault ", async () => {

      claimAmounts = [
        ethers.utils.parseEther("100000000"),
        ethers.utils.parseEther("200000000"),
        ethers.utils.parseEther("200000000")
      ];
      let RewardProgramVault =  await ethers.getContractAt("RewardProgramVault", vaults.rewardVault);

      initializeCalls.rewardVault = {
        target: vaults.rewardVault,
        callData: RewardProgramVault.interface.encodeFunctionData(
            "initialize",
            [
              ethers.utils.parseEther("500000000"),
              ethers.BigNumber.from("3"),
              claimTmes,
              claimAmounts
            ])
      }
    })
    */
    it("tryCalls  ", async () => {

      let result = await initializer.connect(admin1).initialize(
          [
            initializeCalls.vestingVault,
            // initializeCalls.initialLiquidityVault,
            // initializeCalls.rewardVault
          ]
        );

        // console.log('result', result)

    })
  })

})