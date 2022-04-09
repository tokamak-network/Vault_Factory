//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


contract TypeAVaultStorage {
    address public token;

    bool public diffClaimCheck;
    bool public settingCheck;

    address public owner;

    uint256 public firstClaimAmount = 0;
    uint256 public firstClaimTime;         

    uint256 public startTime;               
    uint256 public claimPeriodTimes;       
}
