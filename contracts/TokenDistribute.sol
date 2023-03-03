//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./libraries/BytesLib.sol";
// import "hardhat/console.sol";

/// @title
contract TokenDistribute {
    using SafeERC20 for IERC20;
    using BytesLib for bytes;

    bytes4 constant ERC20_RECEIVED = 0x4fc35859;
    bytes4 constant ERC20_ONAPPROVE = 0x4273ca16;
     // As per the EIP-165 spec, no interface should ever match 0xffffffff
    bytes4 private constant InterfaceId_Invalid = 0xffffffff;

    bytes4 private constant InterfaceId_ERC165 = 0x01ffc9a7;
    /**
    * 0x01ffc9a7 ===
    *   bytes4(keccak256('supportsInterface(bytes4)'))
    */
    uint256 constant PACKET_SIZE = 52;

    mapping(bytes4 => bool) private _supportedInterfaces;

    struct DistributeInfo {
        address to;
        uint256 amount;
    }

    event Distributed(address projectToken_, uint256 totalDistributeAmount_, DistributeInfo[] tokens_);
    event DistributedApproveAndCall(address projectToken_, uint256 totalDistributeAmount_, bytes tokens_);

    constructor(){
        // _registerInterface(ERC20_RECEIVED);
        _registerInterface(ERC20_ONAPPROVE);
        _registerInterface(InterfaceId_ERC165);

    }

    function supportsInterface(bytes4 interfaceId) public view virtual returns (bool) {
        return _supportedInterfaces[interfaceId];
    }

    function _registerInterface(bytes4 interfaceId) internal virtual {
        require(interfaceId != 0xffffffff, "ERC165: invalid interface id");
        _supportedInterfaces[interfaceId] = true;
    }

    function onApprove(
        address sender,
        address spender,
        uint256 amount,
        bytes calldata data
    ) external returns (bool) {

        require(spender == address(this), "EA");
        _distribute(sender, msg.sender, data.toUint256(0), data.slice(32,data.length-32));

        return true;
    }

    function distribute(address projectToken, uint256 totalDistributeAmount, DistributeInfo[] calldata tokens)
        external
    {
        require(totalDistributeAmount != 0, 'E0');
        uint256 len = tokens.length;
        require(len != 0, 'E1');

        uint256 sum = 0;
        for (uint256 i = 0; i < len; i++){
            require (tokens[i].to != address(0) && tokens[i].amount > 0, 'E2');
            // require(Address.isContract(info.to), "E3");
            sum += tokens[i].amount;
        }

        require (sum == totalDistributeAmount, 'E4');
        IERC20(projectToken).safeTransferFrom(msg.sender, address(this), totalDistributeAmount);

        for (uint256 i = 0; i < len; i++){
            IERC20(projectToken).safeTransfer(tokens[i].to, tokens[i].amount);
        }
        // emit Distributed(projectToken, totalDistributeAmount, tokens);
    }

    function _distribute(address sender, address projectToken, uint256 totalDistributeAmount, bytes memory tokensBytes)
        internal
    {
        require(totalDistributeAmount != 0, 'E0');
        uint256 len = tokensBytes.length / PACKET_SIZE;
        require(len != 0, 'E1');

        uint256 sum = 0;

        for (uint256 i = 0; i < len; i++){
            uint256 amount = tokensBytes.toUint256(i*PACKET_SIZE + 20);
            require (tokensBytes.toAddress(i*PACKET_SIZE) != address(0) && amount > 0, 'E2');
            sum += amount;
        }
        require (sum == totalDistributeAmount, 'E4');

        IERC20(projectToken).safeTransferFrom(sender, address(this), totalDistributeAmount);

        for (uint256 i = 0; i < len; i++){
            IERC20(projectToken).safeTransfer(
                tokensBytes.toAddress(i*PACKET_SIZE),
                tokensBytes.toUint256(i*PACKET_SIZE + 20)
            );
        }

        // emit DistributedApproveAndCall(projectToken, totalDistributeAmount, tokensBytes);
    }

}