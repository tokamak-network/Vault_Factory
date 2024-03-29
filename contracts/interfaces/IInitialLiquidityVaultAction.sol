//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;


/// @title IInitialLiquidityVaultAction
interface IInitialLiquidityVaultAction {

    /// ####### only admin ##########
    /*
    /// @dev setBaseInfo function
    /// @param _name Vault's name
    /// @param _token Allocated token address
    /// @param _owner owner address
    function setBaseInfo(
        string memory _name,
        address _token,
        address _owner
        )
        external;
    */
    /// @dev set the boolReadyToCreatePool storage
    /// @param _boolReadyToCreatePool _boolReadyToCreatePool , true if it's ready to CreatePool
    function setBoolReadyToCreatePool(
         bool _boolReadyToCreatePool
        )
        external;

    /*
    /// @dev setInitialPrice function
    /// @param tosPrice tosPrice
    /// @param tokenPrice tokenPrice
    /// @param initSqrtPrice When a pool is created for the first time, pricing information is absolutely necessary when initializing it.
    function setInitialPrice(
        uint256 tosPrice,
        uint256 tokenPrice,
        uint160 initSqrtPrice
        )
        external;
    */

    /// @dev initialization function . Set claim information.
    /// @param _totalAllocatedAmount total allocated amount
    /// @param tosPrice tosPrice
    /// @param tokenPrice tokenPrice
    /// @param initSqrtPrice When a pool is created for the first time, pricing information is absolutely necessary when initializing it.
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 tosPrice,
        uint256 tokenPrice,
        uint160 initSqrtPrice
    ) external ;


    /// @dev Set the uniswapV3 contract address.
    /// @param poolfactory UniswapV3Factory address
    /// @param npm NonfungiblePositionManager address
    function setUniswapInfo(
        address poolfactory,
        address npm
        )
        external;


    /// @dev Set the token address and fee information of the pool you want to create.
    /// @param tos tos address
    /// @param _fee _fee ( 3000 )
    function setTokens(
            address tos,
            uint24 _fee
        )
        external;

    /*
    /// @dev Set the project token address.
    /// @param _token project token address.
    function changeToken(address _token) external ;
    */

    /*
    /// @dev Set a price and create a pool.
    function setInitialPriceAndCreatePool(
        uint256 tosPrice,
        uint256 tokenPrice,
        uint160 initSqrtPrice
    ) external ;
    */

    /// @dev create a pool.
    function setCreatePool() external ;

    /// @dev Configure pool settings for uniswapV3.
    function setPool()
        external ;


    /// @dev Initialize the pool of uniswapV3.
    /// @param inSqrtPriceX96 initial price inSqrtPriceX96
    function setPoolInitialize(uint160 inSqrtPriceX96)
        external;

    /*
    /// @dev If the total allocated amount is all claimed, the remaining token balance can be transferred to the account by the owner.
    /// @param _token token address
    /// @param _account account
    /// @param _amount amount
    function withdraw(address _token, address _account, uint256 _amount)
        external;
    */


    /// ####### anyone can use ##########


    /// @dev Pool address generated by toss and project tokens
    /// @param tokenA tokenA address
    /// @param tokenB tokenB address
    /// @param _fee fee
    /// @return pool pool address
    /// @return token0  token0 address
    /// @return token1  token1 address
    function computePoolAddress(address tokenA, address tokenB, uint24 _fee)
        external view returns (address pool, address token0, address token1);


    /// @dev Provide liquidity to uniswap V3 and receive LP tokens. Vault uses up all available project token
    function mint() external;

    /// @dev function to charge a fee
    function collect() external ;


    /// @dev get minimum tick
    function getMinTick() external view returns (int24);


    /// @dev get maximum tick
    function getMaxTick() external view returns (int24);


}
