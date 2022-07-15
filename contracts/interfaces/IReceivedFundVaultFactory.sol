//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface IReceivedFundVaultFactory {

    event CreatedReceivedFundVault(address contractAddress, string name);


    /// ###### only admin ######

    /// @dev set unoswap address , token address and pools addresses
    /// @param addrs [token, daoAddress]
    function setBaseInfo(
        address[2] calldata addrs
    )   external;


    /// ### anybody can use

    /// @dev Create a InitialLiquidityVaultProxy
    /// @param _name name
    /// @param publicSaleAddress publicSaleVault address
    /// @param receivedAddress the received fund address
    function create(
        string calldata _name,
        address publicSaleAddress,
        address receivedAddress
    )  external returns (address);
}
