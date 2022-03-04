//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import {LiquidityVaultProxy} from "./typeDVault/LiquidityVaultProxy.sol";

import "./interfaces/ILiquidityVaultFactory.sol";
import "./VaultFactory.sol";
import "hardhat/console.sol";

interface IILiquidityVaultAction {

    /// @dev Set the uniswapV3 contract address.
    /// @param poolfactory UniswapV3Factory address
    /// @param npm NonfungiblePositionManager address
    /// @param swapRouter SwapRouter address
    function setUniswapInfo(
        address poolfactory,
        address npm,
        address swapRouter
        )
        external;


    /// @dev Set the pool pair address of uniswapV3. It is not currently used, so you do not need to set it.
    /// @param wethUsdcPool wethUsdcPool address
    /// @param wtonWethPool wtonWethPool address
    /// @param wtonTosPool wtonTosPool address
    function setPoolInfo(
            address wethUsdcPool,
            address wtonWethPool,
            address wtonTosPool
        )
        external;


    /// @dev Set the token address and fee information of the pool you want to create.
    /// @param wton wton address
    /// @param tos tos address
    /// @param _fee _fee ( 3000 )
    function setTokens(
            address wton,
            address tos,
            uint24 _fee
        )
        external;
}

/// @title A factory that creates a Vault
contract LiquidityVaultFactory is VaultFactory, ILiquidityVaultFactory {

    address public uniswapV3Factory;
    address public nonfungiblePositionManager;
    address public swapRouter;
    address public wethUsdcPool;
    address public wtonWethPool;
    address public wtonTosPool;
    address public wton;
    address public tos;
    uint24 public fee;

    /// @inheritdoc ILiquidityVaultFactory
    function setUniswapInfoNTokens(
        address[3] calldata addrs,
        address[3] calldata pools,
        address[2] calldata tokens,
        uint24 _fee
    )   external override
        onlyOwner
        nonZeroAddress(addrs[0])
        nonZeroAddress(addrs[1])
        nonZeroAddress(addrs[2])
        nonZeroAddress(pools[0])
        nonZeroAddress(pools[1])
        nonZeroAddress(pools[2])
        nonZeroAddress(tokens[0])
        nonZeroAddress(tokens[1])
    {
        uniswapV3Factory = addrs[0];
        nonfungiblePositionManager = addrs[1];
        swapRouter = addrs[2];

        wethUsdcPool  = pools[0];
        wtonWethPool  = pools[1];
        wtonTosPool  = pools[2];

        wton = tokens[0];
        tos = tokens[1];
        fee = _fee;
    }

    /// @inheritdoc ILiquidityVaultFactory
    function create(
        string calldata _name,
        address _token,
        address _admin,
        uint256 tosPrice,
        uint256 tokenPrice
    )
        external override
        nonZeroAddress(vaultLogic)
        nonZeroAddress(upgradeAdmin)
        returns (address)
    {
        require(bytes(_name).length > 0,"name is empty");

        LiquidityVaultProxy _proxy = new LiquidityVaultProxy();

        require(
            address(_proxy) != address(0),
            "LiquidityVaultProxy zero"
        );

        _proxy.addProxyAdmin(upgradeAdmin);
        _proxy.addAdmin(upgradeAdmin);
        _proxy.setImplementation2(vaultLogic, 0, true);

        _proxy.setBaseInfoProxy(
            _name,
            _token,
            _admin,
            tosPrice,
            tokenPrice
        );

        IILiquidityVaultAction(address(_proxy)).setUniswapInfo(uniswapV3Factory, nonfungiblePositionManager, swapRouter);
        IILiquidityVaultAction(address(_proxy)).setPoolInfo(wethUsdcPool, wtonWethPool, wtonTosPool);
        IILiquidityVaultAction(address(_proxy)).setTokens(wton, tos, fee);

        _proxy.removeAdmin();
        _proxy.removeProxyAdmin();

        createdContracts[totalCreatedContracts] = ContractInfo(address(_proxy), _name);
        totalCreatedContracts++;

        emit CreatedLiquidityVault(address(_proxy), _name);

        return address(_proxy);
    }

}