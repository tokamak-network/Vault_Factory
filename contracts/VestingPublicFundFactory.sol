//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VaultFactory.sol";

import {VestingPublicFundProxy} from "./VestingPublicFund/VestingPublicFundProxy.sol";
import "./interfaces/IEventLog.sol";
import "./interfaces/IVestingPublicFundFactory.sol";
// import "hardhat/console.sol";

interface IIVault {
    function receivedAddress() external view returns (address account) ;
    function isAdmin(address account) external view returns (bool) ;
}

/// @title A factory that creates a Vault
contract VestingPublicFundFactory is VaultFactory, IVestingPublicFundFactory {

    address public token; // TON address
    address public tosToken; // TOS address
    address public daoAddress;
    address public uniswapV3Factory;
    address public initializer;

    constructor() {}

    /// @inheritdoc IVestingPublicFundFactory
    function setBaseInfo(
        address[5] calldata addrs
    )   external override
        onlyOwner
        nonZeroAddress(addrs[0])
        nonZeroAddress(addrs[1])
        nonZeroAddress(addrs[2])
        nonZeroAddress(addrs[3])
    {
        token = addrs[0];
        tosToken = addrs[1];
        daoAddress = addrs[2];
        uniswapV3Factory = addrs[3];
        initializer = addrs[4];
    }

    /// @inheritdoc IVestingPublicFundFactory
    function create(
        string calldata _name,
        address receivedAddress
    )
        external override
        returns (address)
    {
        require(bytes(_name).length > 0, "name is empty");
        require(
                token != address(0) && daoAddress != address(0) && vaultLogic != address(0) &&
                upgradeAdmin != address(0) && receivedAddress != address(0),
                "some address is zero"
                );

        VestingPublicFundProxy _proxy = new VestingPublicFundProxy();

        require(
            address(_proxy) != address(0),
            "VestingPublicFundProxy zero"
        );

        if(!_proxy.isProxyAdmin(upgradeAdmin)) _proxy.addProxyAdmin(upgradeAdmin);
        if(!_proxy.isAdmin(upgradeAdmin)) _proxy.addAdmin(upgradeAdmin);

        _proxy.setImplementation2(vaultLogic, 0, true);
        _proxy.setLogEventAddress(logEventAddress, true);

        _proxy.setBaseInfoProxy(
            _name,
            token,
            tosToken,
            daoAddress,
            receivedAddress,
            uniswapV3Factory
        );

        _proxy.addAdmin(initializer);
        _proxy.removeAdmin();
        // _proxy.removeProxyAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        IEventLog(logEventAddress).logEvent(
            keccak256("VestingPublicFundFactory"),
            keccak256("CreatedVestingPublicFund"),
            address(this),
            abi.encode(address(_proxy), _name));

        emit CreatedVestingPublicFund(address(_proxy), _name);

        return address(_proxy);
    }
}