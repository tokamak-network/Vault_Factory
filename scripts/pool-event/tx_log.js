const { ethers, upgrades } = require("hardhat");

const UniswapV3PoolAbi = require("../../abis/UniswapV3Pool.json").abi;

const UniswapV3Pool_TOS_ETH_Address = "0x2ad99c938471770da0cd60e08eaf29ebff67a92a";

const txs = [
  '0xe3a76a9b2a24c6c5ac18eb3c900cf3920e40712875f0b4b0b69064f74a0caa92',
  '0xaeabb3d147f281368b52076039de6376d4d3b3382c645d746189058d17cc05cb',
  '0xd4c86d879cd2434e85168eab99b9a7cd6dfe80aaaf7d33a969bf068d7c8472db'
]

const eventIds = [
  'Burn(address,int24,int24,uint128,uint256,uint256)',
  'Collect(address,address,int24,int24,uint128,uint128)',
  'CollectProtocol(address,address,uint128,uint128)',
  'Flash(address,address,uint256,uint256,uint256,uint256)',
  'IncreaseObservationCardinalityNext(uint16,uint16)',
  'Initialize(uint160,int24)',
  'Mint(address,address,int24,int24,uint128,uint256,uint256)',
  'SetFeeProtocol(uint8,uint8,uint8,uint8)',
  'Swap(address,address,int256,int256,uint160,uint128,int24)',
];

async function main() {

    await getTransactionLogs(txs[2]);

}

async function getTransactionLogs(transaction) {

  const uniswapPool = new ethers.Contract(UniswapV3Pool_TOS_ETH_Address, UniswapV3PoolAbi, ethers.provider);

    const receipt  = await ethers.provider.getTransactionReceipt(transaction);


    for(let i=0; i< receipt.logs.length; i++){
      let eventName = findEvent(receipt.logs[i].topics[0]);
      if(eventName != null){
        console.log('eventName', eventName);
        let data = receipt.logs[i].data;
        let topics = receipt.logs[i].topics;
        let log = uniswapPool.interface.parseLog({data, topics});
        console.log('log', log);
      }

  }

};


function findEvent(topic0){

  let returnEvent = null;
  for(let i=0; i< eventIds.length; i++){
    if(topic0 == ethers.utils.id(eventIds[i])) {
      returnEvent = eventIds[i];
      break;
    }
  }

  return returnEvent;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });