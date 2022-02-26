const { ethers, upgrades } = require("hardhat");

const UniswapV3PoolAbi = require("../../abis/UniswapV3Pool.json").abi;

const UniswapV3Pool_TOS_ETH_Address = "0x2ad99c938471770da0cd60e08eaf29ebff67a92a";

async function main() {

    await getPoolEvent(UniswapV3Pool_TOS_ETH_Address);

}

async function getPoolEvent(poolAddress) {
    const UniswapV3Pool = await ethers.getContractAt(UniswapV3PoolAbi, poolAddress, ethers.provider);

    console.log( 'UniswapV3Pool ', UniswapV3Pool.address);

    let startBlock = 13017541;
    let endBlock = 14275351;
    let allEvents = [];

    //endBlock = 13017541+10000;

    let sumAmount0 = ethers.BigNumber.from("0");
    let sumAmount1 = ethers.BigNumber.from("0");

    let eventFilter = [
        UniswapV3Pool.filters.Mint(null, null, null),
        UniswapV3Pool.filters.Burn(null, null,null),
        UniswapV3Pool.filters.Swap(null, null),
        UniswapV3Pool.filters.Collect(null, null, null),
        UniswapV3Pool.filters.Flash(null, null),
        UniswapV3Pool.filters.CollectProtocol(null, null)
        ];
    let txCount = 0;
    for(let i = startBlock; i < endBlock; i += 5000) {
      const _startBlock = i;
      const _endBlock = Math.min(endBlock, i + 4999);
      const events = await UniswapV3Pool.queryFilter(eventFilter, _startBlock, _endBlock);
      //console.log(events);

      events.forEach(e=>{

        console.log(e);
        if(e.event == "Mint" ){
            console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1);
            sumAmount0 = sumAmount0.add(e.args.amount0);
            sumAmount1 = sumAmount1.add(e.args.amount1);
            txCount++;

        } else if(e.event == "Burn" ){
            console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1);
            sumAmount0 = sumAmount0.sub(e.args.amount0);
            sumAmount1 = sumAmount1.sub(e.args.amount1);
            txCount++;
        } else if(e.event == "Swap" ){
            console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1);
            sumAmount0 = sumAmount0.add(e.args.amount0);
            sumAmount1 = sumAmount1.add(e.args.amount1);
            txCount++;
        } else if(e.event == "Collect" ){
            console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1 );
            sumAmount0 = sumAmount0.sub(e.args.amount0);
            sumAmount1 = sumAmount1.sub(e.args.amount1);
            txCount++;
        } else if(e.event == "Flash" ){
           console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1 );
            sumAmount0 = sumAmount0.sub(e.args.amount0);
            sumAmount1 = sumAmount1.sub(e.args.amount1);
            txCount++;
        } else if(e.event == "collectProtocol" ){
           console.log("txCount", txCount,e.event, e.blockNumber, e.transactionHash, e.args.amount0, e.args.amount1 );
            sumAmount0 = sumAmount0.sub(e.args.amount0);
            sumAmount1 = sumAmount1.sub(e.args.amount1);
            txCount++;
        }
        // console.log("sumAmount0", sumAmount0);
        // console.log("sumAmount1", sumAmount1);
        // console.log("txCount", txCount, e.event, e.args.amount0, e.args.amount1);
      });
      console.log("sumAmount0", sumAmount0);
      console.log("sumAmount1", sumAmount1);
      //allEvents = [...allEvents, ...events]
    }

    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });