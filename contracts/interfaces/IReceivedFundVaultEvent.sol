//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IReceivedFundVaultEvent
interface IReceivedFundVaultEvent {

    /// @dev occur when claim function is executed
    /// @param caller caller
    /// @param to received address
    /// @param amount the amount for claim
    event Claimed(
        address caller,
        address to,
        uint256 amount
    );

    /// @dev occur when funding function is executed
    /// @param from caller
    /// @param amount the funding amount
    event Funded(
        address from,
        uint256 amount
    );
}
