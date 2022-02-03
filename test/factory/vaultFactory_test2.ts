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

    before(async function () {
        let accounts = await ethers.getSigners();
        [deployer, user1, person1, person2, person3, person4, person5, person6 ] = accounts
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
    });
    
    it("create typeCVault", async function() {
        let prevTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();

        await vaultCFactory.connect(deployer).createTypeC(
            "ABC",
            erc20.address,
            person1.address
        )

        let afterTotalCreatedContracts = await vaultCFactory.totalCreatedContracts();
        expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));

        let info = await vaultCFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
        // console.log("info.name :",info.name)
        expect(info.name).to.be.equal("ABC");

        typeCVault = await ethers.getContractAt("typeCVault", info.contractAddress);
        expect(await typeCVault.isAdmin(deployer.address)).to.be.equal(false);
        expect(await typeCVault.isAdmin(person1.address)).to.be.equal(true);
    });

    describe("typeC test", () => {
        it("check name, mock ", async function() {
            expect(await typeCVault.name()).to.equal("ABC");
            expect(await typeCVault.token()).to.equal(erc20.address);
        });

        it("check the onlyOwner", async () => {
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);

            await expect(typeCVault.connect(person2).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("Accessible: Caller is not an admin");

            await expect(typeCVault.connect(person2).claim(
                person2.address
            )).to.be.revertedWith("AccessiblePlusCommon: Caller is not a claimer");
        })

        it("check the initialize before input token", async ()  => {
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);

            await expect(typeCVault.connect(person1).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("need to input the token");
        })

        it("check the initialize after input token", async ()  => {
            await erc20.connect(deployer).transfer(typeCVault.address,totalAmount)
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);

            await typeCVault.connect(person1).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            );

            expect(await typeCVault.totalAllocatedAmount()).to.equal(totalAmount);
            expect(await typeCVault.totalClaimCounts()).to.equal(totalClaim);

            let tx = await typeCVault.claimTimes(0);
            expect(tx).to.equal(claim1Time)
            
            let tx2 = await typeCVault.claimAmounts(0);
            expect(tx2).to.equal(claim1)

            let tx3 = await typeCVault.claimAmounts(2);
            expect(tx3).to.equal(claim3)

            let tx4 = await typeCVault.claimAmounts(5);
            expect(tx4).to.equal(claim6)
        })

        it("not claimer claim test", async () => {
            await expect(typeCVault.connect(person2).claim(
                person2.address
            )).to.be.revertedWith("AccessiblePlusCommon: Caller is not a claimer");
        })

        it("claimer claim test befroe startTime", async () => {
            await expect(typeCVault.connect(person1).claim(
                person1.address
            )).to.be.revertedWith("Vault: not started yet");
        })
    })
})