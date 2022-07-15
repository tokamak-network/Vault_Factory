//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface IReceivedFundVaultFactory {

    event CreatedReceivedFundVault(address contractAddress, string name);


    /// ###### only admin ######

    /// @dev set unoswap address , token address and pools addresses
    /// @param addrs [token, daoAddress]
    /// @param _minimumClaimCounts  _minimumClaimCounts
    /// @param _minimumClaimPeriod _minimumClaimPeriod
    function setBaseInfo(
        address[2] calldata addrs,
        uint16 _minimumClaimCounts,
        uint16 _minimumClaimPeriod
    )   external;


    /// ### anybody can use

    /// @dev Create a InitialLiquidityVaultProxy
    /// @param _name name
    /// @param publicSaleAddress publicSaleVault address
    function create(
        string calldata _name,
        address publicSaleAddress
    )  external returns (address);
}
