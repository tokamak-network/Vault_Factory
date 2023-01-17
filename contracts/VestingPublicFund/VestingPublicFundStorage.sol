//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

contract VestingPublicFundStorage {
    address public token;
    address public tosToken;
    address public projectToken;
    address public uniswapV3Factory;

    address public receivedAddress;
    address public publicSaleVaultAddress;

    uint24  public fee;
    bool public settingCheck;
}
