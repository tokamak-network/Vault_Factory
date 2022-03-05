//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IProxyEvent
interface IProxyEvent {

    event SetAliveImplementation(address indexed impl, bool alive);
    event SetSelectorImplementation(bytes4 indexed selector, address indexed impl);


}
