//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./IERC20Minimal.sol";
import "./IUniswapV3Pool.sol";


/// @title IRewardProgramVaultEvent
interface IRewardProgramVaultEvent {

    /// @dev An event emitted when a project token is used in the vault, or when the mint, liquidity increase function is called.
    /// @param tokenId tokenId
    /// @param amount Amount of project token used
    /// @param totalClaimsAmount  totalClaimsAmount
    event Claimed(uint256 indexed tokenId, uint256 amount, uint256 totalClaimsAmount);


    /// @dev Emitted when call withdraw function. If the total allocated amount is all claimed, the remaining token balance can be transferred to the account by the owner.
    /// @param caller caller address
    /// @param tokenAddress token address
    /// @param to account
    /// @param amount amount
    event WithdrawalInVault(address caller, address tokenAddress, address to, uint256 amount);


    /// @dev Emitted when call initialize function. set claim information.
    /// @param _totalAllocatedAmount total allocated amount
    /// @param _claimCounts total claim Counts
    /// @param _claimTimes claimTime must be in ascending order from smallest to largest
    /// @param _claimAmounts The sum of _claimAmounts must equal _totalAllocatedAmount .
    event Initialized(uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] _claimTimes,
        uint256[] _claimAmounts);


    /// @notice Event emitted when a liquidity mining incentive has been created
    /// @param index program index
    /// @param rewardToken The token being distributed as a reward
    /// @param pool The Uniswap V3 pool
    /// @param startTime The time when the incentive program begins
    /// @param endTime The time when rewards stop accruing
    /// @param refundee The address which receives any remaining reward tokens after the end time
    /// @param reward The amount of reward tokens to be distributed
    event IncentiveCreatedByRewardProgram(
        uint256 index,
        IERC20Minimal indexed rewardToken,
        IUniswapV3Pool indexed pool,
        uint256 startTime,
        uint256 endTime,
        address refundee,
        uint256 reward
    );

}
