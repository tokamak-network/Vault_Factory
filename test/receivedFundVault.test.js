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

describe("ReceivedFundVault", function () {

    let tokenA, receivedFundVaultFactory, receivedFundVaultLogic,  receivedFundVault, receivedFundVaultProxy, provider;
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

    it("create ReceivedFundVault Logic", async function () {
        const ReceivedFundVault = await ethers.getContractFactory("ReceivedFundVault");
        let ReceivedFundVaultLogicDeployed = await ReceivedFundVault.deploy();
        let tx = await ReceivedFundVaultLogicDeployed.deployed();
        receivedFundVaultLogic = ReceivedFundVaultLogicDeployed.address;
    });

    it("create ReceivedFundVaultFactory ", async function () {
        const ReceivedFundVaultFactory = await ethers.getContractFactory("ReceivedFundVaultFactory");
        let ReceivedFundVaultFactoryDeployed = await ReceivedFundVaultFactory.deploy();
        let tx = await ReceivedFundVaultFactoryDeployed.deployed();

        receivedFundVaultFactory =  await ethers.getContractAt("ReceivedFundVaultFactory", ReceivedFundVaultFactoryDeployed.address);
        let code = await ethers.provider.getCode(receivedFundVaultFactory.address);
        expect(code).to.not.eq("0x");

    });

    describe("ReceivedFundVaultFactory   ", function () {

        it("0-1. setLogic : when not admin, fail ", async function () {

            await expect(
                receivedFundVaultFactory.connect(user2).setLogic(receivedFundVaultLogic)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-1. setLogic ", async function () {

            await receivedFundVaultFactory.connect(admin1).setLogic(receivedFundVaultLogic);

            expect(await receivedFundVaultFactory.vaultLogic()).to.be.eq(receivedFundVaultLogic);
        });

        it("0-2. setUpgradeAdmin : when not admin, fail ", async function () {

            await expect(
                receivedFundVaultFactory.connect(user2).setUpgradeAdmin(proxyAdmin.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-2. setUpgradeAdmin ", async function () {

            await receivedFundVaultFactory.connect(admin1).setUpgradeAdmin(proxyAdmin.address);
            expect(await receivedFundVaultFactory.upgradeAdmin()).to.be.eq(proxyAdmin.address);
        });

        it("0-3. setBaseInfo : when not admin, fail ", async function () {

            await expect(
                receivedFundVaultFactory.connect(user2).setBaseInfo([info.tokenAddress, info.daoAddress])
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("0-4. setLogEventAddress : when not admin, fail ", async function () {

            await expect(
                receivedFundVaultFactory.connect(user2).setLogEventAddress(eventLogAddress)
            ).to.be.revertedWith("Accessible: Caller is not an admin");

        });

        it("1-1. create : fail when it's not set receivedAddress ", async function () {

            await expect(
                receivedFundVaultFactory.create(
                    vaultInfo.name,
                    info.publicSaleVault.address,
                    ethers.constants.AddressZero
                )
            ).to.be.revertedWith("some address is zero");

        });

        it("1-1. create : fail when did'nt set token ", async function () {

            expect(await receivedFundVaultFactory.token()).to.be.eq(ethers.constants.AddressZero);
            await expect(
                receivedFundVaultFactory.create(
                    vaultInfo.name,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("some address is zero");
        });

        it("0-3. setBaseInfo ", async function () {

            await receivedFundVaultFactory.connect(admin1).setBaseInfo([info.tokenAddress, info.daoAddress]);
            expect(await receivedFundVaultFactory.token()).to.be.eq(info.tokenAddress);
            expect(await receivedFundVaultFactory.daoAddress()).to.be.eq(info.daoAddress);
        });

        it("0-4. setLogEventAddress   ", async function () {
            await receivedFundVaultFactory.connect(admin1).setLogEventAddress(eventLogAddress);
            expect(await receivedFundVaultFactory.logEventAddress()).to.be.eq(eventLogAddress);
        });

        it("1-1 / 2-9. create : ReceivedFundVaultProxy ", async function () {

            let tx = await receivedFundVaultFactory.create(
                vaultInfo.name,
                info.publicSaleVault.address,
                receivedAddress.address
            );
            vaultInfo.admin = dao;

            const receipt = await tx.wait();
            let _function ="CreatedReceivedFundVault(address,string)";
            let interface = receivedFundVaultFactory.interface;

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

            expect(await receivedFundVaultFactory.totalCreatedContracts()).to.be.eq(1);
            expect((await receivedFundVaultFactory.getContracts(0)).contractAddress).to.be.eq(vaultAddress);
            expect((await receivedFundVaultFactory.lastestCreated()).contractAddress).to.be.eq(vaultAddress);

            let VaultContract = await ethers.getContractAt("ReceivedFundVaultProxy", vaultAddress);
            receivedFundVaultProxy = VaultContract;

            receivedFundVault = await ethers.getContractAt("ReceivedFundVault", vaultAddress);

            expect(await VaultContract.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            expect(await VaultContract.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);

            expect(await VaultContract.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await VaultContract.isAdmin(proxyAdmin.address)).to.be.eq(true);

            expect(await receivedFundVaultFactory.token()).to.be.eq(await receivedFundVaultProxy.token());
            expect(receivedAddress.address).to.be.eq(await receivedFundVaultProxy.receivedAddress());
            expect(info.publicSaleVault.address).to.be.eq(await receivedFundVaultProxy.publicSaleVaultAddress());
        });
    });

    describe("ReceivedFundVaultProxy : Only Admin ", function () {

        it("2-1. addAdmin : when not proxy admin, fail", async function () {
            expect(await receivedFundVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(user2).addAdmin(user2.address)
                ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. addAdmin : when user is admin, not ProxyAdmin, fail ", async function () {
            expect(await receivedFundVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await receivedFundVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).addAdmin(user2.address))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-1. addAdmin only ProxyAdmin ", async function () {
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await receivedFundVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
        });

        it("2-2. removeAdmin : when not self-admin, fail", async function () {
            await expect(receivedFundVaultProxy.connect(user1).removeAdmin()).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-2. removeAdmin ", async function () {
            await receivedFundVaultProxy.connect(user2).removeAdmin();
        });

        it("2-3. transferAdmin : when not admin, fail ", async function () {
            await expect(
                receivedFundVaultProxy.connect(user2).transferAdmin(user1.address)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-3. transferAdmin ", async function () {
            await receivedFundVaultProxy.connect(proxyAdmin).addAdmin(user2.address);
            expect(await receivedFundVaultProxy.isAdmin(user2.address)).to.be.eq(true);
            await receivedFundVaultProxy.connect(user2).transferAdmin(user1.address);
        });

        it("2-4. setImplementation2 : when not proxy admin, fail", async function () {
            await expect(receivedFundVaultProxy.connect(vaultInfo.admin).setImplementation2(receivedFundVaultLogic,0, true))
            .to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-4/5. setImplementation2", async function () {

            let tx = await receivedFundVaultProxy.connect(proxyAdmin).setImplementation2(
                receivedFundVaultLogic, 0, true
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

            expect(await receivedFundVaultProxy.isAdmin(vaultInfo.admin.address)).to.be.eq(true);
            expect(await receivedFundVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);

            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).setAliveImplementation2(
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

            let tx = await receivedFundVaultProxy.connect(proxyAdmin).setImplementation2(
                testLogicAddress, 1, true
            );

            await tx.wait();

            tx = await receivedFundVaultProxy.connect(proxyAdmin).setSelectorImplementations2(
                [_func1, _func2],
                testLogicAddress
            );

            await tx.wait();

            expect(await receivedFundVaultProxy.implementation2(1)).to.be.eq(testLogicAddress);
            expect(await receivedFundVaultProxy.getSelectorImplementation2(_func1)).to.be.eq(testLogicAddress);
            expect(await receivedFundVaultProxy.getSelectorImplementation2(_func2)).to.be.eq(testLogicAddress);

            const TestLogicContract = await ethers.getContractAt("TestLogic", receivedFundVaultProxy.address);

            let a = ethers.BigNumber.from("1");
            let b = ethers.BigNumber.from("2");

            let add = await TestLogicContract.sayAdd(a, b);
            expect(add).to.be.eq(a.add(b));

            let mul = await TestLogicContract.sayMul(a, b);
            expect(mul).to.be.eq(a.mul(b));

            tx = await receivedFundVaultProxy.connect(proxyAdmin).setAliveImplementation2(
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

            expect(await receivedFundVaultProxy.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(user2).setBaseInfoProxy(
                    vaultInfo.name,
                    info.tokenAddress,
                    info.dao.address,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-10. setBaseInfoProxy : only once executed ", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await expect(
                receivedFundVaultProxy.connect(proxyAdmin).setBaseInfoProxy(
                    vaultInfo.name,
                    info.tokenAddress,
                    info.dao.address,
                    info.publicSaleVault.address,
                    receivedAddress.address
                )
            ).to.be.revertedWith("already set");
        });

        it("2-11. addProxyAdmin : when not proxy admin, fail", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).addProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-11. addProxyAdmin : only proxy admin ", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await receivedFundVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

        });

        it("2-12. removeProxyAdmin : when not proxy admin, fail", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).removeProxyAdmin()
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-12. removeProxyAdmin ", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.eq(true);
            await receivedFundVaultProxy.connect(proxyAdmin2).removeProxyAdmin();
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });

        it("2-13. transferProxyAdmin : when not proxy admin, fail", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(vaultInfo.admin.address)).to.be.eq(false);
            await expect(
                receivedFundVaultProxy.connect(vaultInfo.admin).transferProxyAdmin(proxyAdmin2.address)
            ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("2-13. transferProxyAdmin ", async function () {

            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);
            await receivedFundVaultProxy.connect(proxyAdmin).addProxyAdmin(proxyAdmin2.address);

            await receivedFundVaultProxy.connect(proxyAdmin).transferProxyAdmin(proxyAdmin2.address);
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(false);
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(true);

            await receivedFundVaultProxy.connect(proxyAdmin2).transferProxyAdmin(proxyAdmin.address);
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin.address)).to.be.equal(true);
            expect(await receivedFundVaultProxy.isProxyAdmin(proxyAdmin2.address)).to.be.equal(false);

        });


        it("2-14. setProxyPause : when not admin, fail", async function () {

            await expect(
                receivedFundVaultProxy.connect(user2).setProxyPause(true)
            ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("2-14. setProxyPause ", async function () {

            await receivedFundVaultProxy.connect(vaultInfo.admin).setProxyPause(true);
            expect(await receivedFundVaultProxy.pauseProxy()).to.be.equal(true);

        });

        it("2-14. setProxyPause : can\'t exceute logic function ", async function () {

            await expect(
                receivedFundVault.currentRound()
            ).to.be.revertedWith("Proxy: impl OR proxy is false");
        });

        it("2-14. setProxyPause   ", async function () {
            await receivedFundVaultProxy.connect(vaultInfo.admin).setProxyPause(false);
        });
    });

    describe("ReceivedFundVaultProxy : Can Anybody ", function () {

        it("2-14. fallback : can exceute logic function  ", async function () {
            await receivedFundVault.currentRound();
        });

    });


    describe("ReceivedFundVault :  only ProxyOwner ", function () {

        it("3-1. changeAddr : when not proxy admin, fail", async function () {
            expect(await receivedFundVault.isProxyAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVault.connect(user2).changeAddr(
                    info.tokenAddress,
                    receivedAddress.address,
                    info.publicSaleVault.address
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");
        });

        it("3-1. changeAddr ", async function () {

            expect(await receivedFundVault.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);

            await receivedFundVault.connect(proxyAdmin).changeAddr(
                    info.tokenAddress,
                    receivedAddress.address,
                    receivedAddress.address
                );

            expect(await receivedFundVault.token()).to.be.eq(info.tokenAddress);
            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);
            expect(await receivedFundVault.publicSaleVaultAddress()).to.be.eq(receivedAddress.address);

            await receivedFundVault.connect(proxyAdmin).changeAddr(
                info.tokenAddress,
                receivedAddress.address,
                info.publicSaleVault.address
            );

            expect(await receivedFundVault.token()).to.be.eq(info.tokenAddress);
            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);
            expect(await receivedFundVault.publicSaleVaultAddress()).to.be.eq(info.publicSaleVault.address);

        });

    });

    describe("ReceivedFundVault :  only  ReceivedAddress ", function () {

        it("4-1. initialize : when not ReceivedAddress, fail", async function () {

            expect(await receivedFundVault.receivedAddress()).to.not.eq(user2.address);
            await expect(
                receivedFundVault.connect(user2).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("caller is not receivedAddress");
        });

        it("4-3. initialize : The total number of claims and array's length should be the same. ", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                receivedFundVault.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong _claimTimes/_claimAmounts length");

        });

        it("4-4. initialize : The last cumulative claim amount ratio should be 100.", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

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
                receivedFundVault.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong the last claimAmounts");

        });

        it("4-5. initialize : The claim time arrangement should be larger as the arrangement increases, and should be larger than current time. ", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

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
                receivedFundVault.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong claimTimes");

        });

        it("4-4. initialize :The cumulative ratio arrangement should be larger as the arrangement increases. ", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

            let _block = await ethers.provider.getBlock();

            vaultInfo.claimTimes = [
                _block.timestamp,
                _block.timestamp,
                _block.timestamp
            ];

            await expect(
                receivedFundVault.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("wrong claimTimes");

        });

        it("4-4. initialize   ", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

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

            await receivedFundVault.connect(receivedAddress).initialize(
                vaultInfo.claimCounts,
                vaultInfo.claimTimes,
                vaultInfo.claimAmounts
            );

            let claimInfos = await receivedFundVault.allClaimInfos();

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

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                receivedFundVault.connect(receivedAddress).initialize(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("already set");

        });

        it("3-2. ownerSetting : only ProxyOwner : when caller is not proxy owner, fail ", async function () {

            expect(await receivedFundVault.receivedAddress()).to.be.eq(receivedAddress.address);

            await expect(
                receivedFundVault.connect(receivedAddress).ownerSetting(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                )
             ).to.be.revertedWith("Accessible: Caller is not an proxy admin");

        });

        it("3-2. ownerSetting : only ProxyOwner", async function () {

            expect(await receivedFundVault.isProxyAdmin(proxyAdmin.address)).to.be.eq(true);

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

            await receivedFundVault.connect(proxyAdmin).ownerSetting(
                    vaultInfo.claimCounts,
                    vaultInfo.claimTimes,
                    vaultInfo.claimAmounts
                );

            let claimInfos = await receivedFundVault.allClaimInfos();

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

    describe("ReceivedFundVault : Only Public Sale Vault ", function () {

        it("5-1. funding : when caller is not public sale vault, fail", async function () {

            let publicAddress = await receivedFundVault.publicSaleVaultAddress();
            publicAddress = publicAddress.toLowerCase();

            expect(publicAddress).to.not.eq(user2.address);

            await expect(
                receivedFundVault.connect(user2).funding(
                    ethers.utils.parseEther("100")
                )
             ).to.be.revertedWith("caller is not publicSaleVault.");
        });

        it("5-1. funding : when publicSaleVault's balance is insufficient, fail", async function () {

            expect(await receivedFundVault.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            await expect(
                receivedFundVault.connect(publicSaleVault).funding(
                    ethers.utils.parseEther("1000")
                )
             ).to.be.revertedWith("allowance is insufficient.");
        });

        it("5-1. funding : when caller didn't approve, fail", async function () {

            expect(await receivedFundVault.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            let amount = ethers.utils.parseEther("1000");

            await tokenA.connect(tokenInfo.admin).transfer(publicSaleVault.address, amount);

            expect(await tokenA.balanceOf(publicSaleVault.address)).to.be.eq(amount);

            await expect(
                receivedFundVault.connect(publicSaleVault).funding(
                    amount
                )
             ).to.be.revertedWith("allowance is insufficient.");
        });

        it("5-1. funding ", async function () {

            expect(await receivedFundVault.publicSaleVaultAddress()).to.be.eq(publicSaleVault.address);

            let amount = ethers.utils.parseEther("1000");
            expect(await tokenA.balanceOf(publicSaleVault.address)).to.be.gte(amount);

            await tokenA.connect(publicSaleVault).approve(receivedFundVault.address, amount);
            expect(await tokenA.allowance(publicSaleVault.address, receivedFundVault.address)).to.be.gte(amount);

            await receivedFundVault.connect(publicSaleVault).funding(amount);
            expect(await receivedFundVault.totalAllocatedAmount()).to.be.eq(amount);
        });

    });

    describe("ReceivedFundVault : Anyone can run ", function () {
        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = vaultInfo.claimTimes[0] - block.timestamp + 1 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("6-1/2/3 . claim", async function () {

            let balanceOfPrev = await tokenA.balanceOf(receivedAddress.address);
            let totalAllocatedAmount = await receivedFundVault.totalAllocatedAmount();
            let totalClaimsAmount = await receivedFundVault.totalClaimsAmount();

            let round = await receivedFundVault.currentRound();
            expect(round.toString()).to.be.eq("1");

            let calculClaimAmount = await receivedFundVault.calculClaimAmount(round);
            let amount = totalAllocatedAmount.mul(vaultInfo.claimAmounts[0]).div(ethers.BigNumber.from("100"));

            expect(calculClaimAmount).to.be.eq(amount);

            await receivedFundVault.claim();

            expect(await tokenA.balanceOf(receivedAddress.address)).to.be.eq(balanceOfPrev.add(amount));
        });

        it("6-1 . claim", async function () {

            let round = await receivedFundVault.currentRound();
            let calculClaimAmount = await receivedFundVault.calculClaimAmount(round);
            expect(calculClaimAmount).to.be.eq(ethers.constants.Zero);

            await expect(receivedFundVault.claim()).to.be.revertedWith("claimable amount is zero.");

        });

        it("      pass blocks", async function () {
            let block = await ethers.provider.getBlock();
            let passTime = vaultInfo.claimTimes[1] - block.timestamp + 1 ;

            ethers.provider.send("evm_increaseTime", [passTime])
            ethers.provider.send("evm_mine")      // mine the next block
        });

        it("6-1/2/3 . claim", async function () {

            let balanceOfPrev = await tokenA.balanceOf(receivedAddress.address);
            let totalAllocatedAmount = await receivedFundVault.totalAllocatedAmount();
            let totalClaimsAmount = await receivedFundVault.totalClaimsAmount();

            let round = await receivedFundVault.currentRound();
            expect(round.toString()).to.be.eq("2");

            let calculClaimAmount = await receivedFundVault.calculClaimAmount(round);
            let amount = totalAllocatedAmount.mul(vaultInfo.claimAmounts[1]).div(ethers.BigNumber.from("100")).sub(totalClaimsAmount);

            expect(calculClaimAmount).to.be.eq(amount);

            await receivedFundVault.claim();

            expect(await tokenA.balanceOf(receivedAddress.address)).to.be.eq(balanceOfPrev.add(amount));
        });

    });

    describe("ReceivedFundVault : only owner (DAO) ", function () {

        it("7-4 . withdraw : when it didn't VestingStop, fail", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);
            await expect(
                receivedFundVault.connect(info.dao).withdraw(user2.address, ethers.utils.parseEther("1"))
                ).to.be.revertedWith("it is not stop status.");
        });

        it("7-1 . setVestingPause : when caller is not owner, fail", async function () {

            expect(await receivedFundVault.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVault.connect(user2).setVestingPause(true)
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-1 . setVestingPause ", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);
            await receivedFundVault.connect(info.dao).setVestingPause(true);
        });

        it("6-4 . claim : when VestingPause, fail  ", async function () {

            await expect(receivedFundVault.claim()).to.be.revertedWith("Vesting is paused");
        });

        it("7-1 . setVestingPause ", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);
            await receivedFundVault.connect(info.dao).setVestingPause(false);
        });

        it("7-2 . setVestingStop : when caller is not owner, fail", async function () {

            expect(await receivedFundVault.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVault.connect(user2).setVestingStop()
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-2 . setVestingStop  ", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);
            await receivedFundVault.connect(info.dao).setVestingStop();
        });

        it("7-3 . setVestingStop : already stopped ", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);
            await expect(
                receivedFundVault.connect(info.dao).setVestingStop()
                ).to.be.revertedWith("already stopped");
        });

        it("6-4 . claim : when VestingStop, fail  ", async function () {

            await expect(receivedFundVault.claim()).to.be.revertedWith("Vesting is stopped");
        });

        it("7-4 . withdraw : when caller is not owner, fail", async function () {

            expect(await receivedFundVault.isAdmin(user2.address)).to.be.eq(false);
            await expect(
                receivedFundVault.connect(user2).withdraw(user2.address, ethers.utils.parseEther("1"))
                ).to.be.revertedWith("Accessible: Caller is not an admin");
        });

        it("7-4 . withdraw ", async function () {

            expect(await receivedFundVault.isAdmin(info.dao.address)).to.be.eq(true);

            let balanceOfPrev = await tokenA.balanceOf(user2.address);
            let amount = await tokenA.balanceOf(receivedFundVault.address);

            await receivedFundVault.connect(info.dao).withdraw(user2.address, amount);

            expect(await tokenA.balanceOf(user2.address)).to.be.eq(amount);
            expect(await tokenA.balanceOf(receivedFundVault.address)).to.be.eq(ethers.constants.Zero);
        });
    });

});

