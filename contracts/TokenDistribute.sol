//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";

/// @title
contract TokenDistribute {
    using SafeERC20 for IERC20;

    struct DistributeInfo {
        address token;
        uint256 amount;
    }

    event Distributed(address projectToken_, uint256 totalDistributeAmount_, DistributeInfo[] tokens_);

    function distribute(address projectToken, uint256 totalDistributeAmount, DistributeInfo[] memory tokens)
        external
    {
        require(totalDistributeAmount != 0, 'E0');
        require(tokens.length != 0, 'E1');

        uint256 len = tokens.length;
        uint256 sum = 0;
        for (uint256 i = 0; i < len; i++){
            DistributeInfo memory info = tokens[i];
            require (info.token != address(0) && info.amount > 0, 'E2');
            require(Address.isContract(info.token), "E3");
            sum += info.amount;
        }

        require (sum == totalDistributeAmount, 'E4');
        IERC20(projectToken).safeTransferFrom(msg.sender, address(this), totalDistributeAmount);
        for (uint256 i = 0; i < len; i++){
            DistributeInfo memory info = tokens[i];
            IERC20(projectToken).safeTransferFrom(address(this), info.token, info.amount);
        }

        emit Distributed(projectToken, totalDistributeAmount, tokens);
    }

}