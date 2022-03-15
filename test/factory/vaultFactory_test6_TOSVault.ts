import { expect } from "chai";
const { ethers, network } = require('hardhat')
const LockTOSdivided_ABI = require('../../abis/LockTOSdivided_ABI.json');
const LockTOS_ABI = require('../../abis/LockTOS_ABI.json');
const TOS_ABI = require('../../abis/TOS_ABI.json');

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
    let TOSVault2 : any;
    let dividedPool : any;
    let dividedPool2 : any;
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
    let erc20_1 : any;
    let proxyAdmin : any;

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

    let tosVaultinfo = [
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
        [deployer, user1, person1, person2, person3, person4, person5, person6, dividedPool2, proxyAdmin ] = accounts
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
    
        it("connect lockTOS dividedPoolProxy Contract (rinkeby) ", async () => {
            dividedPool = new ethers.Contract( lockTOSdividedProxy, LockTOSdivided_ABI, ethers.provider );
            // console.log("dividedPool.address : ", dividedPool.address);
        })
    
        it("connect lockTOSProxy contract (rinkeby) ", async () => {
            lockTOSContract = new ethers.Contract( lockTOSProxy, LockTOS_ABI, ethers.provider );
            // console.log("lockTOSContract.address : ", lockTOSContract.address);
        })
    
        it("connect TOS contract (rinkeby) ", async () => {
            tosContract = new ethers.Contract( TOSAddress, TOS_ABI, ethers.provider );
            // console.log("tosContract.address : ", tosContract.address);
        })
    
        it("deploy TOSVaultFactory ", async function() {
            const VaultFactory = await ethers.getContractFactory("TOSVaultFactory");
            // console.log("person1.address : ",person1.address)
            
            // TOSVaultFactory = await VaultFactory.connect(deployer).deploy(
            //     person1.address,
            //     dividedPool.address
            // );

            TOSVaultFactory = await VaultFactory.connect(deployer).deploy();

            let code = await deployer.provider.getCode(TOSVaultFactory.address);
            expect(code).to.not.eq("0x");
            expect(await TOSVaultFactory.isAdmin(deployer.address)).to.be.equal(true);
        });

        it("deploy TOSVault", async () => {
            const devTOSVault = await ethers.getContractFactory("TOSVault");

            TOSVault = await devTOSVault.deploy();

            let code = await deployer.provider.getCode(TOSVault.address);
            expect(code).to.not.eq("0x");
        });
            
        // it("check the tos balance", async () => {
        //     let tx = await tosContract.balanceOf(person1.address);
        //     console.log("person1 tosBalance",tx);
        // })
    })

    describe("vaultFactory", async () => {
        it("setLogic call from not admin", async () => {
            await expect(
                TOSVaultFactory.connect(user1).setLogic(TOSVault.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        })
        it("setLogic call from admin", async () => {
            await TOSVaultFactory.connect(deployer).setLogic(TOSVault.address)

            expect(await TOSVaultFactory.vaultLogic()).to.be.eq(TOSVault.address);
        })

        it("setUpgradeAdmin call from not admin", async function () {
            await expect(
                TOSVaultFactory.connect(user1).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setUpgradeAdmin call from admin", async function () {
            await TOSVaultFactory.connect(deployer).setUpgradeAdmin(proxyAdmin.address);
            expect(await TOSVaultFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("setinfo call from not admin", async function () {
            await expect(
                TOSVaultFactory.connect(user1).setinfo(dividedPool.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("setinfo call from admin", async function () {
            await TOSVaultFactory.connect(deployer).setinfo(dividedPool.address);
            expect(await TOSVaultFactory.dividedPoolProxy()).to.be.eq(dividedPool.address);
        });

        it("create TOSVaultProxy by deployer", async function() {
            let prevTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();
    
            await TOSVaultFactory.connect(deployer).create(
                "ABC",
                erc20.address,
                person2.address
            )
    
            let afterTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await TOSVaultFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            tosVaultinfo[0] = info;
            expect(info.name).to.be.equal("ABC");
    
            TOSVault = await ethers.getContractAt("TOSVaultProxy", info.contractAddress);
            expect(await TOSVault.isAdmin(deployer.address)).to.be.equal(false);
            expect(await TOSVault.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await TOSVault.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await TOSVault.isAdmin(person2.address)).to.be.equal(true);
            expect(await TOSVault.isProxyAdmin(person2.address)).to.be.eq(false);
            expect(await TOSVault.dividiedPool()).to.be.equal(dividedPool.address);
        });

        it("lastestCreated call from anybody", async () => {
            let info = await TOSVaultFactory.connect(person5).lastestCreated();
            expect(info.contractAddress).to.be.equal(tosVaultinfo[0].contractAddress);
        })

        it("create TOSVaultProxy by anyone", async function() {
            let prevTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();
    
            await TOSVaultFactory.connect(person5).create(
                "ABCD",
                erc20.address,
                person5.address
            )
    
            let afterTotalCreatedContracts = await TOSVaultFactory.totalCreatedContracts();
            expect(afterTotalCreatedContracts).to.be.equal(prevTotalCreatedContracts.add(1));
    
            let info = await TOSVaultFactory.connect(deployer).getContracts(prevTotalCreatedContracts);
            // console.log("info.name :",info.name)
            tosVaultinfo[1] = info;
            expect(info.name).to.be.equal("ABCD");
    
            TOSVault2 = await ethers.getContractAt("TOSVaultProxy", info.contractAddress);
            expect(await TOSVault2.isAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await TOSVault2.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await TOSVault2.isAdmin(person5.address)).to.be.equal(true);
            expect(await TOSVault2.isProxyAdmin(person5.address)).to.be.eq(false);
            expect(await TOSVault2.dividiedPool()).to.be.equal(dividedPool.address);
        });
    })



    // describe("TOSVault test", async () => {
    //     it("check name, mock ", async function() {
    //         expect(await TOSVault.name()).to.equal("ABC");
    //         expect(await TOSVault.token()).to.equal(erc20.address);
    //     });

    //     // it("check token, dividedPool address", async () => {
    //     //     console.log(await TOSVault.token()) 
    //     //     console.log(await TOSVault.dividiedPool()) 
    //     // });

    //     it("check the initialize before input token", async ()  => {
    //         let curBlock = await ethers.provider.getBlock();
    //         claim1Time = curBlock.timestamp + (60*5);
    //         claim2Time = curBlock.timestamp + (60*8);
    //         claim3Time = curBlock.timestamp + (60*15);
    //         claim4Time = curBlock.timestamp + (60*20);
    //         claim5Time = curBlock.timestamp + (60*23);
    //         claim6Time = curBlock.timestamp + (60*30);
            
    //         await expect(TOSVault.connect(person1).initialize(
    //             totalAmount,
    //             totalClaim,
    //             [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
    //             [claim1,claim2,claim3,claim4,claim5,claim6]
    //         )).to.be.revertedWith("need to input the token");
    //     })
        
    //     it("initialize check the onlyOwner", async () => {
    //         await erc20.connect(deployer).transfer(TOSVault.address,totalAmount)

    //         let curBlock = await ethers.provider.getBlock();
    //         claim1Time = curBlock.timestamp + (60*5);
    //         claim2Time = curBlock.timestamp + (60*8);
    //         claim3Time = curBlock.timestamp + (60*15);
    //         claim4Time = curBlock.timestamp + (60*20);
    //         claim5Time = curBlock.timestamp + (60*23);
    //         claim6Time = curBlock.timestamp + (60*30);
            
    //         await expect(TOSVault.connect(person5).initialize(
    //             totalAmount,
    //             totalClaim,
    //             [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
    //             [claim1,claim2,claim3,claim4,claim5,claim6]
    //         )).to.be.revertedWith("Accessible: Caller is not an admin");
    //     })

    //     it("check the withdraw call from not owner", async () => {
    //         await expect(TOSVault.connect(person5).withdraw(
    //             person5.address,
    //             totalAmount
    //         )).to.be.revertedWith("Accessible: Caller is not an admin")
    //     })

    //     it("check the withdraw call from owner", async () => {
    //         let tx = await erc20.balanceOf(person2.address);
    //         expect(tx).to.be.equal(0);

    //         await TOSVault.connect(person2).withdraw(
    //             person2.address,
    //             totalAmount
    //         )

    //         let tx2 = await erc20.balanceOf(person2.address);
    //         expect(tx2).to.be.equal(totalAmount);

    //         await erc20.connect(person2).transfer(TOSVault.address,totalAmount)
    //     })

    //     it("check the changeToken call from not owner", async () => {
    //         await expect(TOSVault.connect(person5).changeToken(
    //             erc20_1.address
    //         )).to.be.revertedWith("Accessible: Caller is not an admin")
    //     })

    //     it("check the changeToken call from owner", async () => {
    //         let tx = await TOSVault.token();
    //         expect(tx).to.be.equal(erc20.address)
    //         await TOSVault.connect(person2).changeToken(
    //             erc20_1.address
    //         )
    //         let tx2 = await TOSVault.token();
    //         expect(tx2).to.be.equal(erc20_1.address)

    //         await TOSVault.connect(person2).changeToken(
    //             erc20.address
    //         )
    //     })

    //     it("check the initialize after input token", async ()  => {
    //         let curBlock = await ethers.provider.getBlock();
    //         claim1Time = curBlock.timestamp + (60*5);
    //         claim2Time = curBlock.timestamp + (60*8);
    //         claim3Time = curBlock.timestamp + (60*15);
    //         claim4Time = curBlock.timestamp + (60*20);
    //         claim5Time = curBlock.timestamp + (60*23);
    //         claim6Time = curBlock.timestamp + (60*30);

    //         await TOSVault.connect(person2).initialize(
    //             totalAmount,
    //             totalClaim,
    //             [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
    //             [claim1,claim2,claim3,claim4,claim5,claim6]
    //         );

    //         expect(await TOSVault.totalAllocatedAmount()).to.equal(totalAmount);
    //         expect(await TOSVault.totalClaimCounts()).to.equal(totalClaim);

    //         let tx = await TOSVault.claimTimes(0);
    //         expect(tx).to.equal(claim1Time)
            
    //         let tx2 = await TOSVault.claimAmounts(0);
    //         expect(tx2).to.equal(claim1)

    //         let tx3 = await TOSVault.claimAmounts(3);
    //         expect(tx3).to.equal(claim4)

    //         let tx4 = await TOSVault.claimAmounts(5);
    //         expect(tx4).to.equal(claim6)
    //     })

    //     it("check the withdraw after setting", async () => {
    //         await expect(TOSVault.connect(person2).withdraw(
    //             person2.address,
    //             totalAmount
    //         )).to.be.revertedWith("Accessible: Caller is not an admin")
    //     })

    //     it("check the changeToken after setting", async () => {
    //         await expect(TOSVault.connect(person2).changeToken(
    //             erc20_1.address
    //         )).to.be.revertedWith("Accessible: Caller is not an admin")
    //     })

    //     it("check the initialize after setting", async () => {
    //         await expect(TOSVault.connect(person2).initialize(
    //             totalAmount,
    //             totalClaim,
    //             [claim1Time,claim2Time,claim3Time,claim4Time,claim5Time,claim6Time],
    //             [claim1,claim2,claim3,claim4,claim5,claim6]
    //         )).to.be.revertedWith("Accessible: Caller is not an admin")
    //     })

    //     it("claim call before startTime", async () => {
    //         await expect(TOSVault.connect(person1).claim()).to.be.revertedWith("Vault: not started yet");
    //     })

    //     it("need the approve", async () => {
    //         expect(await erc20.allowance(TOSVault.address,dividedPool.address)).to.equal(0);
    //         // let tx = await erc20.allowance(TOSVault.address,dividedPool.address)
    //         // console.log("allowance1 :", tx)
    //         await TOSVault.approve();      
    //         // let tx2 = await erc20.allowance(TOSVault.address,dividedPool.address)
    //         // console.log("allowance2 :", tx2)      
    //         expect(await erc20.allowance(TOSVault.address,dividedPool.address)).to.equal(totalAmount);
    //     })

    //     it("check claimable amount is 0", async () => {
    //         let tx  = await dividedPool.claimable(stakingAccount,erc20.address);
    //         // console.log(tx)
    //         expect(tx).to.be.equal(0)
    //     }).timeout(1000000)

    //     it("anyone can call claim", async () => {
    //         expect(await erc20.balanceOf(dividedPool.address)).to.equal(0);
    
    //         await ethers.provider.send('evm_setNextBlockTimestamp', [claim1Time]);
    //         await ethers.provider.send('evm_mine');

    //         let round = await TOSVault.currentRound()
    //         expect(round).to.equal(1);
    //         let calculClaimAmount = await TOSVault.calculClaimAmount(1)
    //         expect(calculClaimAmount).to.be.equal(claim1);
            
    //         await TOSVault.connect(person1).claim();

    //         expect(await erc20.balanceOf(dividedPool.address)).to.equal(claim1);
    //     })

        
    //     it("dividedPool added storage erc20.address", async () => {
    //         // let address6 = await dividedPool.distributedTokens(9);
    //         // expect(address6).to.be.equal(erc20.address);
        
    //         let tx2 = await dividedPool.distributions(erc20.address)
    //         // console.log(tx2);
    //         expect(tx2.exists).to.be.equal(true);
    //     })
            
            
    //     it("anyone can call claim2", async () => {
    //         expect(await erc20.balanceOf(dividedPool.address)).to.equal(claim1);
        
    //         await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time]);
    //         await ethers.provider.send('evm_mine');
        
    //         let round = await TOSVault.currentRound()
    //         expect(round).to.equal(2);
    //         let calculClaimAmount = await TOSVault.calculClaimAmount(2)
    //         expect(calculClaimAmount).to.be.equal(claim2);
        
    //         await TOSVault.connect(person2).claim();
            
        
    //         let tx = await erc20.balanceOf(dividedPool.address)
    //         let tx2 = Number(claim1)
    //         let tx3 = Number(claim2)
    //         let tx4 = tx2+tx3
        
    //         expect(Number(tx)).to.equal(tx4);
    //     })
                
    //     it("need to duration for check the claimable", async () => {
    //         await ethers.provider.send('evm_setNextBlockTimestamp', [claim2Time + (86400*10)]);
    //         await ethers.provider.send('evm_mine');
        
    //         // await dividedPool.connect(person1).claimBatch([erc20.address]);
    //         // expect(await erc20.balanceOf(dividedPool.address)).to.equal(0);
    //     })  
                        
    //     it("check claimable amount is above 0 ", async () => {
    //         let tx  = await dividedPool.claimable(stakingAccount,erc20.address);
    //         // console.log(tx)
    //         expect(tx).to.be.above(0);
    //     }).timeout(1000000)

    //     it("anyone can call claim6", async () => {
    //         let tx = await erc20.balanceOf(dividedPool.address)
    //         let claim1A = Number(claim1)
    //         let claim2A = Number(claim2)
    //         let tx2 = claim1A+claim2A
    //         expect(Number(tx)).to.equal(tx2);

    //         // await ethers.provider.send('evm_setNextBlockTimestamp', [claim6Time+10]);
    //         // await ethers.provider.send('evm_mine');

    //         let round = await TOSVault.currentRound()
    //         expect(round).to.equal(6);
            
    //         await TOSVault.connect(person3).claim();

    //         let claimAfter = await erc20.balanceOf(dividedPool.address)
    //         let claim3A = Number(claim3)
    //         let claim4A = Number(claim4)
    //         let claim5A = Number(claim5)
    //         let claim6A = Number(claim6)
    //         let claimAfterAmount2 = claim1A+claim2A+claim3A+claim4A+claim5A+claim6A

    //         expect(Number(claimAfter)).to.equal(claimAfterAmount2);
    //     })
    // })

})