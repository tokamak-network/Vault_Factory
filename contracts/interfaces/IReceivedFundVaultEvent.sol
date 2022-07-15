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

    /// @dev occur when initialize function is executed
    /// @param _claimCounts the total count of round
    /// @param _claimTimes the start time of each claim round
    /// @param _claimAmounts Cumulative claimable percentage for each round
    event Initialized(
        uint256 _claimCounts,
        uint256[] _claimTimes,
        uint256[] _claimAmounts
    );

    /// @dev occur when setVestingPause function is executed
    event SetVestingPaused(bool _pause);


    /// @dev occur when setMinimumClaimPeriod function is executed
    event SetMinimumClaimPeriod(uint16 _period);


    /// @dev occur when setMinimumClaimCounts function is executed
    event SetMinimumClaimCounts(uint16 _count);

    /// @dev occur when setVestingStop function is executed
    event SetVestingStopped();

    /// @dev occur when withdraw function is executed
    event Withdrawals(address to, uint256 amount);

}
