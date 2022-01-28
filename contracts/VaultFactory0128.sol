// //SPDX-License-Identifier: Unlicense
// pragma solidity ^0.8.4;

// import {typeAVault} from "./typeAVault/typeAVault.sol";
// import {typeBVault} from "./typeBVault/typeBVault.sol";
// import {typeCVault} from "./typeCVault/typeCVault.sol";
// import "./interfaces/IVaultFactory.sol";
// import "./common/AccessiblePlusCommon.sol";
// import "hardhat/console.sol";

// /// @title A factory that creates a Vault
// contract VaultFactory is AccessiblePlusCommon { 

//     event CreatedPublicSaleProxy(address contractAddress, string name, string vaultType);

//     modifier nonZeroAddress(address _addr) {
//         require(_addr != address(0), "VaultFactory: zero");
//         _;
//     }
//     struct ContractInfo {
//         address contractAddress;
//         string name;
//         string vaultType;
//     }

//     /// @dev Total number of contracts created
//     uint256 public totalCreatedContracts;
//     uint256 public typeACreated;
//     uint256 public typeBCreated;
//     uint256 public typeCCreated;

//     /// @dev Contract information by index
//     mapping(uint256 => ContractInfo) public createdContracts;

//     /// @dev constructor of VaultFactory
//     constructor() {
//         totalCreatedContracts = 0;
//         typeACreated = 0;
//         typeBCreated = 0;
//         typeCCreated = 0;
//     }

//     function createTypeA(
//         string calldata _name,
//         address _token,
//         address _owner
//     )
//         external returns (address)
//     {
//         require(bytes(_name).length > 0,"name is empty");

//         typeAVault typeA = new typeAVault(_name,_token,_owner);

//         require(
//             address(typeA) != address(0),
//             "typeA zero"
//         );

//         createdContracts[totalCreatedContracts] = ContractInfo(address(typeA), _name, "A");
//         typeACreated++;
//         totalCreatedContracts++;

//         emit CreatedPublicSaleProxy(address(typeA), _name, "A");

//         return address(typeA);
//     }   

//     function createTypeB(
//         string calldata _name,
//         address _token,
//         address _owner
//     )
//         external returns (address)
//     {
//         require(bytes(_name).length > 0,"name is empty");

//         typeBVault typeB = new typeBVault(_name,_token,_owner);

//         require(
//             address(typeB) != address(0),
//             "typeB zero"
//         );

//         createdContracts[totalCreatedContracts] = ContractInfo(address(typeB), _name, "B");
//         typeBCreated++;
//         totalCreatedContracts++;

//         emit CreatedPublicSaleProxy(address(typeB), _name, "B");

//         return address(typeB);
//     } 

//     function createTypeC(
//         string calldata _name,
//         address _token,
//         address _owner
//     )
//         external returns (address)
//     {
//         require(bytes(_name).length > 0,"name is empty");

//         typeCVault typeC = new typeCVault(_name,_token,_owner);

//         require(
//             address(typeC) != address(0),
//             "typeC zero"
//         );

//         createdContracts[totalCreatedContracts] = ContractInfo(address(typeC), _name, "C");
//         typeCCreated++;
//         totalCreatedContracts++;

//         emit CreatedPublicSaleProxy(address(typeC), _name, "C");

//         return address(typeC);
//     } 

//     function lastestCreated() external view returns (address contractAddress, string memory name, string memory vaultType){
//         if(totalCreatedContracts > 0){
//             return (createdContracts[totalCreatedContracts-1].contractAddress, createdContracts[totalCreatedContracts-1].name, createdContracts[totalCreatedContracts-1].vaultType );
//         }else {
//             return (address(0), '', '');
//         }
//     }

//     function getContracts(uint256 _index) external view returns (address contractAddress, string memory name, string memory vaultType){
//         if(_index < totalCreatedContracts){
//             return (createdContracts[_index].contractAddress, createdContracts[_index].name, createdContracts[_index].vaultType);
//         }else {
//             return (address(0), '', '');
//         }
//     }
// }