//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {RewardProgramVaultProxy} from "./typeEVault/RewardProgramVaultProxy.sol";

import "./interfaces/IRewardProgramVaultFactory.sol";
import "./VaultFactory.sol";
// import "hardhat/console.sol";

/// @title A factory that creates a Vault
contract RewardProgramVaultFactory is VaultFactory, IRewardProgramVaultFactory{

    address public staker;

    /// @inheritdoc IRewardProgramVaultFactory
    function setStaker(
        address _staker
    )
        external override
        nonZeroAddress(_staker)
        onlyOwner
    {
        require(staker != _staker, "same staker");
        staker = _staker;
    }


    /// @inheritdoc IRewardProgramVaultFactory
    function create(
        string calldata _name,
        address pool,
        address rewardToken,
        address _admin,
        uint256 waitStartTime,
        uint256 programPeriod
    )
        external override
        returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        RewardProgramVaultProxy _proxy = new RewardProgramVaultProxy();

        require(
            address(_proxy) != address(0),
            "RewardProgramVaultProxy zero"
        );

        _proxy.addProxyAdmin(upgradeAdmin);
        _proxy.addAdmin(upgradeAdmin);
        _proxy.setImplementation2(vaultLogic, 0, true);
        _proxy.setLogEventAddress(logEventAddress, true);

        _proxy.setBaseInfoProxy(
            _name,
            pool,
            rewardToken,
            staker,
            _admin,
            waitStartTime,
            programPeriod
        );

        _proxy.removeAdmin();
        // _proxy.removeProxyAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        emit CreatedRewardProgramVault(address(_proxy), _name);

        return address(_proxy);
    }

}