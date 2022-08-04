const chai = require("chai");
const { solidity } = require("ethereum-waffle");
const { expect, assert } = chai;

chai.use(solidity);
require("chai").should();

const { ethers } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
} = require("web3-utils");

let TOSToken = require('../abis/TOS.json');
let ERC20AToken = require('../abis/ERC20A.json');

describe("VestingPublicFund", function () {

    let tokenA, vestingPublicFundFactory, vestingPublicFundLogic,  vestingPublicFund, vestingPublicFundProxy, provider;
    let tosToken , vaultAddress, testLogicAddress;
    let eventLogAddress;

    let info={
        token: null,
        dao: null,
        publicSaleVault: null,
        tokenAddress: null,
        daoAddress: null
    }

    let vaultInfo = {
        name: "test",
        contractAddress: null,
        allocateToken: null,
        admin : null,
        totalAllocatedAmount: null,
        claimCounts: ethers.BigNumber.from("3"),
        claimTimes: [],
        claimIntervalSeconds : 60*60*24,
        claimAmounts: [],
        totalClaimsAmount: ethers.BigNumber.from("0")
    }

    let tokenInfo = {
        name: "TON",
        symbol: "TON",
        totalSupply: ethers.utils.parseEther("1000000"),
        admin: null
    }

    before(async function () {
        accounts = await ethers.getSigners();
        [admin1, user1, user2, proxyAdmin, dao, publicSaleVault, receivedAddress, TONAdmin, proxyAdmin2  ] = accounts;
        provider = ethers.provider;
        info.daoAddress = dao.address;
        info.dao = dao;
        info.publicSaleVault = publicSaleVault;
        tokenInfo.admin = TONAdmin;
    });

    it("create tokenA", async function () {
        const ERC20TokenAContract = await ethers.getContractFactory(ERC20AToken.abi, ERC20AToken.bytecode);
        tokenA = await ERC20TokenAContract.deploy(
            tokenInfo.name,
            tokenInfo.symbol,
            tokenInfo.totalSupply,
            tokenInfo.admin.address);

        let tx = await tokenA.deployed();
        info.tokenAddress = tokenA.address;
        info.token = tokenA;
    });

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
    });

    it("create VestingPublicFundFactory ", async function () {
        const VestingPublicFundFactory = await ethers.getContractFactory("VestingPublicFundFactory");
        let VestingPublicFundFactoryDeployed = await VestingPublicFundFactory.deploy();
        let tx = await VestingPublicFundFactoryDeployed.deployed();

        vestingPublicFundFactory =  await ethers.getContractAt("VestingPublicFundFactory", VestingPublicFundFactoryDeployed.address);
        let code = await ethers.provider.getCode(vestingPublicFundFactory.address);
        expect(code).to.not.eq("0x");

    });

    describe("VestingPublicFundFactory   ", function () {

        it("0-1. setLogic : when not admin, fail ", async function () {

            await expect(
                vestingPublicFundFactory.connect(user2).setLogic(vestingPublicFundLogic)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-1. setLogic ", async function () {

            await vestingPublicFundFactory.connect(admin1).setLogic(vestingPublicFundLogic);

            expect(await vestingPublicFundFactory.vaultLogic()).to.be.eq(vestingPublicFundLogic);
        });

        it("0-2. setUpgradeAdmin : when not admin, fail ", async function () {

            await expect(
                vestingPublicFundFactory.connect(user2).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-2. setUpgradeAdmin ", async function () {

            await vestingPublicFundFactory.connect(admin1).setUpgradeAdmin(proxyAdmin.address);
            expect(await vestingPublicFundFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("0-3. setBaseInfo : when not admin, fail ", async function () {

            await expect(
                vestingPublicFundFactory.connect(user2).setBaseInfo([info.tokenAddress, info.daoAddress])
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-4. setLogEventAddress : when not admin, fail ", async function () {

            await expect(
                vestingPublicFundFactory.connect(user2).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("1-1. create : fail when it's not set receivedAddress ", async function () {

            await expect(
                vestingPublicFundFactory.create(
                    vaultInfo.name,
                    info.publicSaleVault.address,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("some address is zero");

        });

        it("1-1. create : fail when did'nt set token ", async function () {

            expect(await vestingPublicFundFactory.token()).to.be.eq(ethers.constants.AddressZero);
            await expect(
                vestingPublicFundFactory.create(
                    vaultInfo.name,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("some address is zero");
        });

        it("0-3. setBaseInfo ", async function () {

            await vestingPublicFundFactory.connect(admin1).setBaseInfo([info.tokenAddress, info.daoAddress]);
            expect(await vestingPublicFundFactory.token()).to.be.eq(info.tokenAddress);
            expect(await vestingPublicFundFactory.daoAddress()).to.be.eq(info.daoAddress);
        });

        it("0-4. setLogEventAddress   ", async function () {
            await vestingPublicFundFactory.connect(admin1).setLogEventAddress(eventLogAddress);
            expect(await vestingPublicFundFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("1-1 / 2-9. create : vestingPublicFundProxy ", async function () {

            let tx = await vestingPublicFundFactory.create(
                vaultInfo.name,
                info.publicSaleVault.address,
                receivedAddress.address
            );
            vaultInfo.admin = dao;

            const receipt = await tx.wait();
            let _function ="CreatedVestingPublicFund(address,string)";
            let interface = vestingPublicFundFactory.interface;

            for(let i=0; i< receipt.events.length; i++){
                if(receipt.events[i].topics[0] == interface.getEventTopic(_function)){
                    let data = receipt.events[i].data;
                    let topics = receipt.events[i].topics;
                    let log = interface.parseLog(
                    {  data,  topics } );
                    vaultAddress = log.args.contractAddress;
                    vaultInfo.contractAddress = vaultAddress;
                }
            }

            expect(await vestingPublicFundFactory.totalCreatedContracts()).to.be.eq(1);
            expect((await vestingPublicFundFactory.getContracts(0)).contractAddress).to.be.eq(vaultAddress);
            expect((await vestingPublicFundFactory.lastestCreated()).contractAddress).to.be.eq(vaultAddress);

            let VaultContract = await ethers.getContractAt("VestingPublicFundProxy", vaultAddress);
            vestingPublicFundProxy = VaultContract;

            vestingPublicFund = await ethers.getContractAt("VestingPublicFund", vaultAddress);

            expect(await VaultContract.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await VaultContract.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);

            expect(await VaultContract.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await VaultContract.isAdmin(proxyAdmin.address)).to.be.eq(true);

            expect(await vestingPublicFundFactory.token()).to.be.eq(await vestingPublicFundProxy.token());
            expect(receivedAddress.address).to.be.eq(await vestingPublicFundProxy.receivedAddress());
            expect(info.publicSaleVault.address).to.be.eq(await vestingPublicFundProxy.publicSaleVaultAddress());
        });
    });

    describe("VestingPublicFundProxy : Only Admin ", function () {

        it("2-1. addAdmin : when not proxy admin, fail", async function () {
            expect(await vestingPublicFundProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(user2).addAdmin(user2.address)
                ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. addAdmin : when user is admin, not ProxyAdmin, fail ", async function () {
            expect(await vestingPublicFundProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await vestingPublicFundProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).addAdmin(user2.address))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. addAdmin only ProxyAdmin ", async function () {
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await vestingPublicFundProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("2-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(vestingPublicFundProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-2. removeAdmin ", async function () {
            await vestingPublicFundProxy.connect(user2).removeAdmin();
        });

        it("2-3. transferAdmin : when not admin, fail ", async function () {
            await expect(
                vestingPublicFundProxy.connect(user2).transferAdmin(user1.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-3. transferAdmin ", async function () {
            await vestingPublicFundProxy.connect(proxyAdmin).addAdmin(user2.address);
            expect(await vestingPublicFundProxy.isAdmin(user2.address)).to.be.eq(true);
            await vestingPublicFundProxy.connect(user2).transferAdmin(user1.address);
        });

        it("2-4. setImplementation2 : when not proxy admin, fail", async function () {
            await expect(vestingPublicFundProxy.connect(vaultInfo.admin).setImplementation2(vestingPublicFundLogic,0, true))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-4/5. setImplementation2", async function () {

            let tx = await vestingPublicFundProxy.connect(proxyAdmin).setImplementation2(
                vestingPublicFundLogic, 0, true
            );

            await tx.wait();
        });

        it("2-5/6. setAliveImplementation2 : Only proxy admin ", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            expect(await vestingPublicFundProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await vestingPublicFundProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);

            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).setAliveImplementation2(
                    testLogicAddress, false
                )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-5/6/7/8. setAliveImplementation2", async function () {

            const TestLogic = await ethers.getContractFactory("TestLogic");
            let testLogicDeployed = await TestLogic.deploy();
            await testLogicDeployed.deployed();
            testLogicAddress = testLogicDeployed.address ;

            let _func1 = Web3EthAbi.encodeFunctionSignature("sayAdd(uint256,uint256)") ;
            let _func2 = Web3EthAbi.encodeFunctionSignature("sayMul(uint256,uint256)") ;

            let tx = await vestingPublicFundProxy.connect(proxyAdmin).setImplementation2(
                testLogicAddress, 1, true
            );

            await tx.wait();

            tx = await vestingPublicFundProxy.connect(proxyAdmin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress
            );

            await tx.wait();

            expect(await vestingPublicFundProxy.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await vestingPublicFundProxy.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await vestingPublicFundProxy.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", vestingPublicFundProxy.address);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await vestingPublicFundProxy.connect(proxyAdmin).setAliveImplementation2(
                testLogicAddress, false
            );

            await tx.wait();

            await expect(
                TestLogicContract.sayAdd(a, b)
            ).to.be.reverted ;

            await expect(
                TestLogicContract.sayMul(a, b)
            ).to.be.reverted ;

        });

        it("2-10. setBaseInfoProxy : when not proxy admin, fail", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(user2).setBaseInfoProxy(
                    vaultInfo.name,
                    info.tokenAddress,
                    info.dao.address,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-10. setBaseInfoProxy : only once executed ", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await expect(
                vestingPublicFundProxy.connect(proxyAdmin).setBaseInfoProxy(
                    vaultInfo.name,
                    info.tokenAddress,
                    info.dao.address,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("already set");
        });

        it("2-11. addProxyAdmin : when not proxy admin, fail", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).addProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-11. addProxyAdmin : only proxy admin ", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await vestingPublicFundProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

        });

        it("2-12. removeProxyAdmin : when not proxy admin, fail", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).removeProxyAdmin()
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-12. removeProxyAdmin ", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin2.address)).to.be.eq(true);
            await vestingPublicFundProxy.connect(proxyAdmin2).removeProxyAdmin();
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });

        it("2-13. transferProxyAdmin : when not proxy admin, fail", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                vestingPublicFundProxy.connect(vaultInfo.admin).transferProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-13. transferProxyAdmin ", async function () {

            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await vestingPublicFundProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);

            await vestingPublicFundProxy.connect(proxyAdmin).transferProxyAdmin(proxyAdmin2.address);
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(false);
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

            await vestingPublicFundProxy.connect(proxyAdmin2).transferProxyAdmin(proxyAdmin.address);
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await vestingPublicFundProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });


        it("2-14. setProxyPause : when not admin, fail", async function () {

            await expect(
                vestingPublicFundProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-14. setProxyPause ", async function () {

            await vestingPublicFundProxy.connect(vaultInfo.admin).setProxyPause(true);
            expect(await vestingPublicFundProxy.pauseProxy()).to.be.equal(true);

        });

        it("2-14. setProxyPause : can\'t exceute logic function ", async function () {

            await expect(
                vestingPublicFund.currentRound()
            ).to.be.revertedWith("Proxy: impl OR proxy is false");
        });

        it("2-14. setProxyPause   ", async function () {
            await vestingPublicFundProxy.connect(vaultInfo.admin).setProxyPause(false);
        });
    });

    describe("VestingPublicFundProxy : Can Anybody ", function () {

        it("2-14. fallback : can exceute logic function  ", async function () {
            await vestingPublicFund.currentRound();
        });

    });


    describe("VestingPublicFund :  only ProxyOwner ", function () {

        it("3-1. changeAddr : when not proxy admin, fail", async function () {
            expect(await vestingPublicFund.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFund.connect(user2).changeAddr(
                    info.tokenAddress,
                    receivedAddress.address,
                    info.publicSaleVault.address
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("3-1. changeAddr ", async function () {

            expect(await vestingPublicFund.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);

            await vestingPublicFund.connect(proxyAdmin).changeAddr(
                    info.tokenAddress,
                    receivedAddress.address,
                    receivedAddress.address
                );

            expect(await vestingPublicFund.token()).to.be.eq(info.tokenAddress);
            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);
            expect(await vestingPublicFund.publicSaleVaultAddress()).to.be.eq(receivedAddress.address);

            await vestingPublicFund.connect(proxyAdmin).changeAddr(
                info.tokenAddress,
                receivedAddress.address,
                info.publicSaleVault.address
            );

            expect(await vestingPublicFund.token()).to.be.eq(info.tokenAddress);
            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);
            expect(await vestingPublicFund.publicSaleVaultAddress()).to.be.eq(info.publicSaleVault.address);

        });

    });

    describe("VestingPublicFund :  only  ReceivedAddress ", function () {

        it("4-1. initialize : when not ReceivedAddress, fail", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.not.eq(user2.address);
            await expect(
                vestingPublicFund.connect(user2).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("caller is not receivedAddress");
        });

        it("4-3. initialize : The total number of claims and array's length should be the same. ", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                vestingPublicFund.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong _claimTimes/_claimAmounts length");

        });

        it("4-4. initialize : The last cumulative claim amount ratio should be 100.", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            let _block = await ethers.provider.getBlock();
            let timeBN =  ethers.BigNumber.from(""+_block.timestamp);

            vaultInfo.claimTimes = [
                timeBN,
                timeBN,
                timeBN
            ];

            vaultInfo.claimAmounts = [
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("10")
            ];

            await expect(
                vestingPublicFund.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong the last claimAmounts");

        });

        it("4-5. initialize : The claim time arrangement should be larger as the arrangement increases, and should be larger than current time. ", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            let _block = await ethers.provider.getBlock();
            let timeBN =  ethers.BigNumber.from(""+_block.timestamp);

            vaultInfo.claimTimes = [
                timeBN,
                timeBN,
                timeBN
            ];

            vaultInfo.claimAmounts = [
                ethers.utils.parseEther("10"),
                ethers.utils.parseEther("10"),
                ethers.BigNumber.from("100")
            ];

            await expect(
                vestingPublicFund.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong claimTimes");

        });

        it("4-4. initialize :The cumulative ratio arrangement should be larger as the arrangement increases. ", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            let _block = await ethers.provider.getBlock();

            vaultInfo.claimTimes = [
                _block.timestamp,
                _block.timestamp,
                _block.timestamp
            ];

            await expect(
                vestingPublicFund.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong claimTimes");

        });

        it("4-4. initialize   ", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            let _block = await ethers.provider.getBlock();

            vaultInfo.claimTimes = [
                _block.timestamp+(60*60*1),
                _block.timestamp+(60*60*2),
                _block.timestamp+(60*60*3)
            ];

            vaultInfo.claimAmounts = [
                ethers.BigNumber.from("30"),
                ethers.BigNumber.from("60"),
                ethers.BigNumber.from("100")
            ];

            await vestingPublicFund.connect(receivedAddress).initialize(
                vaultInfo.claimCounts,
                vaultInfo.claimTimes,
                vaultInfo.claimAmounts
            );

            let claimInfos = await vestingPublicFund.allClaimInfos();

            expect(claimInfos[0]).to.be.eq(vaultInfo.claimCounts);
            expect(claimInfos[1].length).to.be.eq(vaultInfo.claimTimes.length);
            expect(claimInfos[2].length).to.be.eq(vaultInfo.claimAmounts.length);

            claimInfos[1].forEach(function(item,index,arr2){
                expect(item).to.be.eq(vaultInfo.claimTimes[index]);
            });

            claimInfos[2].forEach(function(item,index,arr2){
                expect(item).to.be.eq(vaultInfo.claimAmounts[index]);
            });

        });

        it("4-5. initialize : only once execute", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                vestingPublicFund.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("already set");

        });

        it("3-2. ownerSetting : only ProxyOwner : when caller is not proxy owner, fail ", async function () {

            expect(await vestingPublicFund.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                vestingPublicFund.connect(receivedAddress).ownerSetting(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

        });

        it("3-2. ownerSetting : only ProxyOwner", async function () {

            expect(await vestingPublicFund.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);

            let _block = await ethers.provider.getBlock();

            vaultInfo.claimTimes = [
                _block.timestamp+(60*60*1),
                _block.timestamp+(60*60*2),
                _block.timestamp+(60*60*3)
            ];

            vaultInfo.claimAmounts = [
                ethers.BigNumber.from("40"),
                ethers.BigNumber.from("70"),
                ethers.BigNumber.from("100")
            ];

            await vestingPublicFund.connect(proxyAdmin).ownerSetting(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                );

            let claimInfos = await vestingPublicFund.allClaimInfos();

            expect(claimInfos[0]).to.be.eq(vaultInfo.claimCounts);
            expect(claimInfos[1].length).to.be.eq(vaultInfo.claimTimes.length);
            expect(claimInfos[2].length).to.be.eq(vaultInfo.claimAmounts.length);

            claimInfos[1].forEach(function(item,index,arr2){
                expect(item).to.be.eq(vaultInfo.claimTimes[index]);
            });

            claimInfos[2].forEach(function(item,index,arr2){
                expect(item).to.be.eq(vaultInfo.claimAmounts[index]);
            });
        });

    });

    describe("vestingPublicFund : Only Public Sale Vault ", function () {

        it("5-1. funding : when caller is not public sale vault, fail", async function () {

            let publicAddress = await vestingPublicFund.publicSaleVaultAddress();
            publicAddress = publicAddress.toLowerCase();

            expect(publicAddress).to.not.eq(user2.address);

            await expect(
                vestingPublicFund.connect(user2).funding(
                    ethers.utils.parseEther("100")
                )
             ).to.be.revertedWith("caller is not publicSaleVault.");
        });

        it("5-1. funding : when publicSaleVault's balance is insufficient, fail", async function () {

            expect(await vestingPublicFund.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            await expect(
                vestingPublicFund.connect(publicSaleVault).funding(
                    ethers.utils.parseEther("1000")
                )
             ).to.be.revertedWith("allowance is insufficient.");
        });

        it("5-1. funding : when caller didn't approve, fail", async function () {

            expect(await vestingPublicFund.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            let amount = ethers.utils.parseEther("1000");

            await tokenA.connect(tokenInfo.admin).transfer(publicSaleVault.address, amount);

            expect(await tokenA.balanceOf(publicSaleVault.address)).to.be.eq(amount);

            await expect(
                vestingPublicFund.connect(publicSaleVault).funding(
                    amount
                )
             ).to.be.revertedWith("allowance is insufficient.");
        });

        it("5-1. funding ", async function () {

            expect(await vestingPublicFund.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            let amount = ethers.utils.parseEther("1000");
            expect(await tokenA.balanceOf(publicSaleVault.address)).to.be.gte(amount);

            await tokenA.connect(publicSaleVault).approve(vestingPublicFund.address, amount);
            expect(await tokenA.allowance(publicSaleVault.address, vestingPublicFund.address)).to.be.gte(amount);

            await vestingPublicFund.connect(publicSaleVault).funding(amount);
            expect(await vestingPublicFund.totalAllocatedAmount()).to.be.eq(amount);
        });

    });

    describe("VestingPublicFund : Anyone can run ", function () {
        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = vaultInfo.claimTimes[0] - block.timestamp + 1 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("6-1/2/3 . claim", async function () {

            let balanceOfPrev = await tokenA.balanceOf(receivedAddress.address);
            let totalAllocatedAmount = await vestingPublicFund.totalAllocatedAmount();
            let totalClaimsAmount = await vestingPublicFund.totalClaimsAmount();

            let round = await vestingPublicFund.currentRound();
            expect(round.toString()).to.be.eq("1");

            let calculClaimAmount = await vestingPublicFund.calculClaimAmount(round);
            let amount = totalAllocatedAmount.mul(vaultInfo.claimAmounts[0]).div(ethers.BigNumber.from("100"));

            expect(calculClaimAmount).to.be.eq(amount);

            await vestingPublicFund.claim();

            expect(await tokenA.balanceOf(receivedAddress.address)).to.be.eq(balanceOfPrev.add(amount));
        });

        it("6-1 . claim", async function () {

            let round = await vestingPublicFund.currentRound();
            let calculClaimAmount = await vestingPublicFund.calculClaimAmount(round);
            expect(calculClaimAmount).to.be.eq(ethers.constants.Zero);

            await expect(vestingPublicFund.claim()).to.be.revertedWith("claimable amount is zero.");

        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = vaultInfo.claimTimes[1] - block.timestamp + 1 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("6-1/2/3 . claim", async function () {

            let balanceOfPrev = await tokenA.balanceOf(receivedAddress.address);
            let totalAllocatedAmount = await vestingPublicFund.totalAllocatedAmount();
            let totalClaimsAmount = await vestingPublicFund.totalClaimsAmount();

            let round = await vestingPublicFund.currentRound();
            expect(round.toString()).to.be.eq("2");

            let calculClaimAmount = await vestingPublicFund.calculClaimAmount(round);
            let amount = totalAllocatedAmount.mul(vaultInfo.claimAmounts[1]).div(ethers.BigNumber.from("100")).sub(totalClaimsAmount);

            expect(calculClaimAmount).to.be.eq(amount);

            await vestingPublicFund.claim();

            expect(await tokenA.balanceOf(receivedAddress.address)).to.be.eq(balanceOfPrev.add(amount));
        });

    });

    describe("VestingPublicFund : only owner (DAO) ", function () {

        it("7-4 . withdraw : when it didn't VestingStop, fail", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);
            await expect(
                vestingPublicFund.connect(info.dao).withdraw(user2.address, ethers.utils.parseEther("1"))
                ).to.be.revertedWith("it is not stop status.");
        });

        it("7-1 . setVestingPause : when caller is not owner, fail", async function () {

            expect(await vestingPublicFund.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFund.connect(user2).setVestingPause(true)
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-1 . setVestingPause ", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);
            await vestingPublicFund.connect(info.dao).setVestingPause(true);
        });

        it("6-4 . claim : when VestingPause, fail  ", async function () {

            await expect(vestingPublicFund.claim()).to.be.revertedWith("Vesting is paused");
        });

        it("7-1 . setVestingPause ", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);
            await vestingPublicFund.connect(info.dao).setVestingPause(false);
        });

        it("7-2 . setVestingStop : when caller is not owner, fail", async function () {

            expect(await vestingPublicFund.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFund.connect(user2).setVestingStop()
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-2 . setVestingStop  ", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);
            await vestingPublicFund.connect(info.dao).setVestingStop();
        });

        it("7-3 . setVestingStop : already stopped ", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);
            await expect(
                vestingPublicFund.connect(info.dao).setVestingStop()
                ).to.be.revertedWith("already stopped");
        });

        it("6-4 . claim : when VestingStop, fail  ", async function () {

            await expect(vestingPublicFund.claim()).to.be.revertedWith("Vesting is stopped");
        });

        it("7-4 . withdraw : when caller is not owner, fail", async function () {

            expect(await vestingPublicFund.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                vestingPublicFund.connect(user2).withdraw(user2.address, ethers.utils.parseEther("1"))
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-4 . withdraw ", async function () {

            expect(await vestingPublicFund.isAdmin(info.dao.address)).to.be.eq(true);

            let balanceOfPrev = await tokenA.balanceOf(user2.address);
            let amount = await tokenA.balanceOf(vestingPublicFund.address);

            await vestingPublicFund.connect(info.dao).withdraw(user2.address, amount);

            expect(await tokenA.balanceOf(user2.address)).to.be.eq(amount);
            expect(await tokenA.balanceOf(vestingPublicFund.address)).to.be.eq(ethers.constants.Zero);
        });
    });

});

