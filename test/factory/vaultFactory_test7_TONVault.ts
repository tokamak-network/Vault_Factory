import { expect } from "chai";
const { ethers, network } = require('hardhat')
const LockTOSdivided_ABI = require('../../abis/LockTOSdivided_ABI.json');
const LockTOS_ABI = require('../../abis/LockTOS_ABI.json');
const TOS_ABI = require('../../abis/TOS_ABI.json');
const ERC20Recorder_ABI = require('../../abis/ERC20Recorder.json');
const TestERC20_ABI = require('../../abis/TestERC20.json');
const TokenDividendPool_ABI = require('../../abis/TokenDividendPool.json');
const TokenDividendPoolProxy_ABI = require('../../abis/TokenDividendPoolProxy.json');

const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed
} = require("@ethersproject/bignumber");

describe("VaultFactory", () => {
    let TONVault : any;
    let TONVaultProxy : any;
    let TONVaultLogic : any;
    let TONVault2 : any;
    let TONVaultProxy2 : any;
    let TONVaultLogic2 : any;
    let erc20Recorder : any;
    let erc20A : any;
    let dividedPool : any;
    let dividedPool2 : any;
    let TONVaultFactory : any;
    let provider;
    let deployer : any;
    let user1 : any;
    let person1 : any;
    let person2 : any;
    let person3 : any;
    let person4 : any;
    let person5 : any;
    let person6 : any;
    let erc20 : any;
    let erc20_1 : any;
    let proxyAdmin : any;
    let tokendividendPool : any;
    let tokendividendPoolProxy : any;
    let tokendividendPoolset : any;

    let lockTOSdividedProxy = `0xA1E633C746DA99dceB42D65A59D3e4B5672a6bA1`;
    let lockTOSProxy = `0x5e820954a327Db71dbcad8D7C73B95f08d8f07f1`;
    let TOSAddress = `0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd`;
    let lockTOSContract : any;
    let tosContract : any;
    let stakingAccount = "0xf0B595d10a92A5a9BC3fFeA7e79f5d266b6035Ea";

    const BASE_TEN = 10
    const decimals = 18

    let claim1Amount = 1000000      //1,000,000     //1,000,000
    let claim2Amount = 300000       //300,000       //1,300,000
    let claim3Amount = 700000       //700,000
    let claim4Amount = 1000000      //1,000,000     //3,000,000
    let claim5Amount = 500000       //500,000
    let claim6Amount = 1500000      //1,500,000     //5,000,000
    // let claim7Amount = 4000000      //4,000,000

    const claim1 = BigNumber.from(claim1Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim2 = BigNumber.from(claim2Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim3 = BigNumber.from(claim3Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim4 = BigNumber.from(claim4Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim5 = BigNumber.from(claim5Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim6 = BigNumber.from(claim6Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    // const claim7 = BigNumber.from(claim7Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let totalAmount2 = 5000000      //5,000,000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let tosStakAmount = 2000
    let tosAmount = BigNumber.from(tosStakAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let claim1Time : any;
    let claim2Time : any;
    let claim3Time : any;
    let claim4Time : any;
    let claim5Time : any;
    let claim6Time : any;
    let snapshot : any;
    let admin : any;
    let depositManager : any;
    let eventLogAddress : any;


    let totalClaim = 6

    let erc20Info = { name: "ERC20" , symbol: "ERC20" }
    let erc20_1_Info = { name: "ERC20_1" , symbol: "ERC20_1" }

    let vaultContracts = [
        {
         name : "typeA",
         owner : null,
         contractAddress: null,
         index : null,
  
        },
        {
         name : "typeB",
         owner : null,
         contractAddress: null,
         index : null
        },
        {
         name : "typeC",
         owner : null,
         contractAddress: null,
         index : null
        },
    ]

    let tonVaultinfo = [
        {
            contractAddress : null,
            name : null
        },
        {
            contractAddress : null,
            name : null
        }
    ]

    before(async function () {
        let accounts = await ethers.getSigners();
        [deployer, user1, person1, person2, person3, person4, person5, person6, dividedPool2, proxyAdmin, admin, depositManager ] = accounts
        vaultContracts[0].owner = user1;
        vaultContracts[1].owner = person1;
        vaultContracts[2].owner = person2;
    
        provider = ethers.provider;
        //person1 -> TOSVaultFacotry Admin
        //person2 -> TOSVault Admin
    });

    describe("deploy the contract", async () => {
        it("deploy ERC20 for test", async function() { 
            const erc20mock = await ethers.getContractFactory("ERC20Mock")
    
            erc20 = await erc20mock.connect(deployer).deploy(erc20Info.name, erc20Info.symbol);
            erc20_1 = await erc20mock.connect(deployer).deploy(erc20_1_Info.name, erc20_1_Info.symbol);
    
            let code = await deployer.provider.getCode(erc20.address);
            expect(code).to.not.eq("0x");
        
            expect(await erc20.name()).to.be.equal(erc20Info.name);
            expect(await erc20.symbol()).to.be.equal(erc20Info.symbol);
        });

        it("deploy erc20Recorder", async () => {
            const contract = await (
                await ethers.getContractFactory(
                    ERC20Recorder_ABI.abi,
                    ERC20Recorder_ABI.bytecode
                )
            ).deploy(
                "tokenRecorder",
                "TA",
                deployer.address,
                depositManager.address
            );

            await contract.deployed();
            erc20Recorder = await ethers.getContractAt(ERC20Recorder_ABI.abi, contract.address);
            let code = await ethers.provider.getCode(erc20Recorder.address);
            expect(code).to.not.eq("0x"); 
        })

        it("deploy the TokenDividendPoolLogic", async () => {
            const contract = await (
                await ethers.getContractFactory(
                    TokenDividendPool_ABI.abi,
                    TokenDividendPool_ABI.bytecode
                )
            ).deploy();

            await contract.deployed();
            tokendividendPool = await ethers.getContractAt(TokenDividendPool_ABI.abi, contract.address);
            let code = await ethers.provider.getCode(tokendividendPool.address);
            expect(code).to.not.eq("0x"); 
        })

        it("deploy the TokenDividendPoolProxy", async () => {
            const contract = await (
                await ethers.getContractFactory(
                    TokenDividendPoolProxy_ABI.abi,
                    TokenDividendPoolProxy_ABI.bytecode
                )
            ).deploy(
                tokendividendPool.address,
                deployer.address
            );

            await contract.deployed();
            tokendividendPoolProxy = await ethers.getContractAt(TokenDividendPoolProxy_ABI.abi, contract.address);
            await (await tokendividendPoolProxy.initialize(erc20Recorder.address)).wait();

            tokendividendPoolset = await ethers.getContractAt(TokenDividendPool_ABI.abi, tokendividendPoolProxy.address);
            
            await (await erc20Recorder.grantRole(erc20Recorder.SNAPSHOT_ROLE(), tokendividendPoolset.address)).wait();

            let code = await ethers.provider.getCode(tokendividendPoolProxy.address);
            expect(code).to.not.eq("0x"); 
            let code2 = await ethers.provider.getCode(tokendividendPoolset.address);
            expect(code2).to.not.eq("0x");

        })

        it("deploy the TestERC20", async () => {
            const contract = await (
                await ethers.getContractFactory(
                    TestERC20_ABI.abi,
                    TestERC20_ABI.bytecode
                )
            ).deploy(
                "TestERC20A", 
                "ERA"
            );

            await contract.deployed();
            erc20A = await ethers.getContractAt(TestERC20_ABI.abi, contract.address);
            let code = await ethers.provider.getCode(erc20A.address);
            expect(code).to.not.eq("0x"); 
        })
    
        it("deploy TONVaultFactory ", async function() {
            const VaultFactory = await ethers.getContractFactory("TONVaultFactory");
            TONVaultFactory = await VaultFactory.connect(deployer).deploy();

            let code = await deployer.provider.getCode(TONVaultFactory.address);
            expect(code).to.not.eq("0x");
            expect(await TONVaultFactory.isAdmin(deployer.address)).to.be.equal(true);
        });

        it("deploy TONVault", async () => {
            const devTONVault = await ethers.getContractFactory("TONVault");

            TONVault = await devTONVault.deploy();

            let code = await deployer.provider.getCode(TONVault.address);
            expect(code).to.not.eq("0x");
        });

        it("create EventLog", async function () {
            const EventLog = await ethers.getContractFactory("EventLog");
            let EventLogDeployed = await EventLog.deploy();
            let tx = await EventLogDeployed.deployed();
            eventLogAddress = EventLogDeployed.address;
        });
    })

    describe("vaultFactory", async () => {
        it("setLogic call from not admin", async () => {
            await expect(
                TONVaultFactory.connect(user1).setLogic(TONVault.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        })
        it("setLogic call from admin", async () => {
            await TONVaultFactory.connect(deployer).setLogic(TONVault.address)

            expect(await TONVaultFactory.vaultLogic()).to.be.eq(TONVault.address);
        })

        it("setUpgradeAdmin call from not admin", async function () {
            await expect(
                TONVaultFactory.connect(user1).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setUpgradeAdmin call from admin", async function () {
            await TONVaultFactory.connect(deployer).setUpgradeAdmin(proxyAdmin.address);
            expect(await TONVaultFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("setinfo call from not admin", async function () {
            await expect(
                TONVaultFactory.connect(user1).setinfo(tokendividendPoolset.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setinfo call from admin", async function () {
            await TONVaultFactory.connect(deployer).setinfo(tokendividendPoolset.address);
            expect(await TONVaultFactory.dividedPoolProxy()).to.be.eq(tokendividendPoolset.address);
        });

        it("setLogEventAddress call from not admin", async function () {
            await expect(
                TONVaultFactory.connect(user1).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setLogEventAddress call from admin", async function () {
            await TONVaultFactory.connect(deployer).setLogEventAddress(eventLogAddress);
            expect(await TONVaultFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("create TONVaultProxy by deployer", async function() {
            let prevTotalCreatedContracts = await TONVaultFactory.totalCreatedContracts();
    
            await TONVaultFactory.connect(deployer).create(
                "ABC",
                erc20A.address,
                person2.address
            )
    
            let afterTotalCreatedContracts = await TONVaultFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await TONVaultFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            tonVaultinfo[0] = info;
            expect(info.name).to.be.equal("ABC");
    
            TONVaultProxy = await ethers.getContractAt("TONVaultProxy", info.contractAddress);
            expect(await TONVaultProxy.isAdmin(deployer.address)).to.be.equal(false);
            expect(await TONVaultProxy.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await TONVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await TONVaultProxy.isAdmin(person2.address)).to.be.equal(true);
            expect(await TONVaultProxy.isProxyAdmin(person2.address)).to.be.eq(false);
            expect(await TONVaultProxy.dividiedPool()).to.be.equal(tokendividendPoolset.address);
            TONVaultLogic = await ethers.getContractAt("TONVault", info.contractAddress);
        });

        it("lastestCreated call from anybody", async () => {
            let info = await TONVaultFactory.connect(person5).lastestCreated();
            expect(info.contractAddress).to.be.equal(tonVaultinfo[0].contractAddress);
        })

        it("create TONVaultProxy by anyone", async function() {
            let prevTotalCreatedContracts = await TONVaultFactory.totalCreatedContracts();
    
            await TONVaultFactory.connect(person5).create(
                "ABCD",
                erc20A.address,
                person5.address
            )
    
            let afterTotalCreatedContracts = await TONVaultFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await TONVaultFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            tonVaultinfo[1] = info;
            expect(info.name).to.be.equal("ABCD");
    
            TONVaultProxy2 = await ethers.getContractAt("TONVaultProxy", info.contractAddress);
            expect(await TONVaultProxy2.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await TONVaultProxy2.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await TONVaultProxy2.isAdmin(person5.address)).to.be.equal(true);
            expect(await TONVaultProxy2.isProxyAdmin(person5.address)).to.be.eq(false);
            expect(await TONVaultProxy2.dividiedPool()).to.be.equal(tokendividendPoolset.address);
            TONVaultLogic2 = await ethers.getContractAt("TONVault", info.contractAddress);
        });
    })

    describe("makeBalance user", async () => {
        const makeBalance = async (token : any, user : any, amount : any) => {
            // empty balance
            const balance = await token.balanceOf(user.address);
            await (await token.connect(depositManager).burnFrom(user.address, balance)).wait();
            expect(await token.balanceOf(user.address)).to.be.eq(0);
    
            // send amount
            await (await token.connect(depositManager).mint(user.address, amount)).wait();
            expect(await token.balanceOf(user.address)).to.be.eq(amount);
        };

        it("should create balances", async () => {
            const amount1 = 10;
            await makeBalance(erc20Recorder, person1, amount1);
    
            const amount2 = 15;
            await makeBalance(erc20Recorder, person2, amount2);
    
            const amount3 = 25;
            await makeBalance(erc20Recorder, person3, amount3);
    
            const amount4 = 50;
            await makeBalance(erc20Recorder, person4, amount4);
        });
    })



    describe("TONVault test", async () => {
        it("check name, mock ", async function() {
            expect(await TONVaultLogic.name()).to.equal("ABC");
            expect(await TONVaultLogic.token()).to.equal(erc20A.address);
        });


        it("check the initialize before input token", async ()  => {
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);
            
            await expect(TONVaultLogic.connect(person2).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("need to input the token");
        })
        
        it("initialize check the onlyOwner", async () => {
            await erc20A.connect(deployer).mint(deployer.address, totalAmount)
            await erc20A.connect(deployer).transfer(TONVaultLogic.address, totalAmount)

            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);
            
            await expect(TONVaultLogic.connect(person5).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("Accessible: Caller is not an admin");
        })

        it("check the withdraw call from not owner", async () => {
            await expect(TONVaultLogic.connect(person5).withdraw(
                person5.address,
                totalAmount
            )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("check the withdraw call from owner", async () => {
            let tx = await erc20A.balanceOf(person2.address);
            expect(tx).to.be.equal(0);

            await TONVaultLogic.connect(person2).withdraw(
                person2.address,
                totalAmount
            )

            let tx2 = await erc20A.balanceOf(person2.address);
            expect(tx2).to.be.equal(totalAmount);

            await erc20A.connect(person2).transfer(TONVaultLogic.address,totalAmount)
        })

        it("check the changeToken call from not owner", async () => {
            await expect(TONVaultLogic.connect(person5).changeToken(
                erc20_1.address
            )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("check the changeToken call from owner", async () => {
            let tx = await TONVaultLogic.token();
            expect(tx).to.be.equal(erc20A.address)
            await TONVaultLogic.connect(person2).changeToken(
                erc20_1.address
            )
            let tx2 = await TONVaultLogic.token();
            expect(tx2).to.be.equal(erc20_1.address)

            await TONVaultLogic.connect(person2).changeToken(
                erc20A.address
            )
        })

        it("check the initialize after input token", async ()  => {
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);

            await TONVaultLogic.connect(person2).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            );

            expect(await TONVaultLogic.totalAllocatedAmount()).to.equal(totalAmount);
            expect(await TONVaultLogic.totalClaimCounts()).to.equal(totalClaim);

            let tx = await TONVaultLogic.claimTimes(0);
            expect(tx).to.equal(claim1Time)
            
            let tx2 = await TONVaultLogic.claimAmounts(0);
            expect(tx2).to.equal(claim1)

            let tx3 = await TONVaultLogic.claimAmounts(3);
            expect(tx3).to.equal(claim4)

            let tx4 = await TONVaultLogic.claimAmounts(5);
            expect(tx4).to.equal(claim6)
        })

        it("check the withdraw after setting", async () => {
            await expect(TONVaultLogic.connect(person3).withdraw(
                person2.address,
                totalAmount
            )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("check the changeToken after setting", async () => {
            await expect(TONVaultLogic.connect(person3).changeToken(
                erc20_1.address
            )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("check the initialize after setting", async () => {
            await expect(TONVaultLogic.connect(person3).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("Accessible: Caller is not an admin")
        })

        it("claim call before startTime", async () => {
            await expect(TONVaultLogic.connect(person1).claim()).to.be.revertedWith("Vault: not started yet");
        })

        it("check claimable amount is 0", async () => {
            let tx  = await tokendividendPoolset.claimable(erc20A.address, person1.address);
            expect(tx).to.be.equal(0)
            let tx2  = await tokendividendPoolset.claimable(erc20A.address, person2.address);
            expect(tx2).to.be.equal(0)
            let tx3  = await tokendividendPoolset.claimable(erc20A.address, person3.address);
            expect(tx3).to.be.equal(0)
            let tx4  = await tokendividendPoolset.claimable(erc20A.address, person4.address);
            expect(tx4).to.be.equal(0)
        })

        it("anyone can call claim", async () => {
            expect(await erc20A.balanceOf(tokendividendPoolset.address)).to.equal(0);
            await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time]);
            await ethers.provider.send('evm_mine');

            let round = await TONVaultLogic.currentRound()
            expect(round).to.equal(1);

            let calculClaimAmount = await TONVaultLogic.calculClaimAmount(1)
            expect(calculClaimAmount).to.be.equal(claim1);

            await TONVaultLogic.connect(person1).claim();
            expect(await erc20A.balanceOf(tokendividendPoolset.address)).to.equal(claim1);
        })

        
        it("dividedPool added storage erc20.address", async () => {        
            let tx2 = await tokendividendPoolset.distributions(erc20A.address)
            // console.log(tx2)
            expect(tx2.exists).to.be.equal(true);
        })
            
            
        it("anyone can call claim2", async () => {
            expect(await erc20A.balanceOf(tokendividendPoolset.address)).to.equal(claim1);
        
            await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time]);
            await ethers.provider.send('evm_mine');
        
            let round = await TONVaultLogic.currentRound()
            expect(round).to.equal(2);
            let calculClaimAmount = await TONVaultLogic.calculClaimAmount(2)
            expect(calculClaimAmount).to.be.equal(claim2);
        
            await TONVaultLogic.connect(person2).claim();
            
            let tx = await erc20A.balanceOf(tokendividendPoolset.address)
            let tx2 = Number(claim1)
            let tx3 = Number(claim2)
            let tx4 = tx2+tx3
        
            expect(Number(tx)).to.equal(tx4);
        })
                                        
        it("check claimable amount is above 0 ", async () => {
            let tx  = await tokendividendPoolset.claimable(erc20A.address, person1.address);
            expect(tx).to.be.above(0)
            let tx2  = await tokendividendPoolset.claimable(erc20A.address, person2.address);
            expect(tx2).to.be.above(0)
            let tx3  = await tokendividendPoolset.claimable(erc20A.address, person3.address);
            expect(tx3).to.be.above(0)
            let tx4  = await tokendividendPoolset.claimable(erc20A.address, person4.address);
            expect(tx4).to.be.above(0)
        })

        it("anyone can call claim6", async () => {
            let tx = await erc20A.balanceOf(tokendividendPoolset.address)
            let claim1A = Number(claim1)
            let claim2A = Number(claim2)
            let tx2 = claim1A+claim2A
            expect(Number(tx)).to.equal(tx2);

            await ethers.provider.send('evm_setNextBlockTimestamp', [claim6Time+10]);
            await ethers.provider.send('evm_mine');

            let round = await TONVaultLogic.currentRound()
            expect(round).to.equal(6);
            
            await TONVaultLogic.connect(person3).claim();

            let claimAfter = await erc20A.balanceOf(tokendividendPoolset.address)
            let claim3A = Number(claim3)
            let claim4A = Number(claim4)
            let claim5A = Number(claim5)
            let claim6A = Number(claim6)
            let claimAfterAmount2 = claim1A+claim2A+claim3A+claim4A+claim5A+claim6A

            expect(Number(claimAfter)).to.equal(claimAfterAmount2);
        })

        it("check the tokenDividedPool claim", async () => {
            let beforeAmount1 = await erc20A.balanceOf(person1.address);
            expect(Number(beforeAmount1)).to.be.equal(0);
            await tokendividendPoolset.connect(person1).claim(erc20A.address);
            let afterAmount1 = await erc20A.balanceOf(person1.address);
            // console.log(Number(afterAmount1));
            expect(Number(afterAmount1)).to.be.above(0);

            let beforeAmount2 = await erc20A.balanceOf(person2.address);
            expect(Number(beforeAmount2)).to.be.equal(0);
            await tokendividendPoolset.connect(person2).claim(erc20A.address);
            let afterAmount2 = await erc20A.balanceOf(person2.address);
            // console.log(Number(afterAmount2));
            expect(Number(afterAmount2)).to.be.above(Number(afterAmount1));


            let beforeAmount3 = await erc20A.balanceOf(person3.address);
            expect(Number(beforeAmount3)).to.be.equal(0);
            await tokendividendPoolset.connect(person3).claim(erc20A.address);
            let afterAmount3 = await erc20A.balanceOf(person3.address);
            // console.log(Number(afterAmount3));
            expect(Number(afterAmount3)).to.be.above(Number(afterAmount2));


            let beforeAmount4 = await erc20A.balanceOf(person4.address);
            expect(Number(beforeAmount4)).to.be.equal(0);
            await tokendividendPoolset.connect(person4).claim(erc20A.address);
            let afterAmount4 = await erc20A.balanceOf(person4.address);
            // console.log(Number(afterAmount4));
            expect(Number(afterAmount4)).to.be.above(Number(afterAmount3));
        })
    })

})