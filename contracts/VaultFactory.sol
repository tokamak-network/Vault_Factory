//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {typeAVault} from "./typeAVault/typeAVault.sol";
import {typeBVault} from "./typeBVault/typeBVault.sol";
import {typeCVault} from "./typeCVault/typeCVault.sol";
import "./interfaces/IVaultFactory.sol";
import "./common/AccessibleCommon.sol";
import "hardhat/console.sol";

/// @title A factory that creates a Vault
contract VaultFactory is AccessRoleCommon, IVaultFactory { 

    event CreatedPublicSaleProxy(address contractAddress, string name, string vaultType);

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "VaultFactory: zero");
        _;
    }
    struct ContractInfo {
        address contractAddress;
        string name;
        string vaultType;
    }

    /// @dev Total number of contracts created
    uint256 public totalCreatedContracts;
    uint256 public typeACreated;
    uint256 public typeBCreated;
    uint256 public typeCCreated;

    /// @dev Contract information by index
    mapping(uint256 => ContractInfo) public createdContracts;

    /// @dev constructor of VaultFactory
    constructor() {
        totalCreatedContracts = 0;
        typeACreated = 0;
        typeBCreated = 0;
        typeCCreated = 0;
    }

    function createTypeA(
        string calldata _name,
        address _token,
        address _owner,
        uint256[4] calldata _setting,
        uint256[2] calldata _firstSet,
        bool _check
    )
        external override returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        typeAVault typeA = new typeAVault(_name,_token);

        require(
            address(typeA) != address(0),
            "typeA zero"
        );

        typeA.initialize(
            _setting[0],
            _setting[1],
            _setting[2],
            _setting[3]
        );

        if(_check == true) {
            typeA.firstClaimSetting(
                _firstSet[0],
                _firstSet[1]
            );
        }

        typeA.grantRole(ADMIN_ROLE, _owner);
        typeA.revokeRole(ADMIN_ROLE, address(this));

        createdContracts[totalCreatedContracts] = ContractInfo(address(typeA), _name, "A");
        typeACreated++;
        totalCreatedContracts++;

        emit CreatedPublicSaleProxy(address(typeA), _name, "A");

        return address(typeA);
    }   

    function createTypeB(
        string calldata _name,
        address _token,
        address _owner
    )
        external override returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        typeBVault typeB = new typeBVault(_name,_token,_owner);

        require(
            address(typeB) != address(0),
            "typeB zero"
        );

        createdContracts[totalCreatedContracts] = ContractInfo(address(typeB), _name, "B");
        typeBCreated++;
        totalCreatedContracts++;

        emit CreatedPublicSaleProxy(address(typeB), _name, "B");

        return address(typeB);
    } 

    function createTypeC(
        string calldata _name,
        address[2] calldata _addr,
        uint256[2] calldata _amount,
        uint256[] calldata _claimsTimes,
        uint256[] calldata _claimAmounts
    )
        external override returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        typeCVault typeC = new typeCVault(_name,_addr[0]);

        require(
            address(typeC) != address(0),
            "typeC zero"
        );

        typeC.initialize(
            _amount[0],
            _amount[1],
            _claimsTimes,
            _claimAmounts
        );

        typeC.grantRole(ADMIN_ROLE, _addr[1]);
        typeC.revokeRole(ADMIN_ROLE, address(this));

        createdContracts[totalCreatedContracts] = ContractInfo(address(typeC), _name, "C");
        typeCCreated++;
        totalCreatedContracts++;

        emit CreatedPublicSaleProxy(address(typeC), _name, "C");

        return address(typeC);
    } 

    function lastestCreated() external view override returns (address contractAddress, string memory name, string memory vaultType){
        if(totalCreatedContracts > 0){
            return (createdContracts[totalCreatedContracts-1].contractAddress, createdContracts[totalCreatedContracts-1].name, createdContracts[totalCreatedContracts-1].vaultType );
        }else {
            return (address(0), '', '');
        }
    }

    function getContracts(uint256 _index) external view override returns (address contractAddress, string memory name, string memory vaultType){
        if(_index < totalCreatedContracts){
            return (createdContracts[_index].contractAddress, createdContracts[_index].name, createdContracts[_index].vaultType);
        }else {
            return (address(0), '', '');
        }
    }
}