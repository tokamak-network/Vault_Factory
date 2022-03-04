//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import "../interfaces/IProxyEvent.sol";

import "./RewardProgramVaultStorage.sol";
import "../proxy/VaultProxy.sol";

//import "hardhat/console.sol";

contract RewardProgramVaultProxy is RewardProgramVaultStorage, VaultProxy
{
    function setBaseInfoProxy(
        string memory _name,
        address _pool,
        address _token,
        address _staker,
        address _owner,
        uint256 _startWaitTime,
        uint256 _programDuration
    ) external onlyOwner  {
        require(bytes(name).length == 0,"already set");
        require(_staker != address(0) && _pool != address(0) && _token != address(0)
                && _owner != address(0), "zero address");
        require(_startWaitTime >= 60, "_startWaitTime is less than 60");
        require(_programDuration > 0, "_programDuration is zero");

        name = _name;
        token = IERC20Minimal(_token);
        pool = IUniswapV3Pool(_pool);
        staker = IUniswapV3Staker(_staker);

        startWaitTime = _startWaitTime;
        programDuration = _programDuration;

        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

    }
}
