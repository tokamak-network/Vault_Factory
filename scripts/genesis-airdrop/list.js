const { ethers, upgrades } = require("hardhat");

const GenesisAirdropAbi = require("../../abis/GenesisAirdrop.json").abi;

const GenesisAirdrop_Address = "0x0620492BAbe0a2cE13688025F8b783B8d6c28955";


async function main() {

    await getAirdropBalance(GenesisAirdrop_Address);


}


async function getAirdropBalance(genesisAddress) {
    const Contract = await ethers.getContractAt(GenesisAirdropAbi, genesisAddress, ethers.provider);



    console.log( 'Contract ', Contract.address);

    let users = await Contract.getTgeInfos(1);

    console.log( 'users ', users);

    let unclaimedUsers = [];
    let sum = ethers.BigNumber.from('0');

    for(let i=0; i< users.whitelist.length ; i++){
        let info = await Contract.unclaimedInfosDetails(users.whitelist[i]);
        if(info._amounts.length > 0 ){
            sum = sum.add(info._amounts[0]);
            unclaimedUsers.push({account: users.whitelist[i], amount: info._amounts[0]});
            console.log('info', users.whitelist[i], info._amounts[0]);
        }

    }
    console.log( 'unclaimedUsers.length ', unclaimedUsers.length);
    console.log( 'sum ', sum);
    return null;
  };



main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });