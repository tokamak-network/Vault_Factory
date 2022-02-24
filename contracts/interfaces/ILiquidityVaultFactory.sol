//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface ILiquidityVaultFactory {

    event CreatedLiquidityVault(address contractAddress, string name);


    /// ###### only admin ######

    /// @dev designate an admin to upgrade the vault logic later.
    /// @param addr the upgradeAdmin address
    function setUpgradeAdmin(
        address addr
    )   external;


    /// @dev set the logic address
    /// @param _logic  the logic address
    function setLogic(
        address _logic
    )   external;


    /// @dev view the upgradeAdmin address
    /// @param admin  the upgradeAdmin address
    function upgradeAdmin() external view returns (address admin);


    /// @dev view the logic address
    /// @param logic the logic address
    function vaultLogic() external view returns (address logic);



    /// ### anybody can use

    /// @dev Create a LiquidityVaultProxy
    /// @param _name name
    /// @param _token token address
    /// @param _admin  admin address
    /// @param tosPrice  tosPrice
    /// @param tokenPrice  atokenPrice
    /// @return created typeCvault contract address
    function create(
        string calldata _name,
        address _token,
        address _admin,
        uint256 tosPrice,
        uint256 tokenPrice
    )
        external
        returns (address);


    /// @dev Last generated contract information
    /// @return contractAddress the address created
    /// @return name name
    function lastestCreated() external view returns (address contractAddress, string memory name);


    /// @dev Contract information stored in the index
    /// @return contractAddress the vault address
    /// @return name name
    function getContracts(uint256 _index) external view returns (address contractAddress, string memory name);

    /// @dev the number of total created contracts
    /// @return total  total count
    function totalCreatedContracts() external view returns (uint256 total);


}
