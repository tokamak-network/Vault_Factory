import { expect } from "chai";
const { ethers, network } = require('hardhat')

const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed
} = require("@ethersproject/bignumber");

describe("VaultFactory", () => {
    let typeAVault : any;
    let typeBVault : any;
    let typeCVault : any;
    let typeCVaultProxy : any;
    let typeCVaultProxy2 : any;
    let typeCVaultLogic : any;
    let typeCVaultLogic2 : any;
    let vaultAFactory : any;
    let vaultBFactory : any;
    let vaultCFactory : any;
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
    let proxyAdmin : any;
    let admin : any;
    let eventLogAddress : any;


    const BASE_TEN = 10
    const decimals = 18

    let claim1Amount = 1000000      //1,000,000     //1,000,000
    let claim2Amount = 300000       //300,000       //1,300,000
    let claim3Amount = 700000       //700,000
    let claim4Amount = 1000000      //1,000,000     //3,000,000
    let claim5Amount = 500000       //500,000
    let claim6Amount = 1500000      //1,500,000     //5,000,000

    const claim1 = BigNumber.from(claim1Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim2 = BigNumber.from(claim2Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim3 = BigNumber.from(claim3Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim4 = BigNumber.from(claim4Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim5 = BigNumber.from(claim5Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim6 = BigNumber.from(claim6Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let claim1Time : any;
    let claim2Time : any;
    let claim3Time : any;
    let claim4Time : any;
    let claim5Time : any;
    let claim6Time : any;

    let totalAmount2 = 5000000      //5,000,000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let totalClaim = 6

    let erc20Info = { name: "ERC20" , symbol: "ERC20" }

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

    let typeCVaultinfo = [
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
        [deployer, user1, person1, person2, person3, person4, person5, person6, proxyAdmin, admin ] = accounts
        vaultContracts[0].owner = user1;
        vaultContracts[1].owner = person1;
        vaultContracts[2].owner = person2;
    
        provider = ethers.provider;
    });

    it("deploy ERC20 for test", async function() { 
        const erc20mock = await ethers.getContractFactory("ERC20Mock")

        erc20 = await erc20mock.connect(deployer).deploy(erc20Info.name, erc20Info.symbol);

        let code = await deployer.provider.getCode(erc20.address);
        expect(code).to.not.eq("0x");
    
        expect(await erc20.name()).to.be.equal(erc20Info.name);
        expect(await erc20.symbol()).to.be.equal(erc20Info.symbol);
    });

    it("deploy TypeAVaultFactory ", async function() {
        const VaultFactory = await ethers.getContractFactory("TypeAVaultFactory");
    
        vaultAFactory = await VaultFactory.connect(deployer).deploy();
    
        let code = await deployer.provider.getCode(vaultAFactory.address);
        expect(code).to.not.eq("0x");
    });

    it("deploy TypeBVaultFactory ", async function() {
        const VaultFactory = await ethers.getContractFactory("TypeBVaultFactory");
    
        vaultBFactory = await VaultFactory.connect(deployer).deploy();
    
        let code = await deployer.provider.getCode(vaultBFactory.address);
        expect(code).to.not.eq("0x");
    });

    it("deploy TypeCVaultFactory ", async function() {
        const VaultFactory = await ethers.getContractFactory("TypeCVaultFactory");
    
        vaultCFactory = await VaultFactory.connect(deployer).deploy();
    
        let code = await deployer.provider.getCode(vaultCFactory.address);
        expect(code).to.not.eq("0x");
        expect(await vaultCFactory.isAdmin(deployer.address)).to.be.equal(true);
    });

    it("deploy typeCVault", async () => {
        const devtypeCVault = await ethers.getContractFactory("TypeCVault");

        typeCVault = await devtypeCVault.deploy();

        let code = await deployer.provider.getCode(typeCVault.address);
        expect(code).to.not.eq("0x");
    })

    it("create EventLog", async () => {
        const EventLog = await ethers.getContractFactory("EventLog");
        let EventLogDeployed = await EventLog.deploy();
        let tx = await EventLogDeployed.deployed();
        eventLogAddress = EventLogDeployed.address;
    })

    describe("typeCvaultFactory", async () => {
        it("setLogic call from not admin", async () => {
            await expect(
                vaultCFactory.connect(user1).setLogic(typeCVault.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        })
        it("setLogic call from admin", async () => {
            await vaultCFactory.connect(deployer).setLogic(typeCVault.address)

            expect(await vaultCFactory.vaultLogic()).to.be.eq(typeCVault.address);
        })

        it("setUpgradeAdmin call from not admin", async function () {
            await expect(
                vaultCFactory.connect(user1).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setUpgradeAdmin call from admin", async function () {
            await vaultCFactory.connect(deployer).setUpgradeAdmin(proxyAdmin.address);
            expect(await vaultCFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("setLogEventAddress call from not admin", async function () {
            await expect(
                vaultCFactory.connect(user1).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setLogEventAddress call from admin", async function () {
            await vaultCFactory.connect(deployer).setLogEventAddress(eventLogAddress);
            expect(await vaultCFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("create typeCVaultProxy by deployer", async function() {
            let prevTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();
    
            await vaultCFactory.connect(deployer).createTypeC(
                "ABC",
                erc20.address,
                person2.address
            )
    
            let afterTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await vaultCFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            typeCVaultinfo[0] = info;
            expect(info.name).to.be.equal("ABC");
    
            typeCVaultProxy = await ethers.getContractAt("TypeCVaultProxy", info.contractAddress);
            expect(await typeCVaultProxy.isAdmin(deployer.address)).to.be.equal(false);
            expect(await typeCVaultProxy.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await typeCVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await typeCVaultProxy.isAdmin(person2.address)).to.be.equal(true);
            expect(await typeCVaultProxy.isProxyAdmin(person2.address)).to.be.eq(false);
            typeCVaultLogic = await ethers.getContractAt("TypeCVault", info.contractAddress);
        });

        it("lastestCreated call from anybody", async () => {
            let info = await vaultCFactory.connect(person5).lastestCreated();
            expect(info.contractAddress).to.be.equal(typeCVaultinfo[0].contractAddress);
        })

        it("create typeCVaultProxy by anyone", async function() {
            let prevTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();
    
            await vaultCFactory.connect(person5).createTypeC(
                "ABCD",
                erc20.address,
                person5.address
            )
    
            let afterTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await vaultCFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            typeCVaultinfo[1] = info;
            expect(info.name).to.be.equal("ABCD");
    
            typeCVaultProxy2 = await ethers.getContractAt("TypeCVaultProxy", info.contractAddress);
            expect(await typeCVaultProxy2.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await typeCVaultProxy2.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await typeCVaultProxy2.isAdmin(person5.address)).to.be.equal(true);
            expect(await typeCVaultProxy2.isProxyAdmin(person5.address)).to.be.eq(false);
            typeCVaultLogic2 = await ethers.getContractAt("TypeCVault", info.contractAddress);
        });
    })

    describe("typeC test", () => {

        describe("setting", () => {
            it("check name, mock ", async function() {
                expect(await typeCVaultLogic.name()).to.equal("ABC");
                expect(await typeCVaultLogic.token()).to.equal(erc20.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                claim1Time = curBlock.timestamp + (60*5);
                claim2Time = curBlock.timestamp + (60*8);
                claim3Time = curBlock.timestamp + (60*15);
                claim4Time = curBlock.timestamp + (60*20);
                claim5Time = curBlock.timestamp + (60*23);
                claim6Time = curBlock.timestamp + (60*30);
    
                await expect(typeCVaultLogic.connect(person3).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(typeCVaultLogic.connect(person3).claim(
                    person2.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    
            it("check the initialize before input token", async ()  => {
                let curBlock = await ethers.provider.getBlock();
                claim1Time = curBlock.timestamp + (60*5);
                claim2Time = curBlock.timestamp + (60*8);
                claim3Time = curBlock.timestamp + (60*15);
                claim4Time = curBlock.timestamp + (60*20);
                claim5Time = curBlock.timestamp + (60*23);
                claim6Time = curBlock.timestamp + (60*30);
    
                await expect(typeCVaultLogic.connect(person2).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                )).to.be.revertedWith("need to input the token");
            })
    
            it("check the initialize after input token", async ()  => {
                await erc20.connect(deployer).transfer(typeCVaultLogic.address,totalAmount)
                let curBlock = await ethers.provider.getBlock();
                claim1Time = curBlock.timestamp + (60*5);
                claim2Time = curBlock.timestamp + (60*8);
                claim3Time = curBlock.timestamp + (60*15);
                claim4Time = curBlock.timestamp + (60*20);
                claim5Time = curBlock.timestamp + (60*23);
                claim6Time = curBlock.timestamp + (60*30);
    
                await typeCVaultLogic.connect(person2).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                );
    
                expect(await typeCVaultLogic.totalAllocatedAmount()).to.equal(totalAmount);
                expect(await typeCVaultLogic.totalClaimCounts()).to.equal(totalClaim);
    
                let tx = await typeCVaultLogic.claimTimes(0);
                expect(tx).to.equal(claim1Time)
                
                let tx2 = await typeCVaultLogic.claimAmounts(0);
                expect(tx2).to.equal(claim1)
    
                let tx3 = await typeCVaultLogic.claimAmounts(2);
                expect(tx3).to.equal(claim3)
    
                let tx4 = await typeCVaultLogic.claimAmounts(5);
                expect(tx4).to.equal(claim6)
            })
    
            it("claimer claim test befroe startTime", async () => {
                await expect(typeCVaultLogic.connect(person2).claim(
                    person1.address
                )).to.be.revertedWith("Vault: not started yet");
            })
        })

        describe("claim test", () => {
            it("time to claim1Time", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time+1]);
                await ethers.provider.send('evm_mine');
            })

            it("dont change initialize after claim1Time", async () => {
                let curBlock = await ethers.provider.getBlock();
                let Time1 = curBlock.timestamp + (60*5);
                let Time2 = curBlock.timestamp + (60*8);
                let Time3 = curBlock.timestamp + (60*15);
                let Time4 = curBlock.timestamp + (60*20);
                let Time5 = curBlock.timestamp + (60*23);
                let Time6 = curBlock.timestamp + (60*30);
    
                await expect(typeCVaultLogic.connect(person2).initialize(
                    totalAmount,
                    totalClaim,
                    [Time1,Time2,Time3,Time4,Time5,Time6],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                )).to.be.revertedWith("over time");

            })

            it("claim for round1", async () => {
                expect(await erc20.balanceOf(person2.address)).to.equal(0);

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(1);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let tx = await erc20.balanceOf(person2.address)
                // console.log(Number(tx))
                // console.log(claim1)
                expect(await erc20.balanceOf(person2.address)).to.equal(claim1);
            })


            it("claim for round2", async () => {
                expect(await erc20.balanceOf(person2.address)).to.equal(claim1);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(2);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let tx = await erc20.balanceOf(person2.address)
                let tx2 = Number(claim1)
                let tx3 = Number(claim2)
                let tx4 = tx2+tx3
    
                expect(Number(tx)).to.equal(tx4);
            })

            it("claim for round3", async () => {
                let tx = await erc20.balanceOf(person2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let tx2 = claim1A+claim2A
                expect(Number(tx)).to.equal(tx2);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim3Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(3);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let claimAfter = await erc20.balanceOf(person2.address)
                let claim3A = Number(claim3)
                let claimAfterAmount = claim1A+claim2A+claim3A
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount);
            })

            it("claim for round4", async () => {
                let tx = await erc20.balanceOf(person2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let claim3A = Number(claim3)
                let tx2 = claim1A+claim2A+claim3A
                expect(Number(tx)).to.equal(tx2);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim4Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(4);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let claimAfter = await erc20.balanceOf(person2.address)
                let claim4A = Number(claim4)
                let claimAfterAmount = claim1A+claim2A+claim3A+claim4A
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount);
            })

            it("claim for round6", async () => {
                let tx = await erc20.balanceOf(person2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let claim3A = Number(claim3)
                let claim4A = Number(claim4)
                let claimAfterAmount = claim1A+claim2A+claim3A+claim4A
                expect(Number(tx)).to.equal(claimAfterAmount);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim6Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(6);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let claimAfter = await erc20.balanceOf(person2.address)
                let claim5A = Number(claim5)
                let claim6A = Number(claim6)
                let claimAfterAmount2 = claim1A+claim2A+claim3A+claim4A+claim5A+claim6A
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })
        })
    })
})