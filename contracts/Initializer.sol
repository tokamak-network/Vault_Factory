//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";

import "hardhat/console.sol";

interface IIVault {
    function isAdmin(address account) external view returns (bool) ;
}

/// @title A factory that creates a Vault
contract Initializer {

    struct Call {
        address target;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    constructor() {}

    function initialize(Call[] memory calls)
        external returns (uint256 blockNumber, Result[] memory returnData)
    {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            bool isAdmin = IIVault(calls[i].target).isAdmin(address(this));
            bool isSenderAdmin = IIVault(calls[i].target).isAdmin(msg.sender);

            require(isAdmin && isSenderAdmin, 'not admin');

            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);

            require(success,
                string(
                    abi.encodePacked(
                        "call failed: ", Strings.toHexString(uint160(calls[i].target), 20)
                    )
                ));

            returnData[i] = Result(success, ret);
        }
    }

}