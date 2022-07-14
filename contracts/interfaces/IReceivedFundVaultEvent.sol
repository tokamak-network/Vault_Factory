//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IReceivedFundVaultEvent
interface IReceivedFundVaultEvent {

    /// @dev claim
    /// @param caller caller
    /// @param to received address
    /// @param amount the amount for claim
    event Claimed(
        address caller,
        address to,
        uint256 amount
    );
}
