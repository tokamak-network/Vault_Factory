//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../interfaces/IRewardProgramVaultEvent.sol";
import "../interfaces/IRewardProgramVaultAction.sol";
import "../interfaces/IUniswapV3Staker.sol";

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../common/ProxyAccessCommon.sol";
import "./RewardProgramVaultStorage.sol";
import "hardhat/console.sol";

contract RewardProgramVault is
    RewardProgramVaultStorage,
    ProxyAccessCommon,
    IRewardProgramVaultEvent,
    IRewardProgramVaultAction
{
    using SafeERC20 for IERC20;
    //using SafeMath for uint256;

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

    /// @inheritdoc IRewardProgramVaultAction
    function changeToken(address _token) external override onlyOwner nonZeroAddress(_token) {
        require(totalClaimCounts == 0, "already set claim info, cannot change token.");
        token = IERC20Minimal(_token);
    }

    /// @inheritdoc IRewardProgramVaultAction
    function changeStaker(address _staker) external override onlyOwner nonZeroAddress(_staker) {
        staker = IUniswapV3Staker(_staker);
    }

    /// @inheritdoc IRewardProgramVaultAction
    function changePool(address _pool) external override onlyOwner nonZeroAddress(_pool) {
        pool = IUniswapV3Pool(_pool);
    }

    /// @inheritdoc IRewardProgramVaultAction
    function changeSetting(uint256 _startWaitTime, uint256 _programDuration)
        external override onlyOwner
        nonZero(_startWaitTime)
        nonZero(_programDuration)
    {
        startWaitTime = _startWaitTime;
        programDuration = _programDuration;
    }

    /// @inheritdoc IRewardProgramVaultAction
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts

    ) external override onlyOwner {

        require(totalClaimCounts == 0 || block.timestamp < claimTimes[0], "already set");
        require(_totalAllocatedAmount <= token.balanceOf(address(this)), "need to input the token");
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;

        for(uint256 i = 0; i < _claimCounts; i++) {
            if(claimTimes.length <= i)  claimTimes.push(_claimTimes[i]);
            else claimTimes[i] = _claimTimes[i];
             //console.log("claimTimes['%s'] : '%s', _claimTimes[i] : '%s'", i, claimTimes[i], _claimTimes[i]);
            if(claimTimes.length <= i) claimAmounts.push(_claimAmounts[i]);
            else claimAmounts[i]= _claimAmounts[i];
            //console.log("claimAmounts['%s'] : '%s', _claimAmounts[i] : '%s'", i, claimTimes[i], _claimTimes[i]);

            if(addAmounts.length <= i)  addAmounts.push(0);
            else addAmounts[i] = 0;
        }

        emit Initialized(_totalAllocatedAmount, _claimCounts, _claimTimes, _claimAmounts);
    }

    /// @inheritdoc IRewardProgramVaultAction
    function currentRound() public view override returns (uint256 round) {
        for(uint256 i = totalClaimCounts; i > 0; i--) {
            if(block.timestamp < claimTimes[0]){
                round = 0;
            } else if(block.timestamp < claimTimes[i-1] && i != 0) {
                round = i-1;
            } else if (block.timestamp > claimTimes[totalClaimCounts-1]) {
                round = totalClaimCounts;
            }
        }
    }

    /// @inheritdoc IRewardProgramVaultAction
    function getClaimInfo() public view override returns (
        uint256 _totalClaimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts,
        uint256 _totalClaimsAmount,
        uint256[] memory _addAmounts
        ) {

        return (totalClaimCounts, claimTimes, claimAmounts, totalClaimsAmount, addAmounts) ;
    }

    /// @inheritdoc IRewardProgramVaultAction
    function availableUseAmount(uint256 _round) public view override returns (uint256 amount) {
        uint256 expectedClaimAmount;
        for(uint256 i = 0; i < _round; i++) {
           expectedClaimAmount = expectedClaimAmount + claimAmounts[i] + addAmounts[i];
        }
        if(_round == 1 ) {
            amount = claimAmounts[0] - totalClaimsAmount;
        } else if(totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            amount = expectedClaimAmount - totalClaimsAmount;
        }
    }

    function createIncentive(IUniswapV3Staker.IncentiveKey memory key, uint256 reward) internal  {
        staker.createIncentive(key, reward);
        uint256 idx = totalProgramCount;
        programs[idx] = IncentiveProgram(key, reward);
        totalProgramCount++;

        emit IncentiveCreatedByRewardProgram(idx, key.rewardToken, key.pool, key.startTime, key.endTime, key.refundee, reward);
    }

    /// @inheritdoc IRewardProgramVaultAction
    function createProgram()
        public override
        nonZeroAddress(address(pool))
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        nowClaimRound = currentRound();
        uint256 amount = availableUseAmount(nowClaimRound);
        require(amount > 0, "claimable token is zero");

        createIncentive(IUniswapV3Staker.IncentiveKey(
            token,
            pool,
            block.timestamp + startWaitTime,
            block.timestamp + startWaitTime + programDuration,
            address(this)
            ),
            amount
        );
        totalClaimsAmount += amount;
    }

}
