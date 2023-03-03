//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface IVestingPublicFundFactory {

    event CreatedVestingPublicFund(address contractAddress, string name);


    /// ###### only admin ######

    /// @dev set addresses
    /// @param addrs [ton token, tos token, daoAddress, uniswapV3Factory, initializer]
    function setBaseInfo(
        address[5] calldata addrs
    )   external;


    /// ### anybody can use

    /// @dev Create a InitialLiquidityVaultProxy
    /// @param _name name
    /// @param receivedAddress the received fund address
    function create(
        string calldata _name,
        address receivedAddress
    )  external returns (address);
}
