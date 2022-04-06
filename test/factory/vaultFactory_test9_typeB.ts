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
    let typeBVaultProxy : any;
    let typeBVaultProxy2 : any;
    let typeBVaultLogic : any;
    let typeBVaultLogic2 : any;
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
    let claim7Amount = 4000000      //4,000,000

    const claim1 = BigNumber.from(claim1Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim2 = BigNumber.from(claim2Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim3 = BigNumber.from(claim3Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim4 = BigNumber.from(claim4Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim5 = BigNumber.from(claim5Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim6 = BigNumber.from(claim6Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    const claim7 = BigNumber.from(claim7Amount).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let totalAmount2 = 5000000      //5,000,000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))

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

    let typeBVaultinfo = [
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
    });

    it("deploy typeBVault", async () => {
        const devtypeBVault = await ethers.getContractFactory("typeBVault");

        typeBVault = await devtypeBVault.deploy();

        let code = await deployer.provider.getCode(typeBVault.address);
        expect(code).to.not.eq("0x");
    })
    
    it("create EventLog", async () => {
        const EventLog = await ethers.getContractFactory("EventLog");
        let EventLogDeployed = await EventLog.deploy();
        let tx = await EventLogDeployed.deployed();
        eventLogAddress = EventLogDeployed.address;
    })

    describe("typeBVaultFactory", async () => {
        it("setLogic call from not admin", async () => {
            await expect(
                vaultBFactory.connect(user1).setLogic(typeBVault.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        })
        it("setLogic call from admin", async () => {
            await vaultBFactory.connect(deployer).setLogic(typeBVault.address)

            expect(await vaultBFactory.vaultLogic()).to.be.eq(typeBVault.address);
        })

        it("setUpgradeAdmin call from not admin", async function () {
            await expect(
                vaultBFactory.connect(user1).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setUpgradeAdmin call from admin", async function () {
            await vaultBFactory.connect(deployer).setUpgradeAdmin(proxyAdmin.address);
            expect(await vaultBFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("setLogEventAddress call from not admin", async function () {
            await expect(
                vaultBFactory.connect(user1).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setLogEventAddress call from admin", async function () {
            await vaultBFactory.connect(deployer).setLogEventAddress(eventLogAddress);
            expect(await vaultBFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("create typeBVaultProxy by deployer", async function() {
            let prevTotalCreatedContracts = await vaultBFactory.totalCreatedContracts();
    
            await vaultBFactory.connect(deployer).createTypeB(
                "ABC",
                erc20.address,
                person1.address
            )
    
            let afterTotalCreatedContracts = await vaultBFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await vaultBFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            typeBVaultinfo[0] = info;
            expect(info.name).to.be.equal("ABC");
    
            typeBVaultProxy = await ethers.getContractAt("typeBVaultProxy", info.contractAddress);
            expect(await typeBVaultProxy.isAdmin(deployer.address)).to.be.equal(false);
            expect(await typeBVaultProxy.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await typeBVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await typeBVaultProxy.isAdmin(person1.address)).to.be.equal(true);
            expect(await typeBVaultProxy.isProxyAdmin(person1.address)).to.be.eq(false);
            typeBVaultLogic = await ethers.getContractAt("typeBVault", info.contractAddress);
        });

        it("lastestCreated call from anybody", async () => {
            let info = await vaultBFactory.connect(person5).lastestCreated();
            expect(info.contractAddress).to.be.equal(typeBVaultinfo[0].contractAddress);
        })

        it("create typeBVaultProxy by anyone", async function() {
            let prevTotalCreatedContracts = await vaultBFactory.totalCreatedContracts();
    
            await vaultBFactory.connect(person5).createTypeB(
                "ABCD",
                erc20.address,
                person5.address
            )
    
            let afterTotalCreatedContracts = await vaultBFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await vaultBFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            typeBVaultinfo[1] = info;
            expect(info.name).to.be.equal("ABCD");
    
            typeBVaultProxy2 = await ethers.getContractAt("typeBVaultProxy", info.contractAddress);
            expect(await typeBVaultProxy2.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await typeBVaultProxy2.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await typeBVaultProxy2.isAdmin(person5.address)).to.be.equal(true);
            expect(await typeBVaultProxy2.isProxyAdmin(person5.address)).to.be.eq(false);
            typeBVaultLogic2 = await ethers.getContractAt("typeBVault", info.contractAddress);
        });
    })

    describe("typeB test", () => {
        it("check name, mock ", async function() {
            expect(await typeBVaultLogic.name()).to.equal("ABC");
            expect(await typeBVaultLogic.token()).to.equal(erc20.address);
        });

        it("transfer token", async function () {
            expect(await erc20.balanceOf(typeBVaultLogic.address)).to.be.equal(0);
    
            await erc20.connect(deployer).transfer(typeBVaultLogic.address,totalAmount)
    
            expect(await erc20.balanceOf(typeBVaultLogic.address)).to.be.equal(totalAmount);
        })
        
        it("claim call not owner", async () => {
            await expect(typeBVaultLogic.connect(person2).claim(
                person1.address,
                claim1
            )).to.be.revertedWith("Accessible: Caller is not an admin");
        })

        it("claim call owner", async () => {
            expect(await erc20.balanceOf(person1.address)).to.be.equal(0);

            await typeBVaultLogic.connect(person1).claim(
                person1.address,
                claim1
            )
            
            expect(await erc20.balanceOf(person1.address)).to.be.equal(claim1);
        })

        it("all claim", async () => {
            await typeBVaultLogic.connect(person1).claim(
                person1.address,
                claim7
            )

            expect(await erc20.balanceOf(person1.address)).to.be.equal(totalAmount);
        })

        it("exceed claim", async () => {
            await expect(typeBVaultLogic.connect(person1).claim(
                person1.address,
                claim1
            )).to.be.revertedWith("Vault: insufficent");
        })
    })

})