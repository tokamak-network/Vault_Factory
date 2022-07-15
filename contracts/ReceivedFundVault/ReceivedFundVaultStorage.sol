//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

contract ReceivedFundVaultStorage {
    address public token;

    address public receivedAddress;
    address public publicSaleVaultAddress;

    bool public settingCheck;
    bool public vestingPause;

    uint16 public minimumClaimCounts;
    uint16 public minimumClaimPeriod;
}
