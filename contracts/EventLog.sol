//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

/// @title EventLog
contract EventLog {

    event LogEvent(string indexed contractName, string indexed eventName, address contractAddress, bytes data);

    constructor() {
    }

    function logEvent(string memory contractName, string memory eventName, address contractAddress, bytes memory data) public {
        emit LogEvent(contractName, eventName, contractAddress, data);
    }
}
