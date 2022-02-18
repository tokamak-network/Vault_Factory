

const { ethers } = require("hardhat");
const {
  keccak256,
} = require("web3-utils");
const JSBI = require('jsbi');
const Web3 = require('web3');


const ERC20Abi = require("../abis/ERC20A.json");
const LiquidityVaultAbi = require("../abis/LiquidityVault.json");

async function main() {
   let deployer, user2;

  [deployer, user2, user3 ] = await ethers.getSigners();
  console.log('deployer',deployer.address);
  console.log('user2',user2.address);

  console.log('user3',user3.address);

    let amount = await ethers.BigNumber.from("1000000000000000000");

  let bat="0xbf7a7169562078c96f0ec1a8afd6ae50f12e5a99";
   let LiquidityVaultProxy = "0x21479cD083fa81A958628148432b77BEB50fA056";

  const BAT = await ethers.getContractAt(ERC20Abi.abi, bat);

    console.log("BAT name:", await BAT.name());
    console.log("BAT symbol:", await BAT.symbol());
    console.log("BAT decimals:", await BAT.decimals());
    console.log("BAT totalSupply:", await BAT.totalSupply());

  let bal = await BAT.balanceOf(user2.address);
  console.log("user2  balanceOf :", bal);

  let bal2 = await BAT.balanceOf(user3.address);
  console.log("user3  balanceOf :", bal2);


  let bal3 = await BAT.balanceOf(deployer.address);
  console.log("deployer  balanceOf :", bal3);


    let allowance = await BAT.allowance(user3.address, user2.address);
  console.log("user2.address  allowance :", allowance);

    let tx = await BAT.connect(user3).approve(LiquidityVaultProxy, amount);
    await tx.wait();
    console.log("tx",tx);

//   if(allowance.lt(bal)){
//     let tx = await BAT.connect(user3).approve(LiquidityVaultProxy, amount);
//     await tx.wait();
//     console.log("tx",tx);
//   }
  allowance = await BAT.allowance(user3.address, LiquidityVaultProxy );
  console.log("user3 LiquidityVaultProxy  allowance :", allowance);

     let tx1 = await BAT.connect(user3).transfer(LiquidityVaultProxy, amount);
    await tx1.wait();
    console.log("tx1",tx1);


  let bal4 = await BAT.balanceOf(LiquidityVaultProxy);
  console.log("LiquidityVaultProxy  balanceOf :", bal4);


    const LiquidityVaultContract = await ethers.getContractAt(LiquidityVaultAbi.abi, LiquidityVaultProxy);

    let tx2 = await LiquidityVaultContract.transferAtoB(bat, user3.address, user2.address, amount);

    await tx2.wait();

    console.log("transferAtoB :", tx2);

//     let tx1 = await BAT.connect(user2).transferFrom(user3.address, deployer.address, bal);
//     await tx1.wait();
//     console.log("tx1",tx1);

}


main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });

