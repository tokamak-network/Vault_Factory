const { ethers, upgrades } = require("hardhat");

const UniswapV3PoolAbi = require("../../abis/UniswapV3Pool.json").abi;
const NonfungiblePositionManagerAbi = require("../../abis/NonfungiblePositionManager.json").abi;
const ERC20A = require("../../abis/ERC20A.json").abi;


const UniswapV3Pool_TOS_ETH_Address = "0x2ad99c938471770da0cd60e08eaf29ebff67a92a";
const NonfungiblePositionManager_Address = "0xC36442b4a4522E871399CD717aBDD847Ab11FE88";

const TOS_Address ="0x409c4d8cd5d2924b9bc5509230d16a61289c8153";
const TOKEN1_Address ="0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";

let tokens = [
    163286,
    165032
];

async function main() {

    await getPoolEvent(UniswapV3Pool_TOS_ETH_Address);


}


async function getPoolEvent(poolAddress) {
    const UniswapV3Pool = await ethers.getContractAt(UniswapV3PoolAbi, poolAddress, ethers.provider);
    const NonfungiblePositionManager = await ethers.getContractAt(NonfungiblePositionManagerAbi, NonfungiblePositionManager_Address, ethers.provider);
    const TOKEN1 = await ethers.getContractAt(ERC20A, TOKEN1_Address, ethers.provider);
    const TOS = await ethers.getContractAt(ERC20A, TOS_Address, ethers.provider);


    console.log( 'UniswapV3Pool ', UniswapV3Pool.address);
    console.log( 'NonfungiblePositionManager ', NonfungiblePositionManager.address);

    let balanceOfTOKEN1 = await TOKEN1.balanceOf(UniswapV3Pool.address);
    let balanceOfTOS = await TOS.balanceOf(UniswapV3Pool.address);

    console.log( 'balanceOfTOS ', balanceOfTOS);
    console.log( 'balanceOfTOKEN1 ', balanceOfTOKEN1);


    let slot0 = await UniswapV3Pool.slot0();

    console.log('slot0', slot0);


    for(let i=0; i< tokens.length ; i++){
        let position = await NonfungiblePositionManager.positions(tokens[i]);
        console.log('position', position);

    }


    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });