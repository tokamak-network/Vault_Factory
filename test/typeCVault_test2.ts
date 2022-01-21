import { expect } from "chai";
const { ethers, network } = require('hardhat')

const {
    BigNumber,
    FixedFormat,
    FixedNumber,
    formatFixed,
    parseFixed
} = require("@ethersproject/bignumber");

describe("typeCVault", () => {
    // 5,000,000 개 판매, 클레임 간격 = 5 mins(클레임 간격 필요없음 테스트 후 수정하자), 
    // 클레임 횟수 = 6
    // 클레임 시간 = [5분후,8분후,15분후,20분후,23분후,30분후]
    // 클레임 양 = [1,000,000, 300,000, 700,000, 1,000,000, 500,000, 1,500,000]
    const BASE_TEN = 10
    const decimals = 18

    let supplyAmount = 100000000
    const initialSupply = BigNumber.from(supplyAmount).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let account1 : any;
    let account2 : any;
    let account3 : any; 
    let account4 : any;
    let tokenOwner : any;
    let vaultOwner : any;
    let token, mockToken : any;
    let prov;

    let totalAmount2 = 5000000      //5,000,000
    const totalAmount = BigNumber.from(totalAmount2).mul(BigNumber.from(BASE_TEN).pow(decimals))
    let typeCVaultContract : any;

    let claim1Amount = 1000000      //1,000,000
    let claim2Amount = 300000       //300,000
    let claim3Amount = 700000       //700,000
    let claim4Amount = 1000000      //1,000,000
    let claim5Amount = 500000       //500,000
    let claim6Amount = 1500000      //1,500,000
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

    let totalClaim = 6

    let periodTimesPerClaim = 60 * 5; // 5 mins

    let firstClaimTime : any;
    let startTime : any;

    let provider : any;

    before(async () => {
        [ tokenOwner, vaultOwner, account1, account2, account3, account4 ] = await ethers.getSigners();
        token = await ethers.getContractFactory("ERC20Mock");
        prov = ethers.getDefaultProvider();

        mockToken = await token.deploy("MockToken", "Mock");

        const typeCVault = await ethers.getContractFactory("typeCVault");
        typeCVaultContract = await typeCVault.deploy("setVault",mockToken.address,vaultOwner.address);
        typeCVaultContract.connect(vaultOwner).deployed();
        
        provider = ethers.provider;

        await mockToken.transfer(typeCVaultContract.address, totalAmount)
        // console.log(Number((await docToken.balanceOf(lpStakingVault.address)/BigNumber.from(BASE_TEN).pow(18))))
    })

    describe("typeCVault test", () => {
        describe("setting", () => {
            it("check name, mock ", async function() {
                expect(await typeCVaultContract.name()).to.equal("setVault");
                expect(await typeCVaultContract.token()).to.equal(mockToken.address);
            });
    
            it("check the onlyOwner", async () => {
                let curBlock = await ethers.provider.getBlock();
                claim1Time = curBlock.timestamp + (60*5);
                claim2Time = curBlock.timestamp + (60*8);
                claim3Time = curBlock.timestamp + (60*15);
                claim4Time = curBlock.timestamp + (60*20);
                claim5Time = curBlock.timestamp + (60*23);
                claim6Time = curBlock.timestamp + (60*30);
    
                await expect(typeCVaultContract.connect(account1).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                )).to.be.revertedWith("Accessible: Caller is not an admin");
    
                await expect(typeCVaultContract.connect(account1).claim(
                    account1.address
                )).to.be.revertedWith("Accessible: Caller is not an admin");
            })
    
            it("initialize", async () => {
                let curBlock = await ethers.provider.getBlock();
                claim1Time = curBlock.timestamp + (60*5);
                claim2Time = curBlock.timestamp + (60*8);
                claim3Time = curBlock.timestamp + (60*15);
                claim4Time = curBlock.timestamp + (60*20);
                claim5Time = curBlock.timestamp + (60*23);
                claim6Time = curBlock.timestamp + (60*30);

                await typeCVaultContract.connect(vaultOwner).initialize(
                    totalAmount,
                    totalClaim,
                    [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
                    [claim1,claim2,claim3,claim4,claim5,claim6]
                );

                expect(await typeCVaultContract.totalAllocatedAmount()).to.equal(totalAmount);
                expect(await typeCVaultContract.totalClaimCounts()).to.equal(totalClaim);

                let tx = await typeCVaultContract.claimTimes(0);
                expect(tx).to.equal(claim1Time)
                
                let tx2 = await typeCVaultContract.claimAmounts(0);
                expect(tx2).to.equal(claim1)

                let tx3 = await typeCVaultContract.claimAmounts(5);
                expect(tx3).to.equal(claim6)

            })

        })
        describe("claim", () => {
            it("claim before time", async () => {
                await expect(typeCVaultContract.connect(vaultOwner).claim(
                    account1.address
                )).to.be.revertedWith("Vault: not started yet");
            })

            it("claim for round1", async () => {
                expect(await mockToken.balanceOf(account2.address)).to.equal(0);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultContract.currentRound()
                expect(round).to.equal(1);
                
                await typeCVaultContract.connect(vaultOwner).claim(
                    account2.address
                );

                let tx = await mockToken.balanceOf(account2.address)
                // console.log(Number(tx))
                // console.log(claim1)
                expect(await mockToken.balanceOf(account2.address)).to.equal(claim1);
            })

            it("claim for round2", async () => {
                expect(await mockToken.balanceOf(account2.address)).to.equal(claim1);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultContract.currentRound()
                expect(round).to.equal(2);
                
                await typeCVaultContract.connect(vaultOwner).claim(
                    account2.address
                );

                let tx = await mockToken.balanceOf(account2.address)
                console.log(Number(tx))
                let tx2 = Number(claim1)
                let tx3 = Number(claim2)
                let tx4 = tx2+tx3
                console.log(tx4);
    
                expect(Number(tx)).to.equal(tx4);
            })

            it("claim for round4", async () => {
                let tx = await mockToken.balanceOf(account2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let tx2 = claim1A+claim2A
                expect(Number(tx)).to.equal(tx2);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim4Time]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultContract.currentRound()
                expect(round).to.equal(4);
                
                await typeCVaultContract.connect(vaultOwner).claim(
                    account2.address
                );

                let claimAfter = await mockToken.balanceOf(account2.address)
                let claim3A = Number(claim3)
                let claim4A = Number(claim4)
                let claimAfterAmount = claim1A+claim2A+claim3A+claim4A
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount);
            })

            it("claim for round6", async () => {
                let tx = await mockToken.balanceOf(account2.address)
                let claim1A = Number(claim1)
                let claim2A = Number(claim2)
                let claim3A = Number(claim3)
                let claim4A = Number(claim4)
                let claimAfterAmount = claim1A+claim2A+claim3A+claim4A
                expect(Number(tx)).to.equal(claimAfterAmount);
    
                await ethers.provider.send('evm_setNextBlockTimestamp', [claim6Time+10]);
                await ethers.provider.send('evm_mine');

                let round = await typeCVaultContract.currentRound()
                expect(round).to.equal(6);
                
                await typeCVaultContract.connect(vaultOwner).claim(
                    account2.address
                );

                let claimAfter = await mockToken.balanceOf(account2.address)
                let claim5A = Number(claim5)
                let claim6A = Number(claim6)
                let claimAfterAmount2 = claim1A+claim2A+claim3A+claim4A+claim5A+claim6A
    
                expect(Number(claimAfter)).to.equal(claimAfterAmount2);
            })
        })
    })
})