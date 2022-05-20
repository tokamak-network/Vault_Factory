const { ethers, upgrades } = require("hardhat");

const {
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

const STAKER_ABI = require("../../abis/UniswapV3Staker.json").abi;

// rinkbey
// const DepositManagerAddress = "0x57F5CD759A5652A697D539F1D9333ba38C615FC2";
// const SeigManagerAddress = "0x957DaC3D3C4B82088A4939BE9A8063e20cB2efBE";

// mainnet
// const DepositManagerAddress = "0x56E465f654393fa48f007Ed7346105c7195CEe43";
// const SeigManagerAddress = "0x710936500aC59e8551331871Cbad3D33d5e0D909";
let uniswapV3StakerAddress = "0xe34139463ba50bd61336e0c446bd8c0867c6fe65";



async function main() {

    await getIncentives();

}

function getProgramKey(key) {
    //프로그램 키 [리워드토큰주소,풀주소,시작시간,마감시간,남은금액받을주소]
    return [
        key.rewardToken,
        key.pool,
        key.startTime,
        key.endTime,
        key.refundee
        ];
}

async function getIncentives() {
    let key = {
        rewardToken: '0xa55b8b95ab768f94f3f143903845fc1c8b286e78',
        pool: '0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf',
        startTime: 1653032765,
        endTime: 1653034565,
        refundee: '0x39835d7590f41d21c09a7aab1fa3ae91de9295a3'
      }
    const incentiveKeyAbi =
      'tuple(address rewardToken, address pool, uint256 startTime, uint256 endTime, address refundee)'

    let programKey = getProgramKey(key);
    let programKeyEncode = ethers.utils.defaultAbiCoder.encode([incentiveKeyAbi], [programKey])
    let IncentiveId = soliditySha3(ethers.utils.defaultAbiCoder.encode([incentiveKeyAbi], [key]));

    console.log("programKey",programKey);
    console.log("IncentiveId",IncentiveId);
    console.log("uniswapV3StakerAddress",uniswapV3StakerAddress);

    const staker = await ethers.getContractAt(STAKER_ABI, uniswapV3StakerAddress, ethers.provider);
    // const staker = new ethers.Contract(uniswapV3StakerAddress, STAKER_ABI);

    let data = await staker.incentives(IncentiveId);
    console.log("data",data);
};




main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });