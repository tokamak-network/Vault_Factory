//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {LiquidityVaultProxy} from "./typeDVault/LiquidityVaultProxy.sol";
import "./interfaces/ILiquidityVaultFactory.sol";
import "./common/AccessibleCommon.sol";
import "hardhat/console.sol";

/// @title A factory that creates a Vault
contract LiquidityVaultFactory is AccessibleCommon, ILiquidityVaultFactory{


    modifier nonZero(uint256 val) {
        require(val > 0 , 'zero vaule');
        _;
    }
    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "VaultFactory: zero");
        _;
    }

    struct ContractInfo {
        address contractAddress;
        string name;
    }

    /// @dev Total number of contracts created
    uint256 public override totalCreatedContracts;

    /// @dev Contract information by index
    mapping(uint256 => ContractInfo) public createdContracts;

    address public override upgradeAdmin;
    address public override vaultLogic;

    /// @dev constructor of VaultFactory
    constructor() {
        totalCreatedContracts = 0;

        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, msg.sender);
    }

    /// @inheritdoc ILiquidityVaultFactory
    function setUpgradeAdmin(
        address addr
    )   external override
        onlyOwner
        nonZeroAddress(addr)
    {
        require(addr != upgradeAdmin, "same addrs");
        upgradeAdmin = addr;
    }


    function setLogic(
        address _logic
    )
        external override
        nonZeroAddress(_logic)
        onlyOwner
    {
        require(vaultLogic != _logic, "already set this version");
        vaultLogic = _logic;
    }

    /// @dev constructor of VaultFactory
    function create(
        string calldata _name,
        address _token,
        address _admin,
        uint256 tosPrice,
        uint256 tokenPrice
    )
        external override
        nonZeroAddress(vaultLogic)
        nonZeroAddress(upgradeAdmin)
        nonZeroAddress(_token)
        nonZeroAddress(_admin)
        nonZero(tosPrice)
        nonZero(tokenPrice)
        returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        LiquidityVaultProxy _proxy = new LiquidityVaultProxy();

        require(
            address(_proxy) != address(0),
            "LiquidityVaultProxy zero"
        );

        _proxy.addAdmin(upgradeAdmin);
        _proxy.setImplementation2(vaultLogic, 0, true);

        _proxy.setBaseInfoProxy(_name, _token, _admin, tosPrice, tokenPrice);

        _proxy.removeAdmin(address(this));

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        emit CreatedLiquidityVault(address(_proxy), _name);

        return address(_proxy);
    }

    function lastestCreated() external view override returns (address contractAddress, string memory name){
        if(totalCreatedContracts > 0){
            return (createdContracts[totalCreatedContracts-1].contractAddress, createdContracts[totalCreatedContracts-1].name);
        }else {
            return (address(0), '');
        }
    }

    function getContracts(uint256 _index) external view override returns (address contractAddress, string memory name){
        if(_index < totalCreatedContracts){
            return (createdContracts[_index].contractAddress, createdContracts[_index].name);
        }else {
            return (address(0), '');
        }
    }
}