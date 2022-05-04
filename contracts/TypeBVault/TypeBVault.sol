//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "./TypeBVaultStorage.sol";

import "../common/ProxyAccessCommon.sol";
import "../proxy/VaultStorage.sol";

contract TypeBVault is TypeBVaultStorage, VaultStorage, ProxyAccessCommon {
    using SafeERC20 for IERC20;

    ///@dev constructor
    constructor() {
    }

    function claim(address _to, uint256 _amount) external onlyOwner {
        require(IERC20(token).balanceOf(address(this)) >= _amount, "Vault: insufficient");
        IERC20(token).safeTransfer(_to, _amount);
    }

}
