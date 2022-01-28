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
        console.log("info.name :",info.name)
        expect(info.name).to.be.equal("ABC");

        typeCVault = await ethers.getContractAt("typeCVault", info.contractAddress);
        expect(await typeCVault.isAdmin(deployer.address)).to.be.equal(false);
        expect(await typeCVault.isAdmin(person1.address)).to.be.equal(true);
    });

})