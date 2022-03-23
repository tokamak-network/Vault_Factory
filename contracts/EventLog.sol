//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

/// @title EventLog
contract EventLog {

    event LogEvent(bytes4 indexed contractType, bytes indexed eventName, address from, bytes data);

    constructor() {
    }

    function logEvent(bytes4 contractType, bytes eventName, address from, bytes data) public {
        emit LogEvent(contractType, eventName, from, data);
    }
}
