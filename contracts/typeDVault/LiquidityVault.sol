//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "../interfaces/IUniswapV3Factory.sol";
import "../interfaces/IUniswapV3Pool.sol";
import "../interfaces/INonfungiblePositionManager.sol";
import "../interfaces/ISwapRouter.sol";
import "../interfaces/ILiquidityVaultEvent.sol";
import "../interfaces/ILiquidityVaultAction.sol";

import "../libraries/TickMath.sol";

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/math/SafeMath.sol";
import "../common/AccessiblePlusCommon.sol";
import "./LiquidityVaultStorage.sol";
import "hardhat/console.sol";

contract LiquidityVault is LiquidityVaultStorage, AccessiblePlusCommon, ILiquidityVaultEvent, ILiquidityVaultAction {
    using SafeERC20 for IERC20;
    using SafeMath for uint256;

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "Vault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value > 0, "Vault: zero value");
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
        owner = msg.sender;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, owner);
        tickIntervalMinimum = 0;

    }

    /// @inheritdoc ILiquidityVaultAction
    function setBaseInfo(
        string memory _name,
        address _token,
        address _owner
        )
        external override
        onlyOwner
    {
        //require(bytes(name).length == 0,"already set");
        name = _name;
        token = IERC20(_token);

        if(_owner != owner){
            owner = _owner;
            _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
            _setupRole(ADMIN_ROLE, owner);
        }
    }

    /// @inheritdoc ILiquidityVaultAction
    function setInitialPrice(
        uint256 tosPrice,
        uint256 tokenPrice,
        uint160 initSqrtPrice
        )
        external override
        onlyOwner
    {
        initialTosPrice = tosPrice;
        initialTokenPrice = tokenPrice;
        initSqrtPriceX96 = initSqrtPrice;
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
    }

    /// @inheritdoc ILiquidityVaultAction
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts

    ) external override onlyOwner afterSetUniswap {

        require(_totalAllocatedAmount <= token.balanceOf(address(this)), "need to input the token");
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;
        uint256 i = 0;
        for(i = 0; i < _claimCounts; i++) {
            claimTimes.push(_claimTimes[i]);
            //console.log("claimTimes['%s'] : '%s', _claimTimes[i] : '%s'", i, claimTimes[i], _claimTimes[i]);
            claimAmounts.push(_claimAmounts[i]);
            //console.log("claimAmounts['%s'] : '%s', _claimAmounts[i] : '%s'", i, claimTimes[i], _claimTimes[i]);

            addAmounts.push(0);
        }
    }

    /// @inheritdoc ILiquidityVaultAction
    function setUniswapInfo(
        address poolfactory,
        address npm,
        address swapRouter
        )
        external override
        onlyOwner
    {
        require(poolfactory != address(0) && poolfactory != address(UniswapV3Factory), "same factory");
        require(npm != address(0) && npm != address(NonfungiblePositionManager), "same npm");
        require(swapRouter != address(0) && swapRouter != address(SwapRouter), "same swapRouter");

        UniswapV3Factory = IUniswapV3Factory(poolfactory);
        NonfungiblePositionManager = INonfungiblePositionManager(npm);
        SwapRouter = ISwapRouter(swapRouter);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPoolInfo(
            address wethUsdcPool,
            address wtonWethPool,
            address wtonTosPool
        )
        external override
        onlyOwner
    {
        require(wethUsdcPool != address(0) && wethUsdcPool != address(WETHUSDCPool), "same wethUsdcPool");
        require(wtonWethPool != address(0) && wtonWethPool != address(WTONWETHPool), "same wtonWethPool");
        require(wtonTosPool != address(0) && wtonTosPool != address(WTONTOSPool), "same wtonTosPool");


        WETHUSDCPool = IUniswapV3Pool(wethUsdcPool);
        WTONWETHPool = IUniswapV3Pool(wtonWethPool);
        WTONTOSPool = IUniswapV3Pool(wtonTosPool);

    }

    /// @inheritdoc ILiquidityVaultAction
    function setTokens(
            address wton,
            address tos,
            uint24 _fee
        )
        external override
        onlyOwner
    {
        require(wton != address(0) && wton != address(WTON), "same wton");
        require(tos != address(0) && tos != address(TOS), "same tos");

        WTON = IERC20(wton);
        TOS = IERC20(tos);
        fee = _fee;
    }

    /// @inheritdoc ILiquidityVaultAction
    function changeToken(address _token) external override onlyOwner {
        token = IERC20(_token);
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPool()
        public override afterSetUniswap
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
    }

    /// @inheritdoc ILiquidityVaultAction
    function setPoolInitialize(uint160 inSqrtPriceX96)
        public nonZeroAddress(address(pool)) override
    {
        (uint160 sqrtPriceX96,,,,,,) =  pool.slot0();
        if(sqrtPriceX96 == 0){
            pool.initialize(inSqrtPriceX96);
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
        require(token0 < token1);
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

        return (pool, token0, token1);
    }

    /// @inheritdoc ILiquidityVaultAction
    function currentRound() public view override returns (uint256 round) {
        for(uint256 i = totalClaimCounts; i > 0; i--) {
            if(block.timestamp < claimTimes[0]){
                round = 0;
            } else if(block.timestamp < claimTimes[i-1] && i != 0) {
                round = i-1;
            } else if (block.timestamp > claimTimes[totalClaimCounts-1]) {
                round = totalClaimCounts;
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
        uint256 expectedClaimAmount;
        for(uint256 i = 0; i < _round; i++) {
           expectedClaimAmount = expectedClaimAmount + claimAmounts[i] + addAmounts[i];
        }
        if(_round == 1 ) {
            amount = claimAmounts[0] - totalClaimsAmount;
        } else if(totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            amount = expectedClaimAmount - totalClaimsAmount;
        }
    }


    function getSqrtRatioAtTick(int24 tick) public pure override returns (uint160) {
        return TickMath.getSqrtRatioAtTick(tick);
    }

    function getTickAtSqrtRatio(uint160 sqrtPriceX96) public pure  override returns (int24) {
        return TickMath.getTickAtSqrtRatio(sqrtPriceX96);
    }

    function MIN_SQRT_RATIO() external pure override returns (uint160) {
        return TickMath.MIN_SQRT_RATIO;
    }

    function MAX_SQRT_RATIO() external pure override returns (uint160) {
        return TickMath.MAX_SQRT_RATIO;
    }

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
        external override
    {
        mintToken(tickLower, tickUpper,  TOS.balanceOf(address(this)),  token.balanceOf(address(this))/totalClaimCounts );
    }

    /// @inheritdoc ILiquidityVaultAction
    function mintToken(int24 tickLower, int24 tickUpper, uint256 tosUseAmount, uint256 tokenUseAmount)
        public override
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

        require(tokenUseAmount > 0, "tokenUseAmount is zero");

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


    function shouldInRange(uint256 tokenId) internal view {

        (,int24 tick,,,,,) =  pool.slot0();
        (,,,,, int24 tickLower, int24 tickUpper,,,,,) = NonfungiblePositionManager.positions(tokenId);

        require(tickLower < tick && tick < tickUpper, "tick is out of range");
    }

    function shouldOutOfRange(uint256 tokenId) internal view {

        (,int24 tick,,,,,) =  pool.slot0();
        (,,,,, int24 tickLower, int24 tickUpper,,,,,) = NonfungiblePositionManager.positions(tokenId);

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
        external override returns (uint256 amount0, uint256 amount1)
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
        external override
        onlyOwner
    {
        require(totalAllocatedAmount <= totalClaimsAmount, "not closed");
        //require(_token != address(token), "can not withdraw token");
        require(IERC20(_token).balanceOf(address(this)) >= _amount,"Vault: dont have token");
        IERC20(_token).safeTransfer(_account, _amount);

        emit WithdrawalInVault(msg.sender, _token, _account, _amount);
    }

}