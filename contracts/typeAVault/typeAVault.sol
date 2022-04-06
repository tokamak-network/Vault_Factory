//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./typeAVaultStorage.sol";

import "../common/ProxyAccessCommon.sol";
import "../proxy/VaultStorage.sol";

contract typeAVault is typeAVaultStorage, VaultStorage, ProxyAccessCommon {
    using SafeERC20 for IERC20;

    event Claimed(
        address indexed caller,
        uint256 amount,
        uint256 totalClaimedAmount
    );        

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "Vault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value > 0, "Vault: zero value");
        _;
    }

    ///@dev constructor
    constructor() {

    }

    function initialize(
        uint256[4] calldata _basicSet,
        uint256[2] calldata _firstSet,
        bool _check
    ) external onlyOwner {
        require(_basicSet[0] <= IERC20(token).balanceOf(address(this)), "need to input the token");
        if(settingCheck == true) {
            require(block.timestamp < startTime, "over time");
            if(diffClaimCheck == true) {
                require(block.timestamp < firstClaimTime, "over time");
            }
        }
        totalAllocatedAmount = _basicSet[0];
        totalClaimCounts = _basicSet[1];
        startTime = _basicSet[2];
        claimPeriodTimes = _basicSet[3];

        if(_check == true) {
            firstClaimSetting(_firstSet[0],_firstSet[1]);
        }

        settingCheck = true;
    }

    function firstClaimSetting(uint256 _amount, uint256 _time)
        public
        onlyOwner
        nonZero(_amount)
        nonZero(_time)
    {
        diffClaimCheck = true;
        firstClaimAmount = _amount;
        firstClaimTime = _time;
    }

    function currentRound() public view returns (uint256 round) {
        if(diffClaimCheck) {
            if (block.timestamp < firstClaimTime) {
                round = 0;
            } else if(block.timestamp < startTime) {
                round = 1;
            } else {
                round = (block.timestamp - startTime) / claimPeriodTimes;
                round = round + 2;
            }
        } else {
            if (block.timestamp < startTime) {
                round = 0;
            } else {
                round = (block.timestamp - startTime) / claimPeriodTimes;
                round++;
            }
        }
    }

    function calcalClaimAmount(uint256 _round) public view returns (uint256 amount) {
        uint256 remainAmount;
        if(diffClaimCheck && _round == 1) {
            amount = firstClaimAmount;
        } else if(diffClaimCheck){
            remainAmount = totalAllocatedAmount - firstClaimAmount;
            amount = remainAmount/(totalClaimCounts-1);
        } else {
            remainAmount = totalAllocatedAmount;
            amount = remainAmount/totalClaimCounts;
        }
    }

    function claim(address _account)
        external
        onlyOwner
    {
        uint256 count = 0;
        uint256 time;

        if(diffClaimCheck){
            time = firstClaimTime;
        } else {
            time = startTime;
        }
        require(block.timestamp > time, "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");

        uint256 curRound = currentRound();
        uint256 amount = calcalClaimAmount(curRound);

        require(curRound != nowClaimRound,"Vault: already get this round");

        if(curRound != 1 && diffClaimCheck && totalClaimsAmount < firstClaimAmount) {
            count = curRound - nowClaimRound;
            amount = (amount * (count-1)) + firstClaimAmount;
        } else if (curRound >= totalClaimCounts) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            count = curRound - nowClaimRound;
            amount = (amount * count);
        }

        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: dont have token");

        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;
        IERC20(token).safeTransfer(_account, amount);

        emit Claimed(msg.sender, amount, totalClaimsAmount);
    }

    function withdraw(address _account, uint256 _amount)
        external    
        onlyOwner
    {
        require(IERC20(token).balanceOf(address(this)) >= _amount,"Vault: dont have token");
        IERC20(token).safeTransfer(_account, _amount);
    }
}
