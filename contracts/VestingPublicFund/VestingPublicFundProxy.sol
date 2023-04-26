//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./VestingPublicFundStorage.sol";
import "../proxy/VaultProxy.sol";

contract VestingPublicFundProxy is VestingPublicFundStorage, VaultProxy {

    function setBaseInfoProxy(
        string memory _name,
        address _tonToken,
        address _tosToken,
        address _owner,
        address _receivedAddress,
        address _uniswapV3Factory
    ) external onlyProxyOwner {

        require(bytes(name).length == 0, "already set");

        require(
            _tonToken != address(0)
            && _owner != address(0),
            "zero address"
        );

        name = _name;
        token = _tonToken;
        tosToken = _tosToken;
        receivedAddress = _receivedAddress;
        uniswapV3Factory = _uniswapV3Factory;

        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

    }
}
