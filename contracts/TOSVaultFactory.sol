//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {TOSVaultProxy} from "./TOSVault/TOSVaultProxy.sol";
import "./interfaces/ITOSFactory.sol";
import "./VaultFactory.sol";
import "hardhat/console.sol";

/// @title A factory that creates a Vault
contract TOSVaultFactory is VaultFactory { 

    event CreatedTOSVault(address contractAddress, string name);

    address public owner;   

    /// @dev the fixed address of divided Pool
    address public dividedPoolProxy;

    function setinfo(
        address _dividedPool
    ) 
        external
        onlyOwner 
    {
        dividedPoolProxy = _dividedPool;
    }

    function create(
        string calldata _name,
        address _token,
        address _owner
    )
        external returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        TOSVaultProxy _proxy = new TOSVaultProxy();

        require(
            address(_proxy) != address(0),
            "proxy zero"
        );

        _proxy.addProxyAdmin(upgradeAdmin);
        _proxy.addAdmin(upgradeAdmin);
        _proxy.setImplementation2(vaultLogic, 0, true);

        _proxy.setBaseInfoProxy(_name, _token, _owner, dividedPoolProxy);

        _proxy.removeAdmin();
        _proxy.removeProxyAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        emit CreatedTOSVault(address(_proxy), _name);

        return address(_proxy);
    } 

    function changeDividedPool(
        address _dividedPool
    ) 
        external
        onlyOwner
    {
       dividedPoolProxy = _dividedPool;
    }
}