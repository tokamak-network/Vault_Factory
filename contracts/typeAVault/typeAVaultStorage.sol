//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


contract typeAVaultStorage {
    string public name;

    address public token;

    bool public diffClaimCheck;

    address public owner;

    uint256 public firstClaimAmount = 0;
    uint256 public firstClaimTime;         

    uint256 public totalAllocatedAmount;   

    uint256 public startTime;               
    uint256 public claimPeriodTimes;       
    uint256 public totalClaimCounts;      

    uint256 public nowClaimRound = 0;      

    uint256 public totalClaimsAmount;  
}
