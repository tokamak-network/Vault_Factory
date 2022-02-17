//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {TOSVault} from "./TOSVault/TOSVault.sol";
import "./interfaces/ITOSFactory.sol";
import "./common/AccessibleCommon.sol";
import "hardhat/console.sol";

/// @title A factory that creates a Vault
contract TOSVaultFactory is AccessibleCommon { 

    event CreatedTOSVault(address contractAddress, string name);

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "VaultFactory: zero");
        _;
    }
    struct ContractInfo {
        address contractAddress;
        string name;
    }

    address public owner;   

    /// @dev the fixed address of divided Pool
    address public dividedPoolProxy;

    /// @dev Total number of contracts created
    uint256 public totalCreatedContracts;

    /// @dev Contract information by index
    mapping(uint256 => ContractInfo) public createdContracts;

    /// @dev constructor of VaultFactory
    constructor(
        address _owner,
        address _dividedPool
    ) {
        owner = _owner;
        dividedPoolProxy = _dividedPool;
        totalCreatedContracts = 0;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, owner);
    }

    function create(
        string calldata _name,
        address _token,
        address _owner
    )
        external returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        TOSVault TVault = new TOSVault(_name,_token,_owner,dividedPoolProxy,owner);

        require(
            address(TVault) != address(0),
            "TVault zero"
        );

        createdContracts[totalCreatedContracts] = ContractInfo(address(TVault), _name);
        totalCreatedContracts++;

        emit CreatedTOSVault(address(TVault), _name);

        return address(TVault);
    } 

    function changeDividedPool(
        address _dividedPool
    ) 
        external
        onlyOwner
    {
       dividedPoolProxy = _dividedPool;
    }

    function lastestCreated() external view returns (address contractAddress, string memory name){
        if(totalCreatedContracts > 0){
            return (createdContracts[totalCreatedContracts-1].contractAddress, createdContracts[totalCreatedContracts-1].name);
        }else {
            return (address(0), '');
        }
    }

    function getContracts(uint256 _index) external view returns (address contractAddress, string memory name){
        if(_index < totalCreatedContracts){
            return (createdContracts[_index].contractAddress, createdContracts[_index].name);
        }else {
            return (address(0), '');
        }
    }
}