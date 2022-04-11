//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {TypeAVaultProxy} from "./TypeAVault/TypeAVaultProxy.sol";
import "./interfaces/IEventLog.sol";
import "./interfaces/ITypeAVaultFactory.sol";
import "./VaultFactory.sol";

/// @title A factory that creates a Vault
contract TypeAVaultFactory is VaultFactory, ITypeAVaultFactory { 

    event CreatedTypeAVault(address contractAddress, string name);

    function createTypeA(
        string calldata _name,
        address _token,
        address _owner
    )
        external 
        override
        returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        TypeAVaultProxy typeA = new TypeAVaultProxy();

        require(
            address(typeA) != address(0),
            "typeA zero"
        );

        typeA.addProxyAdmin(upgradeAdmin);
        typeA.addAdmin(upgradeAdmin);
        typeA.setImplementation2(vaultLogic, 0, true);

        typeA.setBaseInfoProxy(
            _name,
            _token,
            _owner
        );

        typeA.removeAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(typeA), _name);
        totalCreatedContracts++;


        IEventLog(logEventAddress).logEvent(
            keccak256("TypeAVaultFactory"),
            keccak256("CreatedTypeAVault"),
            address(this),
            abi.encode(address(typeA), _name));

        emit CreatedTypeAVault(address(typeA), _name);

        return address(typeA);
    } 
}