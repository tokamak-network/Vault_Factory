const { ethers, upgrades } = require("hardhat");
const Web3EthAbi = require('web3-eth-abi');
const {
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

const PublicSaleAbi = require("../../abis/PublicSale.json").abi;

// mainnet
const PublicSale_Address = "0x3B75d3f628C29d357b484EA7d091faEd63419267";


async function main() {

    await getStakerEvent();

}

async function getStakerEvent() {
  const PublicSaleContract = await ethers.getContractAt(PublicSaleAbi, PublicSale_Address, ethers.provider);

    let startBlock = 13793835;
    let endBlock = 14582136;
    let allEvents = [];

    let filter = {
      fromBlock: startBlock-10,
      toBlock: 'latest',
      address: PublicSale_Address,
      topics: [
        "0xc2198f7273f3b4ab95a025cf1f853777ca45149bbc1c005496959a6da70fcb8d",
        null
      ]
    }

    await  ethers.provider.getLogs(filter).then((res) => {

      // console.log(res);

      let params =[
        {
          "indexed": true,
          "internalType": "address",
          "name": "from",
          "type": "address"
        },
        {
          "indexed": false,
          "internalType": "uint256",
          "name": "amount",
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
          console.log(eventObj.from  )
        }
      }
      console.log('length', res.length);

    });

    /*
    let eventFilter = [
      PublicSaleContract.filters.ExclusiveSaled(null),
      ];

      let txCount = 0;

    for(let i = startBlock; i < endBlock; i += 5000) {
      const _startBlock = i;
      const _endBlock = Math.min(endBlock, i + 4999);
      const events = await PublicSaleContract.queryFilter(eventFilter, _startBlock, _endBlock);
      console.log(events);

      events.forEach(e=>{

        // console.log(e);
        if(e.event == "MiExclusiveSalednt" ){
            //console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1);
            console.log('e.args',e.args);
            txCount++;
        }

        // console.log("txCount", txCount, e.event, e.args.amount0, e.args.amount1);
      });

      //allEvents = [...allEvents, ...events]
    }
    */

    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });