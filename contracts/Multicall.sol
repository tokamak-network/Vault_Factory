//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/utils/Strings.sol";

contract Multicall {

    struct Call {
        address target;
        bytes callData;
    }

    struct Result {
        bool success;
        bytes returnData;
    }

    function tryCalls(bool requireSuccess, Call[] memory calls)
        public returns (uint256 blockNumber, Result[] memory returnData)
    {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.call(calls[i].callData);

            if (requireSuccess) {
                require(success,
                    string(
                        abi.encodePacked(
                            "call failed: ", Strings.toHexString(uint160(calls[i].target), 20)
                        )
                    ));
            }

            returnData[i] = Result(success, ret);
        }
    }

    function tryDelegatecalls(bool requireSuccess, Call[] memory calls)
        public returns (uint256 blockNumber, Result[] memory returnData)
    {
        blockNumber = block.number;
        returnData = new Result[](calls.length);
        for(uint256 i = 0; i < calls.length; i++) {
            (bool success, bytes memory ret) = calls[i].target.delegatecall(calls[i].callData);

            if (requireSuccess) {
                require(success,
                    string(
                        abi.encodePacked(
                            "delegatecall failed: ", Strings.toHexString(uint160(calls[i].target), 20)
                        )
                    ));
            }

            returnData[i] = Result(success, ret);
        }
    }

}