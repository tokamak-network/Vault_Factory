//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

//import {Address} from "@openzeppelin/contracts/utils/Address.sol";
import "./LiquidityVaultStorage.sol";
import "../common/AccessiblePlusCommon.sol";
import "./ProxyBase.sol";
import "hardhat/console.sol";

contract LiquidityVaultProxy is
    LiquidityVaultStorage, AccessiblePlusCommon,
    ProxyBase

{
    event Upgraded(address indexed implementation);
    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor () {
        assert(
            IMPLEMENTATION_SLOT ==
                bytes32(uint256(keccak256("eip1967.proxy.implementation")) - 1)
        );

        owner = msg.sender;
        tickIntervalMinimum = 0;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, owner);

    }

    /// @notice Set pause state
    /// @param _pause true:pause or false:resume
    function setProxyPause(bool _pause) external  onlyOwner {
        pauseProxy = _pause;
    }

    /// @notice Set implementation contract
    /// @param impl New implementation contract address
    function upgradeTo(address impl) public  onlyOwner {
        require(impl != address(0), "ERC721Proxy: input is zero");
        require(_implementation() != impl, "ERC721Proxy: same");
        _setImplementation(impl);
        emit Upgraded(impl);
    }

    /// @dev returns the implementation
    function implementation() public view  returns (address) {
        return _implementation();
    }

    /// @dev receive ether
    receive() external payable {
        revert("cannot receive Ether");
    }

    /// @dev fallback function , execute on undefined function call
    fallback() external payable {
        _fallback();
    }

    /// @dev fallback function , execute on undefined function call
    function _fallback() internal {
        address _impl = _implementation();

        require(
            _impl != address(0) && !pauseProxy,
            "LiquidityVaultProxy: impl OR proxy is false"
        );

        assembly {
            // Copy msg.data. We take full control of memory in this inline assembly
            // block because it will not return to Solidity code. We overwrite the
            // Solidity scratch pad at memory position 0.
            calldatacopy(0, 0, calldatasize())

            // Call the implementation.
            // out and outsize are 0 because we don't know the size yet.
            let result := delegatecall(gas(), _impl, 0, calldatasize(), 0, 0)

            // Copy the returned data.
            returndatacopy(0, 0, returndatasize())

            switch result
                // delegatecall returns 0 on error.
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    function setBaseInfoProxy(
        string memory _name,
        address _token,
        address _owner,
        uint256 tosPrice,
        uint256 tokenPrice
    ) external onlyOwner  {
        require(bytes(name).length == 0,"already set");
        name = _name;
        token = IERC20(_token);

        if(_owner != owner){
            owner = _owner;
            _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
            _setupRole(ADMIN_ROLE, owner);
        }

        initialTosPrice = tosPrice;
        initialTokenPrice = tokenPrice;
    }
}
