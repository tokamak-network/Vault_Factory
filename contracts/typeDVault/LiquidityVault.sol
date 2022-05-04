//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "./LiquidityVaultStorage.sol";
import "../proxy/VaultStorage.sol";
import "../common/ProxyAccessCommon.sol";

import "../interfaces/IUniswapV3Factory.sol";
import "../interfaces/IUniswapV3Pool.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/ISwapRouter.sol";
import "../interfaces/ILiquidityVaultEvent.sol";
import "../interfaces/ILiquidityVaultAction.sol";

import "../libraries/TickMath.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

//import "hardhat/console.sol";

contract LiquidityVault is LiquidityVaultStorage, VaultStorage, ProxyAccessCommon, ILiquidityVaultEvent, ILiquidityVaultAction
{
    using SafeERC20 for IERC20;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "Vault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value > 0, "Vault: zero value");
        _;
    }

    modifier readyToCreatePool() {
        require(boolReadyToCreatePool, "Vault: not ready to CreatePool");
        _;
    }

    modifier beforeSetReadyToCreatePool() {
        require(!boolReadyToCreatePool, "Vault: already ready to CreatePool");
        _;
    }

    modifier afterSetUniswap() {
        require(
            address(UniswapV3Factory) != address(0)
            && address(NonfungiblePositionManager) != address(0)
            && address(SwapRouter) != address(0)
            && address(WTON) != address(0)
            && address(TOS) != address(0)
            ,
            "Vault: before setUniswap");
        _;
    }

    ///@dev constructor
    constructor() {
    }

    /// @inheritdoc ILiquidityVaultAction
    function setBaseInfo(
        string memory _name,
        address _token,
        address _owner
        )
        external override
        onlyOwner beforeSetReadyToCreatePool
    {
        require(bytes(name).length == 0,"already set");
        name = _name;
        token = IERC20(_token);
        if(!isAdmin(_owner)){
            _setupRole(PROJECT_ADMIN_ROLE, _owner);
        }

        emit SetBaseInfo(_name, _token, _owner);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setBoolReadyToCreatePool(
        bool _boolReadyToCreatePool
        )
        external override
        onlyOwner
    {
        require(boolReadyToCreatePool != _boolReadyToCreatePool, "same boolReadyToCreatePool");
        boolReadyToCreatePool = _boolReadyToCreatePool;

        emit SetBoolReadyToCreatePool(_boolReadyToCreatePool);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setInitialPrice(
        uint256 tosPrice,
        uint256 tokenPrice,
        uint160 initSqrtPrice
        )
        external override
        onlyOwner beforeSetReadyToCreatePool
    {
        initialTosPrice = tosPrice;
        initialTokenPrice = tokenPrice;
        initSqrtPriceX96 = initSqrtPrice;

        emit SetInitialPrice(tosPrice, tokenPrice, initSqrtPrice);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setTickIntervalMinimum(
        int24 _interval
        )
        external override
        onlyOwner
    {
        require(_interval > 0 , "zero _interval");
        tickIntervalMinimum = _interval;

        emit SetTickIntervalMinimum(_interval);
    }

    /// @inheritdoc ILiquidityVaultAction
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts

    )
        external override onlyOwner afterSetUniswap
    {

        require(totalClaimCounts == 0 ||
            (claimTimes.length > 0 && block.timestamp < claimTimes[0]) , "already set");

        require(_claimCounts > 0 && _claimTimes.length == _claimCounts && _claimAmounts.length == _claimCounts, "wrong claim data");

        require(_totalAllocatedAmount <= token.balanceOf(address(this)), "need to input the token");
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;

        for(uint256 i = 0; i < _claimCounts; i++) {

            if(claimTimes.length <= i)  claimTimes.push(_claimTimes[i]);
            else claimTimes[i] = _claimTimes[i];

            if(claimAmounts.length <= i) claimAmounts.push(_claimAmounts[i]);
            else claimAmounts[i]= _claimAmounts[i];

            if(addAmounts.length <= i)  addAmounts.push(0);
            else addAmounts[i] = 0;
        }

        emit Initialized(_totalAllocatedAmount, _claimCounts, _claimTimes, _claimAmounts);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setUniswapInfo(
        address poolfactory,
        address npm,
        address swapRouter
        )
        external override
        onlyProxyOwner
    {
        require(poolfactory != address(0) && poolfactory != address(UniswapV3Factory), "zero or same UniswapV3Factory");
        require(npm != address(0) && npm != address(NonfungiblePositionManager), "zero or same npm");
        require(swapRouter != address(0) && swapRouter != address(SwapRouter), "zero or same swapRouter");

        UniswapV3Factory = IUniswapV3Factory(poolfactory);
        NonfungiblePositionManager = INonfungiblePositionManager(npm);
        SwapRouter = ISwapRouter(swapRouter);

        emit SetUniswapInfo(poolfactory, npm, swapRouter);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPoolInfo(
            address wethUsdcPool,
            address wtonWethPool,
            address wtonTosPool
        )
        external override
        onlyProxyOwner
    {
        require(wethUsdcPool != address(0) && wethUsdcPool != address(WETHUSDCPool), "same wethUsdcPool");
        require(wtonWethPool != address(0) && wtonWethPool != address(WTONWETHPool), "same wtonWethPool");
        require(wtonTosPool != address(0) && wtonTosPool != address(WTONTOSPool), "same wtonTosPool");


        WETHUSDCPool = IUniswapV3Pool(wethUsdcPool);
        WTONWETHPool = IUniswapV3Pool(wtonWethPool);
        WTONTOSPool = IUniswapV3Pool(wtonTosPool);

        emit SetPoolInfo(wethUsdcPool, wtonWethPool, wtonTosPool);
    }


    /// @inheritdoc ILiquidityVaultAction
    function setTokens(
            address wton,
            address tos,
            uint24 _fee
        )
        external override
        onlyProxyOwner beforeSetReadyToCreatePool
    {
        require(wton != address(0) && wton != address(WTON), "same wton");
        require(tos != address(0) && tos != address(TOS), "same tos");

        WTON = IERC20(wton);
        TOS = IERC20(tos);
        fee = _fee;

        emit SetTokens(wton, tos, _fee);
    }

    /// @inheritdoc ILiquidityVaultAction
    function changeToken(address _token) external override onlyOwner beforeSetReadyToCreatePool
    {
        token = IERC20(_token);

        emit ChangedToken(_token);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPool()
        public override afterSetUniswap readyToCreatePool
    {
        address getPool = UniswapV3Factory.getPool(address(TOS), address(token), fee);
        if(getPool == address(0)){
            address _pool = UniswapV3Factory.createPool(address(TOS), address(token), fee);
            require(_pool != address(0), "createPool fail");
            getPool = _pool;
        }
        pool = IUniswapV3Pool(getPool);
        token0Address = pool.token0();
        token1Address = pool.token1();

        if(initSqrtPriceX96 > 0){
            setPoolInitialize(initSqrtPriceX96);
        }

        emit SetPool(address(pool), token0Address, token1Address);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPoolInitialize(uint160 inSqrtPriceX96)
        public nonZeroAddress(address(pool)) override readyToCreatePool
    {
        (uint160 sqrtPriceX96,,,,,,) =  pool.slot0();
        if(sqrtPriceX96 == 0){
            pool.initialize(inSqrtPriceX96);

            emit SetPoolInitialized(inSqrtPriceX96);
        }
    }

    /// @inheritdoc ILiquidityVaultAction
    function computePoolAddress(address tokenA, address tokenB, uint24 _fee)
        public view override returns (address pool, address token0, address token1)
    {
        bytes32  POOL_INIT_CODE_HASH = 0xe34f199b19b2b4f47f68442619d555527d244f78a3297ea89325f843f87b8b54;

        token0 = tokenA;
        token1 = tokenB;

        if(token0 > token1) {
            token0 = tokenB;
            token1 = tokenA;
        }

        // pool = PoolAddress.computeAddress(address(UniswapV3Factory),
        // PoolAddress.PoolKey(tokenA, tokenB, _fee));

        //require(token0 < token1);
        pool = address( uint160(
            uint256(
                keccak256(
                    abi.encodePacked(
                        hex'ff',
                        address(UniswapV3Factory),
                        keccak256(abi.encode(token0, token1, _fee)),
                        POOL_INIT_CODE_HASH
                    )
                )
            ))
        );

    }

    /// @inheritdoc ILiquidityVaultAction
    function currentRound() public view override returns (uint256 round) {

        if(totalClaimCounts == 0 || block.timestamp < claimTimes[0]) round = 0;
        else if (totalClaimCounts > 0 && block.timestamp >= claimTimes[totalClaimCounts-1])
            round = totalClaimCounts;
        else
            for(uint256 i = 1; i < totalClaimCounts; i++) {
                if(block.timestamp < claimTimes[i])  {
                    round = i;
                    break;
                }
            }
    }

    /// @inheritdoc ILiquidityVaultAction
    function getClaimInfo() public view override returns (
        uint256 _totalClaimCounts,
        uint256[] memory _claimTimes,
        uint256[] memory _claimAmounts,
        uint256 _totalClaimsAmount,
        uint256[] memory _addAmounts
        ) {

        return (totalClaimCounts, claimTimes, claimAmounts, totalClaimsAmount, addAmounts) ;
    }

    /// @inheritdoc ILiquidityVaultAction
    function availableUseAmount(uint256 _round) public view override returns (uint256 amount) {

        if(_round == 1 ) {
            amount = claimAmounts[0] - totalClaimsAmount;
        } else if(totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            uint256 expectedClaimAmount;
            for(uint256 i = 0; i < _round; i++) {
                expectedClaimAmount = expectedClaimAmount + claimAmounts[i] + addAmounts[i];
            }
            amount = expectedClaimAmount - totalClaimsAmount;
        }
    }


    function getSqrtRatioAtTick(int24 tick) public pure override returns (uint160) {
        return TickMath.getSqrtRatioAtTick(tick);
    }

    function getTickAtSqrtRatio(uint160 sqrtPriceX96) public pure  override returns (int24) {
        return TickMath.getTickAtSqrtRatio(sqrtPriceX96);
    }
    /*
    function MIN_SQRT_RATIO() external pure override returns (uint160) {
        return TickMath.MIN_SQRT_RATIO;
    }

    function MAX_SQRT_RATIO() external pure override returns (uint160) {
        return TickMath.MAX_SQRT_RATIO;
    }
    */
    /// @inheritdoc ILiquidityVaultAction
    function approveERC20(address token, address to, uint256 amount)
        public override
        nonZeroAddress(token)
        nonZeroAddress(to)
        nonZero(amount)
        returns (bool)
    {
        return IERC20(token).approve(to, amount);
    }

    function checkBalance(uint256 tosBalance, uint256 tokenBalance) internal  {
        require(TOS.balanceOf(address(this)) >= tosBalance, "tos is insufficient.");
        require(token.balanceOf(address(this)) >= tokenBalance, "token is insufficient.");
         if(tosBalance > TOS.allowance(address(this), address(NonfungiblePositionManager)) ) {
                require(TOS.approve(address(NonfungiblePositionManager),TOS.totalSupply()),"TOS approve fail");
        }

        if(tokenBalance > token.allowance(address(this), address(NonfungiblePositionManager)) ) {
            require(token.approve(address(NonfungiblePositionManager),token.totalSupply()),"token approve fail");
        }
    }

    /// @inheritdoc ILiquidityVaultAction
    function mint(int24 tickLower, int24 tickUpper)
        external override readyToCreatePool
    {
        mintToken(tickLower, tickUpper,  TOS.balanceOf(address(this)),  token.balanceOf(address(this))/totalClaimCounts );
    }

    /// @inheritdoc ILiquidityVaultAction
    function mintToken(int24 tickLower, int24 tickUpper, uint256 tosUseAmount, uint256 tokenUseAmount)
        public override readyToCreatePool nonReentrant
        nonZeroAddress(address(pool))
        nonZeroAddress(token0Address)
        nonZeroAddress(token1Address)
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(tokenUseAmount > 1 ether, "small token amount");

        require(tickUpper - tickLower >= tickIntervalMinimum, "Vault: tick interval is less than tickIntervalMinimum");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        uint256 curRound = currentRound();
        uint256 amount = availableUseAmount(curRound);

        require(tokenUseAmount <= amount, "exceed to claimable amount");
        require(amount > 0, "claimable token is zero");

        uint256 tosBalance =  TOS.balanceOf(address(this));
        require(tosBalance >= tosUseAmount && tosUseAmount > 0, "tos balance is zero");

        nowClaimRound = curRound;

        (,int24 tick,,,,,) =  pool.slot0();

        require(tickLower < tick && tick < tickUpper, "tick is out of range");

        uint256 amount0Desired =  tosUseAmount;
        uint256 amount1Desired =  tokenUseAmount;
        if(token0Address != address(TOS)){
            amount0Desired = tokenUseAmount;
            amount1Desired = tosUseAmount;
        }

        checkBalance(tosUseAmount, tokenUseAmount);

        int24 _tickLower = tickLower;
        int24 _tickUpper = tickUpper;
        (
            uint256 tokenId,
            uint128 liquidity,
            uint256 amount0,
            uint256 amount1
        ) = NonfungiblePositionManager.mint(INonfungiblePositionManager.MintParams(
                token0Address, token1Address, fee, _tickLower, _tickUpper,
                amount0Desired, amount1Desired, 0, 0,
                address(this), block.timestamp + 100000
            )
        );

        require(tokenId > 0, "tokenId is zero");
        tokenIds.push(tokenId);

        if(token0Address != address(TOS)){
            totalClaimsAmount = totalClaimsAmount + amount0;
            emit Claimed(tokenId, amount0, totalClaimsAmount);
        } else {
            totalClaimsAmount = totalClaimsAmount + amount1;
            emit Claimed(tokenId, amount1, totalClaimsAmount);
        }

        emit MintedInVault(msg.sender, tokenId, liquidity, amount0, amount1);
    }

    function tickRange(uint256 tokenId) internal view returns (int24 tick, int24 tickLower, int24 tickUpper) {
        (, tick,,,,,) =  pool.slot0();
        (,,,,, tickLower, tickUpper,,,,,) = NonfungiblePositionManager.positions(tokenId);
    }

    function shouldInRange(uint256 tokenId) internal view {
        (int24 tick, int24 tickLower, int24 tickUpper) =  tickRange(tokenId);
        require(tickLower < tick && tick < tickUpper, "tick is out of range");
    }

    function shouldOutOfRange(uint256 tokenId) internal view {
        (int24 tick, int24 tickLower, int24 tickUpper) =  tickRange(tokenId);
        require(tick < tickLower ||  tickUpper < tick
            , "tick is not out of range");
    }

    /// @inheritdoc ILiquidityVaultAction
    function increaseLiquidity(
        uint256 tokenId,
        uint256 amount0Desired,
        uint256 amount1Desired,
        uint256 deadline
    )
        external override
        nonZeroAddress(address(pool))
        nonZeroAddress(token0Address)
        nonZeroAddress(token1Address)
        nonReentrant
        returns (uint128 liquidity, uint256 amount0, uint256 amount1)
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");

        //require(NonfungiblePositionManager.ownerOf(tokenId) == address(this), "token's owner is not this.");
        shouldInRange(tokenId);

        nowClaimRound = currentRound();
        uint256 amount = availableUseAmount(nowClaimRound);

        if(token0Address != address(TOS)) {
            require(amount0Desired <= amount, "exceed to claimable amount");
            checkBalance(amount1Desired, amount0Desired);
        }
        else {
            require(amount1Desired <= amount, "exceed to claimable amount");
            checkBalance(amount0Desired, amount1Desired);
        }

        uint256 tokenId_ = tokenId;
        uint256 amount0Desired_ = amount0Desired;
        uint256 amount1Desired_ = amount1Desired;
        uint256 deadline_ = deadline;

        (liquidity, amount0, amount1) = NonfungiblePositionManager.increaseLiquidity(INonfungiblePositionManager.IncreaseLiquidityParams(
                tokenId_, amount0Desired_, amount1Desired_, 0, 0, deadline_));


        if(token0Address != address(TOS)){
            totalClaimsAmount = totalClaimsAmount + amount0;
            emit Claimed(tokenId_, amount0, totalClaimsAmount);
        } else {
            totalClaimsAmount = totalClaimsAmount + amount1;
            emit Claimed(tokenId_, amount1, totalClaimsAmount);
        }

        emit IncreaseLiquidityInVault(tokenId_, liquidity, amount0, amount1);

    }

    /// @inheritdoc ILiquidityVaultAction
    function decreaseLiquidity(
        uint256 tokenId,
        uint128 liquidity,
        uint256 amount0Min,
        uint256 amount1Min,
        uint256 deadline
    )
        external override
        nonZeroAddress(address(pool))
        nonZeroAddress(token0Address)
        nonZeroAddress(token1Address)
        nonReentrant
        returns (
            uint256 amount0,
            uint256 amount1
        )
    {
        //require(NonfungiblePositionManager.ownerOf(tokenId) == address(this), "token's owner is not this.");
        shouldOutOfRange(tokenId);

        (
            amount0,
            amount1
        ) = NonfungiblePositionManager.decreaseLiquidity(INonfungiblePositionManager.DecreaseLiquidityParams(
                tokenId, liquidity, amount0Min, amount1Min, deadline
            )
        );

        if(token0Address == address(token) && amount0 > 0){
            totalClaimsAmount = totalClaimsAmount - amount0;
            emit Claimed(tokenId, amount0, totalClaimsAmount);
        } else if (token1Address == address(token) && amount1 > 0) {
            totalClaimsAmount = totalClaimsAmount - amount1;
            emit Claimed(tokenId, amount1, totalClaimsAmount);
        }

        emit DecreaseLiquidityInVault(tokenId, liquidity, amount0, amount1);
    }

    /// @inheritdoc ILiquidityVaultAction
    function collect(
        uint256 tokenId,
        uint128 amount0Max,
        uint128 amount1Max
    )
        external override
        nonZeroAddress(address(pool))
        nonReentrant
        returns (uint256 amount0, uint256 amount1)
    {
        (
            amount0,
            amount1
        ) = NonfungiblePositionManager.collect(INonfungiblePositionManager.CollectParams(
                tokenId, address(this), amount0Max, amount1Max
            )
        );

        if(token0Address == address(token) && amount0 > 0){

            totalClaimsAmount = totalClaimsAmount + amount0;
            emit Claimed(tokenId, amount0, totalClaimsAmount);

        } else if(token1Address == address(token) && amount1 > 0) {

            totalClaimsAmount = totalClaimsAmount + amount1;
            emit Claimed(tokenId, amount1, totalClaimsAmount);

        }

        emit CollectInVault(tokenId, amount0, amount1);
    }

    /// @inheritdoc ILiquidityVaultAction
    function withdraw(address _token, address _account, uint256 _amount)
        external override nonReentrant
        onlyOwner
    {
        require(totalAllocatedAmount <= totalClaimsAmount, "not closed");
        //require(_token != address(token), "can not withdraw token");
        require(IERC20(_token).balanceOf(address(this)) >= _amount,"Vault: dont have token");
        IERC20(_token).safeTransfer(_account, _amount);

        emit WithdrawalInVault(msg.sender, _token, _account, _amount);
    }
}
