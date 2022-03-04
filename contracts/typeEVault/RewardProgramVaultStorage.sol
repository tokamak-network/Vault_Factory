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

    IERC20Minimal public token;  // project token

    IUniswapV3Pool public pool;
    IUniswapV3Staker public staker;
    mapping(uint256 => IncentiveProgram) public programs;
    uint256 public totalProgramCount;
    uint256 public startWaitTime;
    uint256 public programDuration;
}
