//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IVestingPublicFundAction
interface IVestingPublicFundAction {

    /// ####### only ProxyOwner ##########

    /// @dev change base address information
    /// @param _token the fund token address (TON)
    /// @param _tosToken the tos token address
    /// @param _receivedAddress the sending address for claim
    /// @param _publicSaleVaultAddress  the public sale vault address
    /// @param _fee  the TON and project token pool's fee
    function changeAddr(
        address _token,
        address _tosToken,
        address _receivedAddress,
        address _publicSaleVaultAddress,
        address _projectToken,
        uint24 _fee
    ) external ;

    /// @dev set function controlled by proxy owner
    /// @param _claimTimes start time of each round
    /// @param _claimAmounts  Cumulative claimable percentage for each round (write based on 100)
    ///                       If it is 5% (0.05), enter 5 -> Divide by 100 for calculation
    function ownerSetting(
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    ) external;


    /// ####### only owner (DAO) ##########

    /// @dev set function controlled by proxy owner
    /// @param publicSaleAddress the publicSale contract address
    /// @param projectToken the project tokan address
    /// @param _claimTimes start time of each round
    /// @param _claimAmounts  Cumulative claimable percentage for each round (write based on 100)
    ///                       If it is 5% (0.05), enter 5 -> Divide by 100 for calculation
    /// @param _fee the TOS & project tokan 's pool's fee
    function initialize(
        address publicSaleAddress,
        address projectToken,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts,
        uint24 _fee
    ) external ;


    /// ####### Only Public Sale Vault ##########

    /// @dev Put PublicSaleVault's funds in the vault.
    /// @param amount the sending amount
    function funding(uint256 amount) external;


    /// ####### Can Anybody ##########

    /// @dev return the current round
    function currentRound() external view returns (uint256 round) ;

    /// @dev return the amount that can be charged in a specific round
    function calculClaimAmount(uint256 _round) external view returns (uint256 amount);

    /// @dev execute claim.
    function claim() external;


}
