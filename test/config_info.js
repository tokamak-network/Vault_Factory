const { ethers } = require("hardhat");

let config = {
    mintRate : ethers.BigNumber.from("242427000000000000000000000"),
    mintRateDenominator : ethers.BigNumber.from("1000000000000000000")
}

// goerli
let uniswapInfo_goerli = {
    poolfactory: "0x1F98431c8aD98523631AE4a59f267346ea31F984",
    npm: "0xC36442b4a4522E871399CD717aBDD847Ab11FE88",
    swapRouter: "0xE592427A0AEce92De3Edee1F18E0157C05861564",
    wethUsdcPool: "",
    wtonWethPool: "",
    wtonTosPool: "",
    tosethPool: "0x3b466f5d9b49aedd65f6124d5986a9f30b1f5442",
    wton: "0xe86fCf5213C785AcF9a8BFfEeDEfA9a2199f7Da6",
    tos: "0x67F3bE272b1913602B191B3A68F7C238A2D81Bb9",
    weth: "0xB4FBF271143F4FBf7B91A5ded31805e42b2208d6",
    usdc: "",
    fee: ethers.BigNumber.from("3000"),
    NonfungibleTokenPositionDescriptor: "0x91ae842A5Ffd8d12023116943e72A606179294f3",
    UniswapV3Staker: "0xe34139463bA50bD61336E0c446Bd8C0867c6fE65",
    ton: "0x68c1F9620aeC7F2913430aD6daC1bb16D8444F00",
    lockTOSaddr: "0x770e0d682277A4a9167971073f1Aa6d6403bb315",
    tosAdminAddress: "0x5b6e72248b19F2c5b88A4511A6994AD101d0c287",
    vestingVaultFactory: "0x4829bE5F6e7fdC7B7e38c7A16e6298Cb8D6d9693",
    initialLiquidityVaultFactory: "0x174e97B891701D207BD48087Fe9e3b3d10ed7c99",
    publicSaleFactory: "0x561e901F100A8C5338Cc988079f985b2C10bc72B",
    tonStakerFactory: "0xC3A41ff1AfCB1Fb5755aDdD68c5C01f77B4Efb7b",
    tosStakerFactory: "0xCEA6e5F2d46EaD8FA5E037b98bb6Bd1C766b9eC3",
    rewardVaultFactory: "0x02901517F8384f0c252a86D2Fff348D51748130d",
    daoVaultFactory: "0x4d3cF0B03326E549841330C425b23416F8075bce",
    marketiogVaultFactory: "0xe34016a9B533376465BDbAdFe93AE510507834d0",
    poolAddressCheck: "0x50b0C48403584d4D0f6758769b24e38c69A0D9C0"
}

let networkName = "local";
let uniswapInfo = uniswapInfo_goerli;

async function getUniswapInfo() {
    const { chainId } = await ethers.provider.getNetwork();

    if(chainId == 5) {
        networkName = "goerli";
        uniswapInfo = uniswapInfo_goerli;
    }
    uniswapInfo = uniswapInfo_goerli;

    return {
        chainId,
        networkName,
        tonAddress: uniswapInfo.ton,
        tosAddress: uniswapInfo.tos,
        tosAdminAddress: uniswapInfo.tosAdminAddress,
        uniswapV3FactoryAddress: uniswapInfo.poolfactory,
        NonfungiblePositionManager:  uniswapInfo.npm,
        uniswapInfo,
        config};
}


module.exports = {
    getUniswapInfo
}