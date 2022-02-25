//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {Address} from "@openzeppelin/contracts/utils/Address.sol";

import "./LiquidityVaultStorage.sol";
import "../common/ProxyAccessCommon.sol";
import "hardhat/console.sol";

contract LiquidityVaultProxy is
    LiquidityVaultStorage, ProxyAccessCommon

{
    event Upgraded(address indexed implementation);

    /**
     * @dev Initializes the contract by setting a `name` and a `symbol` to the token collection.
     */
    constructor () {
        //owner = msg.sender;
        tickIntervalMinimum = 0;

        _setRoleAdmin(PROJECT_ADMIN_ROLE, PROJECT_ADMIN_ROLE);
        _setupRole(PROJECT_ADMIN_ROLE, msg.sender);
        // _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);

    }

    /// @notice Set pause state
    /// @param _pause true:pause or false:resume
    function setProxyPause(bool _pause) external  onlyOwner {
        pauseProxy = _pause;
    }

    /// @dev view implementation address of the proxy[index]
    /// @param _index index of proxy
    /// @return address of the implementation
    function implementation2(uint256 _index) external view returns (address) {
        return _implementation2(_index);
    }

    /// @dev set the implementation address and status of the proxy[index]
    /// @param newImplementation Address of the new implementation.
    /// @param _index index
    /// @param _alive _alive
    function setImplementation2(
        address newImplementation,
        uint256 _index,
        bool _alive
    ) external onlyProxyOwner {
        _setImplementation2(newImplementation, _index, _alive);
    }

    /// @dev set alive status of implementation
    /// @param newImplementation Address of the new implementation.
    /// @param _alive alive status
    function setAliveImplementation2(address newImplementation, bool _alive)
        public
        onlyProxyOwner
    {
        _setAliveImplementation2(newImplementation, _alive);
    }

    /// @dev set selectors of Implementation
    /// @param _selectors being added selectors
    /// @param _imp implementation address
    function setSelectorImplementations2(
        bytes4[] calldata _selectors,
        address _imp
    ) public onlyProxyOwner {
        require(
            _selectors.length > 0,
            "LiquidityVaultProxy: _selectors's size is zero"
        );
        require(aliveImplementation[_imp], "LiquidityVaultProxy: _imp is not alive");

        for (uint256 i = 0; i < _selectors.length; i++) {
            require(
                selectorImplementation[_selectors[i]] != _imp,
                "LiquidityVaultProxy: same imp"
            );
            selectorImplementation[_selectors[i]] = _imp;
        }
    }

    /// @dev set the implementation address and status of the proxy[index]
    /// @param newImplementation Address of the new implementation.
    /// @param _index index of proxy
    /// @param _alive alive status
    function _setImplementation2(
        address newImplementation,
        uint256 _index,
        bool _alive
    ) internal {
        require(
            Address.isContract(newImplementation),
            "LiquidityVaultProxy: Cannot set a proxy implementation to a non-contract address"
        );
        if (_alive) proxyImplementation[_index] = newImplementation;
        _setAliveImplementation2(newImplementation, _alive);
    }

    /// @dev set alive status of implementation
    /// @param newImplementation Address of the new implementation.
    /// @param _alive alive status
    function _setAliveImplementation2(address newImplementation, bool _alive)
        internal
    {
        aliveImplementation[newImplementation] = _alive;
    }

    /// @dev view implementation address of the proxy[index]
    /// @param _index index of proxy
    /// @return impl address of the implementation
    function _implementation2(uint256 _index)
        internal
        view
        returns (address impl)
    {
        return proxyImplementation[_index];
    }

    /// @dev view implementation address of selector of function
    /// @param _selector selector of function
    /// @return impl address of the implementation
    function getSelectorImplementation2(bytes4 _selector)
        public
        view
        returns (address impl)
    {
        if (selectorImplementation[_selector] == address(0))
            return proxyImplementation[0];
        else if (aliveImplementation[selectorImplementation[_selector]])
            return selectorImplementation[_selector];
        else return proxyImplementation[0];
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
        address _impl = getSelectorImplementation2(msg.sig);

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

        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

        initialTosPrice = tosPrice;
        initialTokenPrice = tokenPrice;
    }
}
