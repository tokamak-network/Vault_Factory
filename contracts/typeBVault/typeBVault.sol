//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/AccessibleCommon.sol";

//import "hardhat/console.sol";

contract typeBVault is AccessibleCommon {
    using SafeERC20 for IERC20;

    string public name;

    IERC20 public token;

    constructor(        
        string memory _name,
        address _token,
        address _admin
    ) {
        require(_token != address(0), "Vault: zero address");
        name = _name;
        token = IERC20(_token);
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, _admin);
    }

    function claim(address to, uint256 amount) external onlyOwner {
        require(token.balanceOf(address(this)) >= amount,"Vault: insufficent");
        token.safeTransfer(to, amount);
    }

}
