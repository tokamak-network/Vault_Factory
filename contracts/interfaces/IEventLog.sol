//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IEventLog
interface IEventLog {

    /// @dev logEvent function
    /// @param contractName contractName
    /// @param eventName eventName
    /// @param contractAddress contractAddress
    /// @param data data
    function logEvent(
        string memory contractName,
        string memory eventName,
        address contractAddress,
        bytes memory data
        )
        external;
}