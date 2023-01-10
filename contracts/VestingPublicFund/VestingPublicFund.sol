//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VestingPublicFundStorage.sol";
import "../proxy/VaultStorage.sol";
import "../common/ProxyAccessCommon.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IVestingPublicFundAction.sol";
import "../interfaces/IVestingPublicFundEvent.sol";

contract VestingPublicFund
    is
    VestingPublicFundStorage, VaultStorage, ProxyAccessCommon, IVestingPublicFundAction, IVestingPublicFundEvent
{
    // using SafeERC20 for IERC20;

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

    /// @inheritdoc IVestingPublicFundAction
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

    /// @inheritdoc IVestingPublicFundAction
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

    /// @inheritdoc IVestingPublicFundAction
    function setVestingPause(bool _pause)
        external override onlyOwner
    {
        require(vestingPause != _pause, "Vesting is already paused");
        vestingPause = _pause;

        emit SetVestingPaused(_pause);
    }


    /// @inheritdoc IVestingPublicFundAction
    function setVestingStop()
        external override onlyOwner
    {
        require(!vestingStop, "Vesting is already stopped");
        vestingStop = true;

        emit SetVestingStopped();
    }

    /// @inheritdoc IVestingPublicFundAction
    function withdraw(address to, uint256 amount)
        external override onlyOwner
        nonZeroAddress(to)
        nonZero(amount)
    {
        require(vestingStop == true, "Vesting is still in effect");

        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: insufficient balance");

        IERC20(token).transfer(to, amount);

        emit Withdrawals(to, amount);
    }

    /// @inheritdoc IVestingPublicFundAction
    function initialize(
        address _publicSaleVault,
        uint256 _claimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        external
        override
        nonZeroAddress(_publicSaleVault)
    {
        require(msg.sender ==  receivedAddress, "caller is not receivedAddress");
        require(settingCheck != true, "Already initalized");
        publicSaleVaultAddress = _publicSaleVault;
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
        require(_claimCounts > 0,
                "claimCounts must be greater than zero");

        require(_claimCounts == _claimTimes.length && _claimCounts == _claimAmounts.length,
                "_claimTimes and _claimAmounts length do not match");

        require(_claimAmounts[_claimCounts-1] == 100, "Final claimAmounts is not 100%");

        uint256 i = 0;
        for (i = 1; i < _claimCounts; i++) {
            require(_claimTimes[i-1] > block.timestamp && _claimTimes[i] > _claimTimes[i-1], "claimTimes should not be decreasing");
            require(_claimAmounts[i] > _claimAmounts[i-1], "claimAmounts should not be decreasing");
        }

        totalClaimCounts = _claimCounts;

        claimTimes = new uint256[](_claimCounts);
        claimAmounts = new uint256[](_claimCounts);

        for(i = 0; i < _claimCounts; i++) {
            claimTimes[i] = _claimTimes[i];
            claimAmounts[i] = _claimAmounts[i];
        }

        emit Initialized(_claimCounts, _claimTimes, _claimAmounts);
    }

    /// @inheritdoc IVestingPublicFundAction
    function currentRound() public override view returns (uint256 round) {
        if(claimTimes.length == 0) return 0;
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

    /// @inheritdoc IVestingPublicFundAction
    function calculClaimAmount(uint256 _round) public override view returns (uint256 amount) {
        if (currentRound() == 0) return 0;
        if (totalClaimCounts == 0 || totalAllocatedAmount == 0) return 0;
        if (totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            amount = (totalAllocatedAmount * claimAmounts[_round-1] / 100) - totalClaimsAmount;
        }
    }

    /// @inheritdoc IVestingPublicFundAction
    function claim() external override nonVestingPause nonVestingStop
    {
        require(claimTimes[0] > 0 && block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        uint256 curRound = currentRound();
        uint256 amount = calculClaimAmount(curRound);
        require(amount > 0, "claimable amount is zero");
        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: insufficient balance");

        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;

        IERC20(token).transfer(receivedAddress, amount);

        emit Claimed(msg.sender, receivedAddress, amount);
    }

    /// @inheritdoc IVestingPublicFundAction
    function funding(uint256 amount) external override
    {
        require(msg.sender == publicSaleVaultAddress, "caller is not publicSaleVault.");
        require(IERC20(token).allowance(publicSaleVaultAddress, address(this)) >= amount, "insufficient allowance");

        totalAllocatedAmount += amount;
        IERC20(token).transferFrom(publicSaleVaultAddress, address(this), amount);

        emit Funded(msg.sender, amount);
    }

}