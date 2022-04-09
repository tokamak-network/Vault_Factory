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

    let lpfistClaim2 = 3000000      //3,000,000
    const lpfistClaim = BigNumber.from(lpfistClaim2).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let monthReward = 400000        //400,000
    const monthBigReward = BigNumber.from(monthReward).mul(BigNumber.from(BASE_TEN).pow(decimals))

    let periodTimesPerClaim = 60 * 10; // 5 mins

    let firstClaimTime : any;
    let startTime : any;

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
    
    it("create typeAVault", async function() {
        let prevTotalCreatedContracts = await vaultAFactory.totalCreatedContracts();

        await vaultAFactory.connect(deployer).createTypeA(
            "ABC",
            erc20.address,
            person1.address
        )

        let afterTotalCreatedContracts = await vaultAFactory.totalCreatedContracts();
        expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));

        let info = await vaultAFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
        // console.log("info.name :",info.name)
        expect(info.name).to.be.equal("ABC");

        typeAVault = await ethers.getContractAt("typeAVault", info.contractAddress);
        expect(await typeAVault.isAdmin(deployer.address)).to.be.equal(false);
        expect(await typeAVault.isAdmin(person1.address)).to.be.equal(true);
    });

    describe("typeA test", () => {
        describe("setting", () => {
            it("check name, mock ", async function() {
                expect(await typeAVault.name()).to.equal("ABC");
                expect(await typeAVault.token()).to.equal(erc20.address);
            });

            it("initialize call not Owner", async () => {
                let curBlock = await ethers.provider.getBlock();
                firstClaimTime = curBlock.timestamp + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(typeAVault.connect(person2).initialize(
                    [totalAmount,totalClaim,startTime,periodTimesPerClaim],
                    [lpfistClaim,firstClaimTime],
                    true
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })

            it("claim is call not claimer", async () => {
                await expect(typeAVault.connect(person1).claim(
                    person1.address
                )).to.be.revertedWith("AccessiblePlusCommon: Caller is not a claimer");
            })

            it("initialize call Owner before transfer token", async () => {
                let curBlock = await ethers.provider.getBlock();
                firstClaimTime = curBlock.timestamp + 1000;
                startTime = firstClaimTime + 100;
    
                await expect(typeAVault.connect(person1).initialize(
                    [totalAmount,totalClaim,startTime,periodTimesPerClaim],
                    [lpfistClaim,firstClaimTime],
                    true
                )).to.be.revertedWith("need to input the token");
            })

            it("initialize call Owner after transfer token", async () => {
                await erc20.connect(deployer).transfer(typeAVault.address,totalAmount)
                let curBlock = await ethers.provider.getBlock();
                firstClaimTime = curBlock.timestamp + 1000;
                startTime = firstClaimTime + 100;
    
                await typeAVault.connect(person1).initialize(
                    [totalAmount,totalClaim,startTime,periodTimesPerClaim],
                    [lpfistClaim,firstClaimTime],
                    true
                )
        
                expect(await typeAVault.totalAllocatedAmount()).to.equal(totalAmount);
                expect(await typeAVault.totalClaimCounts()).to.equal(totalClaim);
                expect(await typeAVault.startTime()).to.equal(startTime);
                expect(await typeAVault.claimPeriodTimes()).to.equal(periodTimesPerClaim);
                expect(await typeAVault.firstClaimAmount()).to.equal(lpfistClaim);
                expect(await typeAVault.firstClaimTime()).to.equal(firstClaimTime);
            })

            it("once initialize, don't change the setting", async () => {
                await expect(typeAVault.connect(person1).initialize(
                    [totalAmount,totalClaim,startTime,periodTimesPerClaim],
                    [lpfistClaim,firstClaimTime],
                    true
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
        })

        describe("claim test", () => {
            it("claim before time", async () => {
                await expect(typeAVault.connect(person1).claim(
                    person1.address
                )).to.be.revertedWith("Vault: not started yet");
            })
    
            it("claim after firstClaimtime but not claimer", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [firstClaimTime]);
                await ethers.provider.send('evm_mine');

                await expect(typeAVault.connect(person2).claim(
                    person2.address
                )).to.be.revertedWith("AccessiblePlusCommon: Caller is not a claimer");    
            })

            it("claim after firstClaimtime claimer done", async () => {
                expect(await erc20.balanceOf(person1.address)).to.equal(0);

                await typeAVault.connect(person1).claim(
                    person1.address
                )

                expect(await erc20.balanceOf(person1.address)).to.equal(lpfistClaim);
            })

            it("claim after startTime", async () => {
                expect(await erc20.balanceOf(person2.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime]);
                await ethers.provider.send('evm_mine');
                
                await typeAVault.connect(person1).claim(
                    person2.address
                );   
                expect(await erc20.balanceOf(person2.address)).to.equal(monthBigReward);
            })

            it("claim after 1month", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + periodTimesPerClaim]);
                await ethers.provider.send('evm_mine');
                
                await typeAVault.connect(person1).claim(
                    person2.address
                );

                let tx = await erc20.balanceOf(person2.address)

                expect(Number(tx)).to.equal(Number(monthBigReward*2));
            })

            it("claim after 5month", async () => {    
                await ethers.provider.send('evm_setNextBlockTimestamp', [startTime + (periodTimesPerClaim*5)]);
                await ethers.provider.send('evm_mine');
                
                await typeAVault.connect(person1).claim(
                    person2.address
                );

                let tx = await erc20.balanceOf(person2.address)
    
                expect(Number(tx)).to.equal(Number(monthBigReward*5));
            })
        })
    })
})