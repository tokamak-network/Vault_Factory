const { ethers, upgrades } = require("hardhat");

const {
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

const UniswapV3PoolAbi = require("../../abis/UniswapV3Pool.json").abi;
const UniswapV3StakerAbi = require("../../abis/UniswapV3Staker.json").abi;

// mainnet
//TOS/WTON (0.3 %) 0x1c0ce9aaa0c12f53df3b4d8d77b82d6ad343b4e4
const TOS_WTON_POOL_Address = "0x1c0ce9aaa0c12f53df3b4d8d77b82d6ad343b4e4";
const UniswapV3Staker_Address = "0x1f98407aaB862CdDeF78Ed252D6f557aA5b0f00d";


async function main() {

    await getStakerEvent();

}

async function getStakerEvent() {

    let startBlock = 13734054;
    let endBlock = 14275351;
    let allEvents = [];
    // mainnet
    //"poolName": "TOS / WTON",
    let rewardProgram  = {
      rewardToken: "0x409c4d8cd5d2924b9bc5509230d16a61289c8153",
      pool: "0x1c0ce9aaa0c12f53df3b4d8d77b82d6ad343b4e4",
      startTime: 1638752400,
      endTime: 1638801000,
      refundee: "0x0496b93040e1c7931c8f9b7d1c57787ceb6485d4"
    }
    const incentiveKeyAbi = 'tuple(address rewardToken, address pool, uint256 startTime, uint256 endTime, address refundee)';
    let programKey=[
      rewardProgram.rewardToken,
      rewardProgram.pool,
      rewardProgram.startTime,
      rewardProgram.endTime,
      rewardProgram.refundee
    ]

    let incentiveId = soliditySha3(ethers.utils.defaultAbiCoder.encode([incentiveKeyAbi], [programKey]));
    console.log('incentiveId',incentiveId);

    //https://docs.ethers.io/v5/concepts/events/

    // IncentiveCreated
    console.log("IncentiveCreated");
    let filter = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: UniswapV3Staker_Address,
      topics: [
        "0xa876344e28d4b5191ad03bc0d43f740e3695827ab0faccac739930b915ef8b02",
        ethers.utils.hexZeroPad(rewardProgram.rewardToken, 32),
        ethers.utils.hexZeroPad(rewardProgram.pool, 32)
      ]
    }

    await  ethers.provider.getLogs(filter).then((res) => console.log(res));


    // TokenStaked
    console.log("TokenStaked");
    let filter1 = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: UniswapV3Staker_Address,
      topics: [
        ethers.utils.id("TokenStaked(uint256,bytes32,uint128)"),
        null,
        incentiveId,
        null
      ]
    }
    //console.log(filter1);
    await  ethers.provider.getLogs(filter1).then((res) => console.log(res));


    // TokenUnstaked
    console.log("TokenUnstaked");
    let filter2 = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: UniswapV3Staker_Address,
      topics: [
        ethers.utils.id("TokenUnstaked(uint256,bytes32)"),
        null,
        incentiveId
      ]
    }
    //console.log(filter2);
    await  ethers.provider.getLogs(filter2).then((res) => console.log(res));

    // IncentiveEnded
    console.log("IncentiveEnded");
    let filter3 = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: UniswapV3Staker_Address,
      topics: [
        ethers.utils.id("IncentiveEnded(bytes32,uint256)"),
        incentiveId,
        null
      ]
    }
    //console.log(filter3);
    await  ethers.provider.getLogs(filter3).then((res) => console.log(res));

    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });