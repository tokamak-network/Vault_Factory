//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VestingPublicFundStorage.sol";
import "../proxy/VaultProxy.sol";

contract VestingPublicFundProxy is VestingPublicFundStorage, VaultProxy {

    function setBaseInfoProxy(
        string memory _name,
        address _token,
        address _owner,
        address _receivedAddress
    ) external onlyProxyOwner {

        require(bytes(name).length == 0, "already set");

        require(
            _token != address(0)
            && _owner != address(0),
            "zero address"
        );

        name = _name;
        token = _token;
        receivedAddress =_receivedAddress;

        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

    }
}
