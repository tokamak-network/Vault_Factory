const { ethers, upgrades } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

const LockTOSAbi = require("../../abis/LockTOS.json").abi;

// mainnet
const LockTOS_Address = "0x69b4a202fa4039b42ab23adb725aa7b1e9eebd79";


async function main() {

    await getIncreaseEvent();

}

async function getIncreaseEvent() {
  const Contract = await ethers.getContractAt(LockTOSAbi, LockTOS_Address, ethers.provider);

    let startBlock = 13229254;
    let endBlock = 14972086;
    let allEvents = [];

    let filter = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: LockTOS_Address,
      topics: [
        "0xb8596b0e78133666b86648f60233cc2d078144d06df7874ea9f612a3ccc3e2fb"
      ]
    }

    await  ethers.provider.getLogs(filter).then((res) => {

      // console.log(res);

      let params =[
        {
          "indexed": false,
          "internalType": "address",
          "name": "account",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "lockId",
          "type": "uint256"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "unlockTime",
          "type": "uint256"
        }
      ]

      if(res!=null){
        for(let i=0; i< res.length; i++){
          let data = res[i];
          const eventObj = Web3EthAbi.decodeLog(
            params,
            data.data,
            data.topics.slice(1)
          );


          //console.log( data.topics[1] ,data.transactionHash )
          console.log(eventObj.account, eventObj.lockId, eventObj.unlockTime )
        }
      }
      console.log('length', res.length);

    });

    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });