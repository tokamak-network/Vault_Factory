//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./ReceivedFundVaultStorage.sol";
import "../proxy/VaultProxy.sol";

contract ReceivedFundVaultProxy is ReceivedFundVaultStorage, VaultProxy {

    function setBaseInfoProxy(
        string memory _name,
        address _token,
        address _owner,
        address _publicSaleVault,
        uint16 _minimumClaimCounts
    ) external onlyProxyOwner {

        require(bytes(name).length == 0, "already set");
        require(_minimumClaimCounts > 0, "zero minimumClaimCounts");
        require(
            _token != address(0)
            && _owner != address(0)
            && _publicSaleVault != address(0),
            "zero address"
        );

        name = _name;
        token = _token;
        publicSaleVaultAddress = _publicSaleVault;

        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

    }
}
