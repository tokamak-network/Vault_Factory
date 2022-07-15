//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VaultFactory.sol";

import {ReceivedFundVaultProxy} from "./ReceivedFundVault/ReceivedFundVaultProxy.sol";
import "./interfaces/IEventLog.sol";
import "./interfaces/IReceivedFundVaultFactory.sol";


/// @title A factory that creates a Vault
contract ReceivedFundVaultFactory is VaultFactory, IReceivedFundVaultFactory {

    address public token;
    address public daoAddress;

    constructor() {}

    /// @inheritdoc IReceivedFundVaultFactory
    function setBaseInfo(
        address[2] calldata addrs
    )   external override
        onlyOwner
        nonZeroAddress(addrs[0])
        nonZeroAddress(addrs[1])
    {
        token = addrs[0];
        daoAddress = addrs[1];
    }

    /// @inheritdoc IReceivedFundVaultFactory
    function create(
        string calldata _name,
        address publicSaleAddress,
        address receivedAddress
    )
        external override
        returns (address)
    {
        require(bytes(_name).length > 0, "name is empty");
        require(
                token != address(0) && daoAddress != address(0) && vaultLogic != address(0) &&
                upgradeAdmin != address(0) && publicSaleAddress != address(0) && receivedAddress != address(0),
                "some address is zero"
                );

        ReceivedFundVaultProxy _proxy = new ReceivedFundVaultProxy();

        require(
            address(_proxy) != address(0),
            "ReceivedFundVaultProxy zero"
        );

        _proxy.addProxyAdmin(upgradeAdmin);
        // _proxy.addAdmin(upgradeAdmin);
        _proxy.setImplementation2(vaultLogic, 0, true);
        _proxy.setLogEventAddress(logEventAddress, true);

        _proxy.setBaseInfoProxy(
            _name,
            token,
            daoAddress,
            publicSaleAddress,
            receivedAddress
        );

        //_proxy.removeAdmin();
        // _proxy.removeProxyAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        IEventLog(logEventAddress).logEvent(
            keccak256("ReceivedFundVaultFactory"),
            keccak256("CreatedReceivedFundVault"),
            address(this),
            abi.encode(address(_proxy), _name));


        emit CreatedReceivedFundVault(address(_proxy), _name);

        return address(_proxy);
    }

}