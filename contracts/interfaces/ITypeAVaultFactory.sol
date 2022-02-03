//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface ITypeAVaultFactory {

    /// @dev Create a createTypeA
    /// @param _name name
    /// @param _token token Address
    /// @param _owner  owner Address
    /// @return created typeAvault contract address
    function createTypeA(
        string calldata _name,
        address _token,
        address _owner
    )
        external
        returns (address);

    /// @dev Last generated contract information
    function lastestCreated() external view returns (address contractAddress, string memory name);

    /// @dev Contract information stored in the index
    function getContracts(uint256 _index) external view returns (address contractAddress, string memory name);


}
