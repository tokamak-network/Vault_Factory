
  const { ethers } = require("hardhat");

  // rinkeby
  let uniswapInfo_rinkeby={
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
    UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65",
    vestingDao: "0x3b9878Ef988B086F13E5788ecaB9A35E74082ED9",
    vestingUpgradeAdmin: "0x3b9878Ef988B086F13E5788ecaB9A35E74082ED9",
    ton:"0x44d4F5d89E9296337b8c48a332B3b2fb2C190CD0"
}


// mainnet
let uniswapInfo_mainnet={
    poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    wethUsdcPool: "",
    wtonWethPool: "",
    wtonTosPool: "0x516e1af7303a94f81e91e4ac29e20f4319d4ecaf",
    wton: "0x709bef48982Bbfd6F2D4Be24660832665F53406C",
    tos: "0x73a54e5C054aA64C1AE7373C2B5474d8AFEa08bd",
    weth: "0xc778417e063141139fce010982780140aa0cd5ab",
    usdc: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
    fee: ethers.BigNumber.from("3000"),
    NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3",
    UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65",
    vestingDao: "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1",
    vestingUpgradeAdmin: "0x15280a52E79FD4aB35F4B9Acbb376DCD72b44Fd1",
    ton: "0x2be5e8c109e2197D077D13A82dAead6a9b3433C5"
}


// goerli
let uniswapInfo_goerli = {
    poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    wethUsdcPool: "",
    wtonWethPool: "",
    wtonTosPool: "",
    wton: "0xe86fCf5213C785AcF9a8BFfEeDEfA9a2199f7Da6",
    tos: "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    usdc: "",
    fee: ethers.BigNumber.from("3000"),
    NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3",
    UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65",
    vestingDao: "0x3b9878Ef988B086F13E5788ecaB9A35E74082ED9",
    vestingUpgradeAdmin: "0x3b9878Ef988B086F13E5788ecaB9A35E74082ED9",
    ton: "0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00"
}

let networkName = "goerli";
let uniswapInfo = uniswapInfo_goerli;


async function getUniswapInfo() {
    const { chainId } = await ethers.provider.getNetwork();

    if(chainId == 1) {
        networkName = "mainnet";
        uniswapInfo = uniswapInfo_mainnet;
    }
    if(chainId == 4) networkName = "rinkeby";
    if(chainId == 5) {
        networkName = "goerli";
        uniswapInfo = uniswapInfo_goerli;
    }

    return {chainId, networkName, uniswapInfo};
}


module.exports = {
    getUniswapInfo
}