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
    let TOSVault : any;
    let dividedPool : any;
    let vaultAFactory : any;
    let vaultBFactory : any;
    let vaultCFactory : any;
    let TOSVaultFactory : any;
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

    let claim1Time : any;
    let claim2Time : any;
    let claim3Time : any;
    let claim4Time : any;
    let claim5Time : any;
    let claim6Time : any;

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

    it("deploy dividedPool", async function() {
        const VaultFactory = await ethers.getContractFactory("TypeAVaultFactory");
    
        dividedPool = await VaultFactory.connect(deployer).deploy();
    
        let code = await deployer.provider.getCode(dividedPool.address);
        expect(code).to.not.eq("0x");
    });

    it("deploy TOSVaultFactory ", async function() {
        const VaultFactory = await ethers.getContractFactory("TOSVaultFactory");
    
        TOSVaultFactory = await VaultFactory.connect(deployer).deploy(
            person1.address,
            dividedPool.address
        );
    
        let code = await deployer.provider.getCode(TOSVaultFactory.address);
        expect(code).to.not.eq("0x");
    });
    
    it("create TOSVault", async function() {
        let prevTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();

        await TOSVaultFactory.connect(deployer).create(
            "ABC",
            erc20.address,
            person1.address
        )

        let afterTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();
        expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));

        let info = await TOSVaultFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
        console.log("info.name :",info.name)
        expect(info.name).to.be.equal("ABC");

        TOSVault = await ethers.getContractAt("TOSVault", info.contractAddress);
        expect(await TOSVault.isAdmin(deployer.address)).to.be.equal(false);
        expect(await TOSVault.isAdmin(person1.address)).to.be.equal(true);
    });

    
    describe("TOSVault test", () => {
        it("check name, mock ", async function() {
            expect(await TOSVault.name()).to.equal("ABC");
            expect(await TOSVault.token()).to.equal(erc20.address);
        });
        
        it("initialize check the onlyOwner", async () => {
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);
            
            await expect(TOSVault.connect(person2).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
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
            
            await expect(TOSVault.connect(person1).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            )).to.be.revertedWith("need to input the token");
        })

        it("check the initialize after input token", async ()  => {
            await erc20.connect(deployer).transfer(TOSVault.address,totalAmount)
            let curBlock = await ethers.provider.getBlock();
            claim1Time = curBlock.timestamp + (60*5);
            claim2Time = curBlock.timestamp + (60*8);
            claim3Time = curBlock.timestamp + (60*15);
            claim4Time = curBlock.timestamp + (60*20);
            claim5Time = curBlock.timestamp + (60*23);
            claim6Time = curBlock.timestamp + (60*30);

            await TOSVault.connect(person1).initialize(
                totalAmount,
                totalClaim,
                [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                [claim1,claim2,claim3,claim4,claim5,claim6]
            );

            expect(await TOSVault.totalAllocatedAmount()).to.equal(totalAmount);
            expect(await TOSVault.totalClaimCounts()).to.equal(totalClaim);

            let tx = await TOSVault.claimTimes(0);
            expect(tx).to.equal(claim1Time)
            
            let tx2 = await TOSVault.claimAmounts(0);
            expect(tx2).to.equal(claim1)

            let tx3 = await TOSVault.claimAmounts(3);
            expect(tx3).to.equal(claim4)

            let tx4 = await TOSVault.claimAmounts(5);
            expect(tx4).to.equal(claim6)
        })

        it("claim call before startTime", async () => {
            await expect(TOSVault.connect(person1).claim()).to.be.revertedWith("Vault: not started yet");
        })

        it("anyone can call claim", async () => {
            expect(await erc20.balanceOf(dividedPool.address)).to.equal(0);
    
            await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time]);
            await ethers.provider.send('evm_mine');

            let round = await TOSVault.currentRound()
            expect(round).to.equal(1);
            
            await TOSVault.connect(person1).claim();

            expect(await erc20.balanceOf(dividedPool.address)).to.equal(claim1);
        })

        it("anyone can call claim2", async () => {
            expect(await erc20.balanceOf(dividedPool.address)).to.equal(claim1);
    
            await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time]);
            await ethers.provider.send('evm_mine');

            let round = await TOSVault.currentRound()
            expect(round).to.equal(2);
            
            await TOSVault.connect(person2).claim();

            let tx = await erc20.balanceOf(dividedPool.address)
            let tx2 = Number(claim1)
            let tx3 = Number(claim2)
            let tx4 = tx2+tx3

            expect(Number(tx)).to.equal(tx4);
        })

        it("anyone can call claim6", async () => {
            let tx = await erc20.balanceOf(dividedPool.address)
            let claim1A = Number(claim1)
            let claim2A = Number(claim2)
            let tx2 = claim1A+claim2A
            expect(Number(tx)).to.equal(tx2);

            await ethers.provider.send('evm_setNextBlockTimestamp', [claim6Time+10]);
            await ethers.provider.send('evm_mine');

            let round = await TOSVault.currentRound()
            expect(round).to.equal(6);
            
            await TOSVault.connect(person3).claim();

            let claimAfter = await erc20.balanceOf(dividedPool.address)
            let claim3A = Number(claim3)
            let claim4A = Number(claim4)
            let claim5A = Number(claim5)
            let claim6A = Number(claim6)
            let claimAfterAmount2 = claim1A+claim2A+claim3A+claim4A+claim5A+claim6A

            expect(Number(claimAfter)).to.equal(claimAfterAmount2);
        })
    })

})