//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface ILiquidityVaultEvent {

    /// @dev An event emitted when a project token is used in the vault, or when the mint, liquidity increase function is called.
    /// @param tokenId tokenId
    /// @param amount Amount of project token used
    /// @param totalClaimsAmount  totalClaimsAmount
    event Claimed(uint256 indexed tokenId, uint256 amount, uint256 totalClaimsAmount);


    /// @dev Emitted when call mintToken function. Provide liquidity to uniswap V3 and receive LP tokens.
    /// @param caller caller address
    /// @param tokenId tokenId
    /// @param liquidity provide liquidity
    /// @param amount0 Amount of token0 used while increasing liquidity
    /// @param amount1 Amount of token1 used while increasing liquidity
    event MintedInVault(
        address indexed caller,
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0,
        uint256 amount1
    );

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

    /// @notice Emitted when liquidity is increased for a position NFT
    /// @dev Also emitted when a token is minted
    /// @param tokenId The ID of the token for which liquidity was increased
    /// @param liquidity The amount by which liquidity for the NFT position was increased
    /// @param amount0 The amount of token0 that was paid for the increase in liquidity
    /// @param amount1 The amount of token1 that was paid for the increase in liquidity
    event IncreaseLiquidityInVault(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);


    /// @notice Emitted when liquidity is decreased for a position NFT
    /// @param tokenId The ID of the token for which liquidity was decreased
    /// @param liquidity The amount by which liquidity for the NFT position was decreased
    /// @param amount0 The amount of token0 that was accounted for the decrease in liquidity
    /// @param amount1 The amount of token1 that was accounted for the decrease in liquidity
    event DecreaseLiquidityInVault(uint256 indexed tokenId, uint128 liquidity, uint256 amount0, uint256 amount1);


    /// @notice Emitted when tokens are collected for a position NFT
    /// @dev The amounts reported may not be exactly equivalent to the amounts transferred, due to rounding behavior
    /// @param tokenId The ID of the token for which underlying tokens were collected
    /// @param amount0 The amount of token0 owed to the position that was collected
    /// @param amount1 The amount of token1 owed to the position that was collected
    event CollectInVault(uint256 indexed tokenId, uint256 amount0, uint256 amount1);

}
