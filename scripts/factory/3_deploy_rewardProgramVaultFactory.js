
const { ethers } = require("hardhat");
const save = require("../save_deployed");
const loadDeployed = require("../load_deployed");

  // rinkeby
  let uniswapInfo={
        poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
        npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
        swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
        wethUsdcPool: "0xfbDc20aEFB98a2dD3842023f21D17004eAefbe68",
        wtonWethPool: "0xE032a3aEc591fF1Ca88122928161eA1053a098AC",
        wtonTosPool: "0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf",
        wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
        tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
        weth: "0xc778417e063141139fce010982780140aa0cd5ab",
        usdc: "0x4dbcdf9b62e891a7cec5a2568c3f4faf9e8abe2b",
        fee: ethers.BigNumber.from("3000"),
        NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3",
        UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65"
  }


  // mainnet
  // let uniswapInfo={
  //       poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
  //       npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
  //       swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
  //       wethUsdcPool: "",
  //       wtonWethPool: "",
  //       wtonTosPool: "0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf",
  //       wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
  //       tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
  //       weth: "0xc778417e063141139fce010982780140aa0cd5ab",
  //       usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  //       _fee: ethers.BigNumber.from("3000"),
  //       NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3"
  // }


async function main() {
  let deployer, user2;

  [deployer, user2] = await ethers.getSigners();
  console.log('deployer',deployer.address);
  console.log('user2',user2.address);

  let deployInfo = {
    name: "",
    address: ""
  }

  const RewardProgramVaultFactory = await ethers.getContractFactory("RewardProgramVaultFactory");
  const rewardProgramVaultFactory  = await RewardProgramVaultFactory.deploy();

  let tx0 = await rewardProgramVaultFactory.deployed();
  console.log("RewardProgramVaultFactory tx0:", tx0.deployTransaction.hash);
  console.log("RewardProgramVaultFactory deployed to:", rewardProgramVaultFactory.address );

  deployInfo = {
      name: "RewardProgramVaultFactory",
      address: rewardProgramVaultFactory.address
  }

  save(process.env.NETWORK, deployInfo);

  const rewardProgramVaultFactoryContract = await ethers.getContractAt("RewardProgramVaultFactory", rewardProgramVaultFactory.address);
  tx = await rewardProgramVaultFactoryContract.connect(deployer).setStaker(uniswapInfo.UniswapV3Staker);
  await tx.wait();
  console.log("setStaker:", tx.hash);


  tx = await rewardProgramVaultFactoryContract.connect(deployer).setWaitStartSeconds(ethers.BigNumber.from("60"));
  await tx.wait();
  console.log("setWaitStartSeconds:", tx.hash);


  const RewardProgramVaultAddress = loadDeployed(process.env.NETWORK, "RewardProgramVault");
  tx = await rewardProgramVaultFactoryContract.connect(deployer).setLogic(RewardProgramVaultAddress);
  await tx.wait();
  console.log("setLogic:", tx.hash);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.

main()
  .then(() => process.exit(0))
  .catch(error => {
    console.error(error);
    process.exit(1);
  });
