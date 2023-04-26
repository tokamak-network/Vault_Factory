// SPDX-License-Identifier: MIT

pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./ERC20ApproveAndCall.sol";
import "hardhat/console.sol";
/**
 * @title ERC20ApproveAndCallMock
 * @dev Very simple ERC20 Token example, where all tokens are pre-assigned to the creator.
 * Note they can later distribute these tokens as they wish using `transfer` and other
 * `ERC20` functions.
 */
contract ERC20ApproveAndCallMock is ERC20, ERC20ApproveAndCall {
    uint256 public constant INITIAL_SUPPLY = 1000000000 * (10**18);

    /**
     * @dev Constructor that gives msg.sender all of existing tokens.
     */
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(_msgSender(), INITIAL_SUPPLY);
    }

    function approveAndCall(address spender, uint256 amount, bytes memory data) public returns (bool) {
        require(approve(spender, amount));
        _callOnApprove(msg.sender, spender, amount, data);
        return true;
    }

}
