//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VestingPublicFundStorage.sol";
import "../proxy/VaultStorage.sol";
import "../common/ProxyAccessCommon.sol";

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../interfaces/IVestingPublicFundAction.sol";
import "../interfaces/IVestingPublicFundEvent.sol";
// import "hardhat/console.sol";

interface IIUniswapV3Pool {
    function slot0()
        external
        view
        returns (
            uint160 sqrtPriceX96,
            int24 tick,
            uint16 observationIndex,
            uint16 observationCardinality,
            uint16 observationCardinalityNext,
            uint8 feeProtocol,
            bool unlocked
        );
}

contract VestingPublicFund is
    VestingPublicFundStorage, VaultStorage, ProxyAccessCommon, IVestingPublicFundAction, IVestingPublicFundEvent
{
    // using SafeERC20 for IERC20;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "Vault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value != 0, "Vault: zero value");
        _;
    }

    ///@dev constructor
    constructor() {

    }

    /// @inheritdoc IVestingPublicFundAction
    function changeAddr(
        address _token,
        address _tosToken,
        address _receivedAddress,
        address _publicSaleVaultAddress,
        address _projectToken,
        uint24 _fee
    )
        external override onlyProxyOwner
        nonZeroAddress(_token)
        nonZeroAddress(_tosToken)
        nonZeroAddress(_receivedAddress)
        nonZeroAddress(_publicSaleVaultAddress)
        nonZeroAddress(_projectToken)
    {
        token = _token;
        tosToken = _tosToken;
        receivedAddress = _receivedAddress;
        publicSaleVaultAddress = _publicSaleVaultAddress;
        projectToken = _projectToken;
        fee = _fee;
    }

    /// @inheritdoc IVestingPublicFundAction
    function ownerSetting(
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
        _initialize(_claimTimes, _claimAmounts);
        if(settingCheck != true) settingCheck = true;
    }

    /// @inheritdoc IVestingPublicFundAction
    function initialize(
        address _publicSaleVault,
        address _projectToken,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts,
        uint24 _fee
    )
        external
        override
        nonZeroAddress(_publicSaleVault)
        nonZeroAddress(_projectToken)
    {
        require(msg.sender == receivedAddress || isAdmin(msg.sender), "caller is not receivedAddress or admin");
        require(settingCheck != true, "Already initalized");
        publicSaleVaultAddress = _publicSaleVault;
        projectToken = _projectToken;
        fee = _fee;
        _initialize(_claimTimes, _claimAmounts);
        settingCheck = true;
    }

    function _initialize(
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts
    )
        internal
    {
        require(_claimTimes.length != 0,
                "claimCounts must be greater than zero");

        require(_claimTimes.length == _claimAmounts.length,
                "_claimTimes and _claimAmounts length do not match");

        uint256 _claimCounts = _claimTimes.length;

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
    function claim() public override
    {
        require(currentSqrtPriceX96() != 0, "pool's current sqrtPriceX96 is zero.");

        require(claimTimes[0] != 0 && block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        _claim();
    }

    function _claim() internal
    {
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
        require(currentSqrtPriceX96() != 0, "pool's current sqrtPriceX96 is zero.");
        require(claimTimes.length != 0, "set up a claim round for vesting");

        require(msg.sender == publicSaleVaultAddress, "caller is not publicSaleVault.");
        require(IERC20(token).allowance(publicSaleVaultAddress, address(this)) >= amount, "funding: insufficient allowance");

        totalAllocatedAmount += amount;
        IERC20(token).transferFrom(publicSaleVaultAddress, address(this), amount);

        emit Funded(msg.sender, amount);

        uint256 curRound = currentRound();

        if (curRound > 0 && calculClaimAmount(curRound) > 0 && totalAllocatedAmount > totalClaimsAmount) {
            _claim();
        }
    }

    function getPoolAddress() public view returns (address pool)
    {
        bytes32 POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

        if (tosToken == address(0) || projectToken == address(0) || fee == 0
            || uniswapV3Factory == address(0) )  return address(0);

        address token0 = tosToken;
        address token1 = projectToken;
        if (tosToken > projectToken) {
            token0 = projectToken;
            token1 = tosToken;
        }

        pool = address(
            uint160(
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex'ff',
                        uniswapV3Factory,
                        keccak256(abi.encode(token0, token1, fee)),
                        POOL_INIT_CODE_HASH
                    )
                )
            ))
        );
    }

    function currentSqrtPriceX96() public view returns (uint160 sqrtPriceX96)
    {
        sqrtPriceX96 = 0;
        address pool = getPoolAddress();
        if (pool != address(0) && isContract(pool)) {
            // (,tick,,,,,) = IIUniswapV3Pool(pool).slot0();
            (sqrtPriceX96,,,,,,) = IIUniswapV3Pool(pool).slot0();
        }
    }

    function isContract(address _addr) public view returns (bool _isContract) {
        uint32 size;
        assembly {
            size := extcodesize(_addr)
        }
        return (size > 0);
    }
}