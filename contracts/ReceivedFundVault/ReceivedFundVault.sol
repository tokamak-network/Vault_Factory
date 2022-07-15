//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./ReceivedFundVaultStorage.sol";
import "../proxy/VaultStorage.sol";
import "../common/ProxyAccessCommon.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

import "../interfaces/IReceivedFundVaultAction.sol";
import "../interfaces/IReceivedFundVaultEvent.sol";

contract ReceivedFundVault
    is
    ReceivedFundVaultStorage, VaultStorage, ProxyAccessCommon, IReceivedFundVaultAction, IReceivedFundVaultEvent
{
    using SafeERC20 for IERC20;

    modifier nonVestingPause() {
        require(!vestingPause, "Vesting is paused");
        _;
    }

    modifier nonVestingStop() {
        require(!vestingStop, "Vesting is stopped");
        _;
    }

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

    /// @inheritdoc IReceivedFundVaultAction
    function changeAddr(
        address _token,
        address _receivedAddress,
        address _publicSaleVaultAddress
    )
        external override onlyProxyOwner
        nonZeroAddress(_token)
        nonZeroAddress(_receivedAddress)
        nonZeroAddress(_publicSaleVaultAddress)
    {
        token = _token;
        receivedAddress = _receivedAddress;
        publicSaleVaultAddress = _publicSaleVaultAddress;
    }

    /// @inheritdoc IReceivedFundVaultAction
    function ownerSetting(
        uint256 _claimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        external
        override
        onlyProxyOwner
    {
        if(settingCheck == true) {
            delete claimTimes;
            delete claimAmounts;
        }
        _initialize(_claimCounts, _claimTimes, _claimAmounts);
        if(settingCheck != true) settingCheck = true;
    }

    /// @inheritdoc IReceivedFundVaultAction
    function setMinimumClaimCounts(uint16 _count)
        external override onlyProxyOwner
    {
        require(_count > 0, "zero _count");
        require(minimumClaimCounts != _count, "same value");
        minimumClaimCounts = _count;

        emit SetMinimumClaimCounts(_count);
    }

    /// @inheritdoc IReceivedFundVaultAction
    function setMinimumClaimPeriod(uint16 _period)
        external override onlyProxyOwner
    {
        require(_period > 0, "zero _period");
        require(minimumClaimPeriod != _period, "same value");
        minimumClaimPeriod = _period;

        emit SetMinimumClaimPeriod(_period);
    }

    /// @inheritdoc IReceivedFundVaultAction
    function setVestingPause(bool _pause)
        external override onlyOwner
    {
        require(vestingPause != _pause, "same _pause");
        vestingPause = _pause;

        emit SetVestingPaused(_pause);
    }


    /// @inheritdoc IReceivedFundVaultAction
    function setVestingStop()
        external override onlyOwner
    {
        require(!vestingStop, "already stopped");
        vestingStop = true;

        emit SetVestingStopped();
    }

    /// @inheritdoc IReceivedFundVaultAction
    function withdraw(address to, uint256 amount)
        external override onlyOwner
        nonZeroAddress(to)
        nonZero(amount)
    {
        require(vestingStop == true, "it is not stop status.");

        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: balance is insufficient.");

        IERC20(token).safeTransferFrom(address(this), to, amount);

        emit Withdrawals(to, amount);
    }

    /// @inheritdoc IReceivedFundVaultAction
    function initialize(
        uint256 _claimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        external
        override
    {
        require(msg.sender ==  receivedAddress, "caller is not receivedAddress");
        require(settingCheck != true, "already set");
        _initialize(_claimCounts, _claimTimes, _claimAmounts);
        settingCheck = true;
    }

    function _initialize(
        uint256 _claimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        internal
    {
        require(_claimCounts > 0 && _claimCounts >= uint256(minimumClaimCounts),
                "claimCounts must be greater than minimumClaimCounts");

        require(_claimCounts == _claimTimes.length && _claimCounts == _claimAmounts.length,
                "wrong _claimTimes/_claimAmounts length");

        require(claimAmounts[0] < 50, "cannot claim more than 50% in the first round");

        require(claimAmounts[_claimCounts-1] == 100, "wrong last claimAmounts");

        uint256 i = 0;
        for (i = 1; i < _claimCounts; i++) {
            require(claimTimes[i] >= claimTimes[i-1] + uint256(minimumClaimPeriod), "wrong claimTimes");
            require(claimAmounts[i] > claimAmounts[i-1], "wrong claimAmounts");
        }

        totalClaimCounts = _claimCounts;

        claimTimes = new uint256[](_claimCounts);
        claimAmounts = new uint256[](_claimCounts);

        for(i = 0; i < _claimCounts; i++) {
            claimTimes[i] = _claimTimes[i];
            claimAmounts[i] = claimAmounts[i];
        }

        emit Initialized(_claimCounts, _claimTimes, _claimAmounts);
    }

    /// @inheritdoc IReceivedFundVaultAction
    function currentRound() public override view returns (uint256 round) {
        if(block.timestamp < claimTimes[0]){
            round = 0;
        }
        if (block.timestamp >= claimTimes[totalClaimCounts-1]) {
            round = totalClaimCounts;
        }

        for(uint256 i = 0; i < totalClaimCounts; i++) {
            if(claimTimes[i] <= block.timestamp) {
                round = i+1;
            } else {
                break;
            }
        }
    }

    /// @inheritdoc IReceivedFundVaultAction
    function calculClaimAmount(uint256 _round) public override view returns (uint256 amount) {
        if (currentRound() == 0) return 0;
        if (totalClaimCounts == 0 || totalAllocatedAmount == 0) return 0;
        if (totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            amount = (totalAllocatedAmount * claimAmounts[_round-1] / 100) - totalClaimsAmount;
        }
    }

    /// @inheritdoc IReceivedFundVaultAction
    function claim() external override nonVestingPause nonVestingStop
    {
        require(claimTimes[0] > 0 && block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        uint256 curRound = currentRound();
        uint256 amount = calculClaimAmount(curRound);
        require(amount > 0, "claimable amount is zero.");
        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: balance is insufficient.");

        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;

        // send TON to receivedAddress
        IERC20(token).safeTransferFrom(address(this), receivedAddress, amount);

        emit Claimed(msg.sender, receivedAddress, amount);
    }

    /// @inheritdoc IReceivedFundVaultAction
    function funding(uint256 amount) external override
    {
        require(msg.sender == publicSaleVaultAddress, "caller is not publicSaleVault.");
        require(IERC20(token).allowance(publicSaleVaultAddress, address(this)) >= amount, "allowance is insufficient.");

        totalAllocatedAmount += amount;
        IERC20(token).safeTransferFrom(publicSaleVaultAddress, address(this), amount);

        emit Funded(msg.sender, amount);
    }

}