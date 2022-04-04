//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TONVaultStorage.sol";

import "../common/ProxyAccessCommon.sol";
import "../interfaces/ITokenDividendPool.sol";
import "../proxy/VaultStorage.sol";


contract TONVault is TONVaultStorage, VaultStorage, ProxyAccessCommon {
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

    ///@dev initialization function
    ///@param _totalAllocatedAmount total allocated amount           
    ///@param _claimCounts total claim Counts
    ///@param _claimTimes each claimTime
    ///@param _claimAmounts each claimAmount
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts
    ) external onlyOwner {
        require(_totalAllocatedAmount <= IERC20(token).balanceOf(address(this)), "need to input the token");
        if(settingCheck == true) {
            require(block.timestamp < _claimTimes[0], "over time");
        }        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;
        uint256 i = 0;
        for(i = 0; i < _claimCounts; i++) {
            claimTimes.push(_claimTimes[i]);
            claimAmounts.push(_claimAmounts[i]);
        }
        settingCheck = true;
        IERC20(token).approve(dividiedPool,totalAllocatedAmount);
    }

    function changeToken(address _token) external onlyOwner {
        token = _token;
    }

    function currentRound() public view returns (uint256 round) {
        if(block.timestamp < claimTimes[0]){
            round = 0;
        }
        if (block.timestamp > claimTimes[totalClaimCounts-1]) {
            round = totalClaimCounts;
        }
        for(uint256 i = totalClaimCounts; i > 0; i--) {
            if(block.timestamp < claimTimes[i-1]) {
                round = i-1;
            }
        }
    }

    function calculClaimAmount(uint256 _round) public view returns (uint256 amount) {
        if (totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } 
        uint256 expectedClaimAmount;
        for (uint256 i = 0; i < _round; i++) {
           expectedClaimAmount = expectedClaimAmount + claimAmounts[i];
        }
        amount = expectedClaimAmount - totalClaimsAmount;
    }

    function claim()
        external
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        uint256 curRound = currentRound();
        uint256 amount = calculClaimAmount(curRound);

        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: dont have token");
        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;
        ITokenDividendPool(dividiedPool).distribute(token, amount);

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
