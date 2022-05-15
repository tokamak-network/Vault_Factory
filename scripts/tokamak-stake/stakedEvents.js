const { ethers, upgrades } = require("hardhat");

const {
  keccak256,
  soliditySha3,
  solidityKeccak256,
} = require("web3-utils");

const DepositManagerABI = require("../../abis/DepositManager.json").abi;
const SeigManagerABI = require("../../abis/SeigManager.json").abi;

// rinkbey
// const DepositManagerAddress = "0x57F5CD759A5652A697D539F1D9333ba38C615FC2";
// const SeigManagerAddress = "0x957DaC3D3C4B82088A4939BE9A8063e20cB2efBE";

// mainnet
const DepositManagerAddress = "0x56E465f654393fa48f007Ed7346105c7195CEe43";
const SeigManagerAddress = "0x710936500aC59e8551331871Cbad3D33d5e0D909";
let layer2 = "0x5d9a0646c46245a8a3b4775afb3c54d07bcb1764";

async function main() {

    await getDepositedEvent();

}

async function getDepositedEvent() {

  let startBlock = 14614216;
  let endBlock = 14780416;
  let allEvents = [];

  const abiDeposited = [ "event Deposited(address indexed layer2, address depositor, uint256 amount)" ];
  const topic0Deposited = "Deposited(address,address,uint256)";

  let returnData = await getLogs(DepositManagerAddress, startBlock, endBlock, abiDeposited, topic0Deposited );


  return null;
};



const getLogs = async (depositManagerAddress, fromBlockNumber, toBlockNumber, abiEvent, topic0 ) => {
  const stakers = [];
  const iface = new ethers.utils.Interface(abiEvent);

  const filter = {
    address: depositManagerAddress,
    fromBlock: parseInt(fromBlockNumber),
    toBlock: parseInt(toBlockNumber),
    topics: [
      ethers.utils.id(topic0)
    ]
  };

  try{
    const txs = await ethers.provider.getLogs(filter);
    //console.log("length: ", txs.length);
    let txCount = 0;
    for (const tx of txs) {
        const { transactionHash } = tx;
        const { logs } = await ethers.provider.getTransactionReceipt(transactionHash);
        const foundLog = logs.find(el => el && el.topics &&
            el.topics.includes(ethers.utils.id(topic0))
          );
        if (!foundLog) continue;
        const parsedlog = iface.parseLog(foundLog);
        let args = parsedlog["args"];
        if(args.layer2.toLowerCase() == layer2.toLowerCase()){
          console.log(args);
          console.log('transactionHash:', transactionHash);
          txCount++;
        }
    }
    console.log("length: ", txCount);
  } catch(error){
    console.log('getLogs error',topic0, error);
  }

}


main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });