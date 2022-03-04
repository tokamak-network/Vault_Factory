//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

//import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IERC20Minimal.sol";
import "../interfaces/IUniswapV3Pool.sol";
import "../interfaces/IUniswapV3Staker.sol";

contract RewardProgramVaultStorage  {

    struct IncentiveProgram {
        IUniswapV3Staker.IncentiveKey key;
        uint256 reward;
    }

    string public name;
    IERC20Minimal public token;  // project token

    //--
    IUniswapV3Pool public pool;
    IUniswapV3Staker public staker;
    mapping(uint256 => IncentiveProgram) programs;
    uint256 public totalProgramCount;
    uint256 startWaitTime;
    uint256 programDuration;
    //--

    uint256 public totalAllocatedAmount;

    uint256 public totalClaimCounts;

    uint256 public nowClaimRound = 0;

    uint256 public totalClaimsAmount;

    uint256[] public claimTimes;
    uint256[] public claimAmounts;
    uint256[] public addAmounts;

    bool public pauseProxy;

    mapping(uint256 => address) public proxyImplementation;
    mapping(address => bool) public aliveImplementation;
    mapping(bytes4 => address) public selectorImplementation;

}
