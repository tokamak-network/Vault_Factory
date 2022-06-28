//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/IInitialLiquidityVaultEvent.sol";
import "../interfaces/IInitialLiquidityVaultAction.sol";

import "../libraries/TickMath.sol";
import "../libraries/OracleLibrary.sol";
import '../libraries/FixedPoint96.sol';
import '../libraries/FullMath.sol';

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./InitialLiquidityVaultStorage.sol";

import "../proxy/VaultStorage.sol";
import "../common/ProxyAccessCommon.sol";

//import "hardhat/console.sol";

interface I2ERC20 {
    function decimals() external view returns (uint256);
}

interface IIUniswapV3Pool {

    function token0() external view returns (address);
    function token1() external view returns (address);

    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );

    function positions(bytes32 key)
        external
        view
        returns (
            uint128 _liquidity,
            uint256 feeGrowthInside0LastX128,
            uint256 feeGrowthInside1LastX128,
            uint128 tokensOwed0,
            uint128 tokensOwed1
        );

    function observe(uint32[] calldata secondsAgos)
        external
        view
        returns (int56[] memory tickCumulatives, uint160[] memory secondsPerLiquidityCumulativeX128s);


}

contract InitialLiquidityVaultIncrease is
    InitialLiquidityVaultStorage,
    VaultStorage,
    ProxyAccessCommon,
    IInitialLiquidityVaultEvent
{
    using SafeERC20 for IERC20;

    ///@dev constructor
    constructor() {
    }

    function checkBalance(uint256 tosBalance, uint256 tokenBalance) internal  {
        require(TOS.balanceOf(address(this)) >= tosBalance, "tos is insufficient.");
        require(token.balanceOf(address(this)) >= tokenBalance, "token is insufficient.");
         if(tosBalance > TOS.allowance(address(this), address(NonfungiblePositionManager)) ) {
                require(TOS.approve(address(NonfungiblePositionManager),TOS.totalSupply()),"TOS approve fail");
        }

        if(tokenBalance > token.allowance(address(this), address(NonfungiblePositionManager)) ) {
            require(token.approve(address(NonfungiblePositionManager),token.totalSupply()),"token approve fail");
        }
    }

    function increaseLiquidity(uint256 tosAmount, uint8 slippage, int24 curTick) external
    {
        require(lpToken > 0, "It is not minted yet");

        (uint160 sqrtPriceX96, int24 tick,,,,,) =  pool.slot0();
        require(tick == curTick, "already tick was changed.");
        require(slippage > 0 && slippage < 10, "It is not allowed slippage.");

        uint256 tosBalance =  TOS.balanceOf(address(this));
        uint256 tokenBalance =  token.balanceOf(address(this));
        require(tosBalance > 1 ether || tokenBalance > 1 ether, "balance is insufficient");
        require(tosAmount <= tosBalance, "toBalance is insufficient");

        uint256 amount0Min = 0;
        uint256 amount1Min = 0;
        uint256 amount0Desired = 0;
        uint256 amount1Desired = 0;

        if(token0Address != address(TOS)){
            amount0Desired = tosAmount * getPriceToken1(address(pool)) / (10 ** 18);
            amount1Desired = tosAmount;
            require(amount0Desired <= tokenBalance, "tokenBalance is insufficient");
            checkBalance(amount1Desired, amount0Desired);
        } else {
            amount0Desired = tosAmount;
            amount1Desired = tosAmount * getPriceToken0(address(pool)) / (10 ** 18);
            require(amount1Desired <= tokenBalance, "tokenBalance is insufficient");
            checkBalance(amount0Desired, amount1Desired);
        }

        uint8 _slip = slippage;
        uint256 price = getPriceX96FromSqrtPriceX96(sqrtPriceX96);

        amount0Min = amount0Desired * uint256(slippage) / 100;
        amount1Min = amount1Desired * uint256(slippage) / 100;

        (uint128 liquidity, uint256 amount0, uint256 amount1) = NonfungiblePositionManager.increaseLiquidity(INonfungiblePositionManager.IncreaseLiquidityParams(
                lpToken, amount0Desired, amount1Desired, amount0Min, amount1Min, block.timestamp + 1000));

        (uint160 sqrtPriceX961, int24 tick1,,,,,) =  pool.slot0();
        uint256 price1 = getPriceX96FromSqrtPriceX96(sqrtPriceX961);

        uint256 lower = price * ( 1000 - (_slip * 1000 / 200) ) / 1000 ;
        uint256 upper = price * ( 1000 + (_slip * 1000 / 200) ) / 1000 ;

        require(lower <= price1 && price1 < upper, "out of acceptable price range");

        emit IncreaseLiquidityInVault(lpToken, liquidity, amount0, amount1);
    }


    function getPriceToken0(address poolAddress) public view returns (uint256 priceX96) {

        (, int24 tick, , , , ,) = IIUniswapV3Pool(poolAddress).slot0();
        (uint256 token0Decimals, ) = getDecimals(
            IIUniswapV3Pool(poolAddress).token0(),
            IIUniswapV3Pool(poolAddress).token1()
            );

        priceX96 = OracleLibrary.getQuoteAtTick(
             tick,
             uint128(10**token0Decimals),
             IIUniswapV3Pool(poolAddress).token0(),
             IIUniswapV3Pool(poolAddress).token1()
             );
    }

    function getPriceToken1(address poolAddress) public view returns(uint256 priceX96) {

        (, int24 tick, , , , ,) = IIUniswapV3Pool(poolAddress).slot0();
        (, uint256 token1Decimals) = getDecimals(
            IIUniswapV3Pool(poolAddress).token0(),
            IIUniswapV3Pool(poolAddress).token1()
            );

        priceX96 = OracleLibrary.getQuoteAtTick(
             tick,
             uint128(10**token1Decimals),
             IIUniswapV3Pool(poolAddress).token1(),
             IIUniswapV3Pool(poolAddress).token0()
             );
    }

    function getDecimals(address token0, address token1) public view returns(uint256 token0Decimals, uint256 token1Decimals) {
        return (I2ERC20(token0).decimals(), I2ERC20(token1).decimals());
    }

    function getPriceX96FromSqrtPriceX96(uint160 sqrtPriceX96) public view returns(uint256 priceX96) {
        return FullMath.mulDiv(sqrtPriceX96, sqrtPriceX96, FixedPoint96.Q96);
    }

    function currentTick() public view returns(uint160 sqrtPriceX96, int24 tick) {
        (uint160 sqrtPriceX96, int24 tick,,,,,) =  pool.slot0();
        return (sqrtPriceX96, tick);
    }

}
