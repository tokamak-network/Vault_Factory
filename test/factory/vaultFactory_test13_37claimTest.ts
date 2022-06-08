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
    let claim4Amount = 1000000      //1,000,000     //4,000,000
    let claim5Amount = 500000       //500,000
    let claim6Amount = 1500000      //1,500,000     //5,000,000
    let claim7Amount = 1000000      //1,000,000
    let claim8Amount = 1000000      //1,000,000
    let claim9Amount = 1000000      //1,000,000     //8,000,000
    let claim10Amount = 500000      //500,000       
    let claim11Amount = 1000000      //1,000,000    
    let claim12Amount = 1000000      //1,000,000
    let claim13Amount = 1000000      //1,000,000
    let claim14Amount = 1000000      //1,000,000
    let claim15Amount = 1000000      //1,000,000    
    let claim16Amount = 1000000      //1,000,000
    let claim17Amount = 500000       //500,000      //15,000,000
    let claim18Amount = 1000000      //1,000,000    //16,000,000    //8,000,000
    let claim19Amount = 1000000      //1,000,000
    let claim20Amount = 1000000      //1,000,000          
    let claim21Amount = 1000000      //1,000,000
    let claim22Amount = 1000000      //1,000,000    //20,000,000    //4,000,000
    let claim23Amount = 500000       //500,000      
    let claim24Amount = 1000000      //1,000,000    //21,500,000  
    let claim25Amount = 1000000      //1,000,000
    let claim26Amount = 1000000      //1,000,000
    let claim27Amount = 1000000      //1,000,000
    let claim28Amount = 500000       //500,000      //25,000,000    //5,000,000
    let claim29Amount = 1000000      //1,000,000
    let claim30Amount = 500000       //500,000
    let claim31Amount = 1000000      //1,000,000
    let claim32Amount = 1000000      //1,000,000
    let claim33Amount = 500000       //500,000      //29,000,000
    let claim34Amount = 1000000      //1,000,000
    let claim35Amount = 1000000      //1,000,000
    let claim36Amount = 1000000      //1,000,000    //32,000,000
    let claim37Amount = 1000000      //1,000,000    //33,000,000
    
    const claim1 = BigNumber.from(claim1Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim2 = BigNumber.from(claim2Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim3 = BigNumber.from(claim3Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim4 = BigNumber.from(claim4Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim5 = BigNumber.from(claim5Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim6 = BigNumber.from(claim6Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim7 = BigNumber.from(claim7Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim8 = BigNumber.from(claim8Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim9 = BigNumber.from(claim9Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim10 = BigNumber.from(claim10Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim11 = BigNumber.from(claim11Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim12 = BigNumber.from(claim12Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim13 = BigNumber.from(claim13Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim14 = BigNumber.from(claim14Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim15 = BigNumber.from(claim15Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim16 = BigNumber.from(claim16Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim17 = BigNumber.from(claim17Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim18 = BigNumber.from(claim18Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim19 = BigNumber.from(claim19Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim20 = BigNumber.from(claim20Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim21 = BigNumber.from(claim21Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim22 = BigNumber.from(claim22Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    const claim23 = BigNumber.from(claim23Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim24 = BigNumber.from(claim24Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim25 = BigNumber.from(claim25Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim26 = BigNumber.from(claim26Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim27 = BigNumber.from(claim27Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim28 = BigNumber.from(claim28Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim29 = BigNumber.from(claim29Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim30 = BigNumber.from(claim30Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim31 = BigNumber.from(claim31Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim32 = BigNumber.from(claim32Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim33 = BigNumber.from(claim33Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim34 = BigNumber.from(claim34Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim35 = BigNumber.from(claim35Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim36 = BigNumber.from(claim36Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim37 = BigNumber.from(claim37Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let claim1Time : any;
    let claim2Time : any;
    let claim3Time : any;
    let claim4Time : any;
    let claim5Time : any;
    let claim6Time : any;
    let claim7Time : any;
    let claim8Time : any;
    let claim9Time : any;
    let claim10Time : any;
    let claim11Time : any;
    let claim12Time : any;
    let claim13Time : any;
    let claim14Time : any;
    let claim15Time : any;
    let claim16Time : any;
    let claim17Time : any;
    let claim18Time : any;
    let claim19Time : any;
    let claim20Time : any;
    let claim21Time : any;
    let claim22Time : any;
    let claim23Time : any;
    let claim24Time : any;
    let claim25Time : any;
    let claim26Time : any;
    let claim27Time : any;
    let claim28Time : any;
    let claim29Time : any;
    let claim30Time : any;
    let claim31Time : any;
    let claim32Time : any;
    let claim33Time : any;
    let claim34Time : any;
    let claim35Time : any;
    let claim36Time : any;
    let claim37Time : any;

    let totalAmount2 = 33000000      //33,000,000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let totalClaim = 37

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

    // it("deploy TypeAVaultFactory ", async function() {
    //     const VaultFactory = await ethers.getContractFactory("TypeAVaultFactory");
    
    //     vaultAFactory = await VaultFactory.connect(deployer).deploy();
    
    //     let code = await deployer.provider.getCode(vaultAFactory.address);
    //     expect(code).to.not.eq("0x");
    // });

    // it("deploy TypeBVaultFactory ", async function() {
    //     const VaultFactory = await ethers.getContractFactory("TypeBVaultFactory");
    
    //     vaultBFactory = await VaultFactory.connect(deployer).deploy();
    
    //     let code = await deployer.provider.getCode(vaultBFactory.address);
    //     expect(code).to.not.eq("0x");
    // });

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
                claim7Time = curBlock.timestamp + (60*31);
                claim8Time = curBlock.timestamp + (60*32);
                claim9Time = curBlock.timestamp + (60*33);
                claim10Time = curBlock.timestamp + (60*34);
                claim11Time = curBlock.timestamp + (60*35);
                claim12Time = curBlock.timestamp + (60*36);
                claim13Time = curBlock.timestamp + (60*37);
                claim14Time = curBlock.timestamp + (60*38);
                claim15Time = curBlock.timestamp + (60*39);
                claim16Time = curBlock.timestamp + (60*40);
                claim17Time = curBlock.timestamp + (60*41);
                claim18Time = curBlock.timestamp + (60*42);
                claim19Time = curBlock.timestamp + (60*43);
                claim20Time = curBlock.timestamp + (60*44);
                claim21Time = curBlock.timestamp + (60*45);
                claim22Time = curBlock.timestamp + (60*46);
                claim23Time = curBlock.timestamp + (60*47);
                claim24Time = curBlock.timestamp + (60*48);
                claim25Time = curBlock.timestamp + (60*49);
                claim26Time = curBlock.timestamp + (60*50);
                claim27Time = curBlock.timestamp + (60*51);
                claim28Time = curBlock.timestamp + (60*52);
                claim29Time = curBlock.timestamp + (60*53);
                claim30Time = curBlock.timestamp + (60*54);
                claim30Time = curBlock.timestamp + (60*55);
                claim31Time = curBlock.timestamp + (60*56);
                claim32Time = curBlock.timestamp + (60*57);
                claim33Time = curBlock.timestamp + (60*58);
                claim34Time = curBlock.timestamp + (60*59);
                claim35Time = curBlock.timestamp + (60*60);
                claim36Time = curBlock.timestamp + (60*61);
                claim37Time = curBlock.timestamp + (60*62);
    
                await typeCVaultLogic.connect(person2).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time,claim7Time,claim8Time,claim9Time,claim10Time,claim11Time,claim12Time,claim13Time,claim14Time,claim15Time,claim16Time,claim17Time,claim18Time,claim19Time,claim20Time,claim21Time,claim22Time,claim23Time,claim24Time,claim25Time,claim26Time,claim27Time,claim28Time,claim29Time,claim30Time,claim31Time,claim32Time,claim33Time,claim34Time,claim35Time,claim36Time,claim37Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6,claim7,claim8,claim9,claim10,claim11,claim12,claim13,claim14,claim15,claim16,claim17,claim18,claim19,claim20,claim21,claim22,claim23,claim24,claim25,claim26,claim27,claim28,claim29,claim30,claim31,claim32,claim33,claim34,claim35,claim36,claim37]
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
                )).to.be.revertedWith("already set");

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

            // it("claim for round1", async () => {
            //     expect(await erc20.balanceOf(person2.address)).to.equal(0);
    
            //     await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time]);
            //     await ethers.provider.send('evm_mine');

            //     let round = await typeCVaultLogic.currentRound()
            //     expect(round).to.equal(1);
                
            //     await typeCVaultLogic.connect(person2).claim(
            //         person2.address
            //     );

            //     let tx = await erc20.balanceOf(person2.address)
            //     // console.log(Number(tx))
            //     // console.log(claim1)
            //     expect(await erc20.balanceOf(person2.address)).to.equal(claim1);
            // })

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
                // console.log(Number(tx))
                let tx2 = Number(claim1)
                let tx3 = Number(claim2)
                let tx4 = tx2+tx3
                // console.log(tx4);
    
                expect(Number(tx)).to.equal(tx4);
            })

            it("claim for round4", async () => {
                let tx = await erc20.balanceOf(person2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let tx2 = claim1A+claim2A
                expect(Number(tx)).to.equal(tx2);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim4Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(4);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let claimAfter = await erc20.balanceOf(person2.address)
                let claim3A = Number(claim3)
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

            it("claim for round9", async () => {
                let tx = await erc20.balanceOf(person2.address)
                let claimAfterAmount = Number(claim1)+Number(claim2)+Number(claim3)+Number(claim4)+Number(claim5)+Number(claim6)
                expect(Number(tx)).to.equal(claimAfterAmount);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim9Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(9);
                
                await typeCVaultLogic.connect(person2).claim(
                    person2.address
                );

                let claimAfter = await erc20.balanceOf(person2.address)
                console.log(Number(claimAfter))
                let claimAfterAmount2 = Number(claim1)+Number(claim2)+Number(claim3)+Number(claim4)+Number(claim5)+Number(claim6)+Number(claim7)+Number(claim8)+Number(claim9)
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })

            it("claim for round11", async () => {
                let tx = await erc20.balanceOf(person1.address)
                // let claimAfterAmount = Number(claim1)+Number(claim2)+Number(claim3)+Number(claim4)+Number(claim5)+Number(claim6)+Number(claim7)+Number(claim8)+Number(claim9)
                expect(Number(tx)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim11Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(11);
                
                await typeCVaultLogic.connect(person2).claim(
                    person1.address
                );

                let claimAfter = await erc20.balanceOf(person1.address)
                let claimAfterAmount2 = Number(claim10)+Number(claim11)
                // console.log("round :", round, ", Amount : ", claimAfterAmount2);
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })

            it("claim for round15", async () => {
                let tx = await erc20.balanceOf(person1.address)
                let claimAfterAmount = Number(claim10)+Number(claim11)
                expect(Number(tx)).to.equal(claimAfterAmount);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim15Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(15);
                
                await typeCVaultLogic.connect(person2).claim(
                    person1.address
                );

                let claimAfter = await erc20.balanceOf(person1.address)
                let claimAfterAmount2 = Number(claim10)+Number(claim11)+Number(claim12)+Number(claim13)+Number(claim14)+Number(claim15)
                // console.log("round :", round, ", Amount : ", claimAfterAmount2);
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })

            it("claim for round18", async () => {
                let tx = await erc20.balanceOf(person1.address)
                let claimAfterAmount = Number(claim10)+Number(claim11)+Number(claim12)+Number(claim13)+Number(claim14)+Number(claim15)
                expect(Number(tx)).to.equal(claimAfterAmount);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim18Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(18);
                
                await typeCVaultLogic.connect(person2).claim(
                    person1.address
                );

                let claimAfter = await erc20.balanceOf(person1.address)
                let claimAfterAmount2 = Number(claim10)+Number(claim11)+Number(claim12)+Number(claim13)+Number(claim14)+Number(claim15)+Number(claim16)+Number(claim17)+Number(claim18)
                console.log("user Amount :",Number(claimAfter));
                // console.log("round :", round, ", Amount : ", claimAfterAmount2);
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })

            it("claim for round22", async () => {
                let tx = await erc20.balanceOf(person3.address)
                // let claimAfterAmount = Number(claim10)+Number(claim11)+Number(claim12)+Number(claim13)+Number(claim14)+Number(claim15)
                expect(Number(tx)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim22Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(22);
                
                await typeCVaultLogic.connect(person2).claim(
                    person3.address
                );

                let claimAfter = await erc20.balanceOf(person3.address)
                console.log("user Amount :",Number(claimAfter));
                let claimAfterAmount2 = Number(claim19)+Number(claim20)+Number(claim21)+Number(claim22)
                // console.log("round :", round, ", Amount : ", claimAfterAmount2);
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })

            it("claim for round28", async () => {
                //23~28까지
                let tx = await erc20.balanceOf(person4.address)
                // let claimAfterAmount = Number(claim19)+Number(claim20)+Number(claim21)+Number(claim22)
                expect(Number(tx)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim28Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(28);
                
                await typeCVaultLogic.connect(person2).claim(
                    person4.address
                );

                let claimAfter = await erc20.balanceOf(person4.address)
                let claimAfterAmount2 = 5000000
                let bigAfterAmount = BigNumber.from(claimAfterAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    
                expect(Number(claimAfter)).to.equal(Number(bigAfterAmount));
            })

            it("claim for round36", async () => {
                //29~36까지
                let tx = await erc20.balanceOf(person5.address)
                expect(Number(tx)).to.equal(0);

                await ethers.provider.send('evm_setNextBlockTimestamp', [claim36Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(36);
                
                await typeCVaultLogic.connect(person2).claim(
                    person5.address
                );

                let claimAfter = await erc20.balanceOf(person5.address)
                let claimAfterAmount2 = 7000000
                let bigAfterAmount = BigNumber.from(claimAfterAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    
                expect(Number(claimAfter)).to.equal(Number(bigAfterAmount));
            })

            it("claim for round37", async () => {
                //37라운드
                let tx = await erc20.balanceOf(person6.address)
                expect(Number(tx)).to.equal(0);

                await ethers.provider.send('evm_setNextBlockTimestamp', [claim37Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultLogic.currentRound()
                expect(round).to.equal(37);
                
                await typeCVaultLogic.connect(person2).claim(
                    person6.address
                );

                let claimAfter = await erc20.balanceOf(person6.address)
                
                let bigAfterAmount = BigNumber.from(claim37Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    
                expect(Number(claimAfter)).to.equal(Number(bigAfterAmount));
            })

        })
    })
})