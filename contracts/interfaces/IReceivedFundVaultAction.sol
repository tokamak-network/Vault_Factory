//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IReceivedFundVaultAction
interface IReceivedFundVaultAction {

    /// ####### only ProxyOwner ##########

    /// @dev change base address information
    /// @param _token the fund token address (TON)
    /// @param _receivedAddress the sending address for claim
    /// @param _publicSaleVaultAddress  the public sale vault address
    function changeAddr(
        address _token,
        address _receivedAddress,
        address _publicSaleVaultAddress
    ) external ;

    /// @dev set function controlled by proxy owner
    /// @param _claimCounts total number of claims
    /// @param _claimTimes start time of each round
    /// @param _claimAmounts  Cumulative claimable percentage for each round (write based on 100)
    ///                       If it is 5% (0.05), enter 5 -> Divide by 100 for calculation
    function ownerSetting(
        uint256 _claimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    ) external;

    /// @dev set minimum claim counts
    /// @param _count the minimum claim counts
    function setMinimumClaimCounts(uint16 _count) external;

    /// ####### only owner ##########

    /// @dev set vesting pause flag
    /// @param _pause pause flag
    function setVestingPause(bool _pause) external;


    /// @dev set function controlled by proxy owner
    /// @param _claimCounts total number of claims
    /// @param _claimTimes start time of each round
    /// @param _claimAmounts  Cumulative claimable percentage for each round (write based on 100)
    ///                       If it is 5% (0.05), enter 5 -> Divide by 100 for calculation
    function initialize(
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts
    ) external ;


    /// ####### Only Public Sale Vault ##########

    /// @dev execute funding.
    function funding(uint256 amount) external;


    /// ####### Can Anybody ##########

    /// @dev return the current round
    function currentRound() external view returns (uint256 round) ;

    /// @dev return the amount that can be charged in a specific round
    function calculClaimAmount(uint256 _round) external view returns (uint256 amount);

    /// @dev execute claim.
    function claim() external;


}
