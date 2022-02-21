//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../interfaces/IUniswapV3Factory.sol";
import "../interfaces/IUniswapV3Pool.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/ISwapRouter.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract LiquidityVaultStorage  {
    string public name;

    IERC20 public token;  // project token

    IERC20 public WTON;  //  wton token
    IERC20 public TOS;  //  tos token

    IUniswapV3Pool public WETHUSDCPool;
    IUniswapV3Pool public WTONWETHPool;
    IUniswapV3Pool public WTONTOSPool;

    //--
    IUniswapV3Factory public UniswapV3Factory;
    INonfungiblePositionManager public NonfungiblePositionManager;
    ISwapRouter public SwapRouter;
    uint24 public fee;
    IUniswapV3Pool public pool;
    address public token0Address;
    address public token1Address;
    uint256 public initialTosPrice ;
    uint256 public initialTokenPrice ;
    uint160 public initSqrtPriceX96 ;
    uint256 constant INITIAL_PRICE_DIV = 1e18;
    int24 public tickIntervalMinimum;

    uint256[] public tokenIds;
    //--

    bool public settingCheck;
    address public owner;

    uint256 public totalAllocatedAmount;

    uint256 public totalClaimCounts;

    uint256 public nowClaimRound = 0;

    uint256 public totalClaimsAmount;

    uint256[] public claimTimes;
    uint256[] public claimAmounts;
    uint256[] public addAmounts;


    bool public pauseProxy;

}
