//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/AccessiblePlusCommon.sol";
import "../interfaces/ILockTOSDividend.sol";

contract TOSVault is AccessiblePlusCommon {
    using SafeERC20 for IERC20;

    string public name;

    address public token;

    bool public settingCheck;
    address public owner;

    address public dividiedPool;

    uint256 public totalAllocatedAmount;   

    uint256 public totalClaimCounts;      

    uint256 public nowClaimRound = 0;      

    uint256 public totalClaimsAmount;

    uint256[] public claimTimes;
    uint256[] public claimAmounts;          

    event Claimed(
        address indexed caller,
        uint256 amount,
        uint256 totalClaimedAmount
    );        

    modifier nonZeroAddress(address _addr) {
        require(_addr != address(0), "Vault: zero address");
        _;
    }

    modifier nonZero(uint256 _value) {
        require(_value > 0, "Vault: zero value");
        _;
    }

    ///@dev constructor
    ///@param _name Vault's name
    ///@param _token Allocated token address
    ///@param _owner owner address
    constructor(
        string memory _name,
        address _token,
        address _owner,
        address _dividedPool,
        address _factoryOwner
    ) {
        name = _name;
        token = _token;
        owner = _owner;
        dividiedPool = _dividedPool;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, owner);
        _setupRole(ADMIN_ROLE, _factoryOwner);
    }

    ///@dev initialization function
    ///@param _totalAllocatedAmount total allocated amount           
    ///@param _claimCounts total claim Counts
    ///@param _claimTimes each claimTime
    ///@param _claimAmounts each claimAmount
    function initialize(
        uint256 _totalAllocatedAmount,
        uint256 _claimCounts,
        uint256[] calldata _claimTimes,
        uint256[] calldata _claimAmounts
    ) external onlyOwner {
        require(_totalAllocatedAmount == IERC20(token).balanceOf(address(this)), "need to input the token");
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;
        uint256 i = 0;
        for(i = 0; i < _claimCounts; i++) {
            claimTimes.push(_claimTimes[i]);
            claimAmounts.push(_claimAmounts[i]);
        }

        revokeRole(ADMIN_ROLE, owner);
    }

    function changeToken(address _token) external onlyOwner {
        token = _token;
    }

    function currentRound() public view returns (uint256 round) {
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

    function calculClaimAmount(uint256 _round) public view returns (uint256 amount) {
        uint256 expectedClaimAmount;
        for(uint256 i = 0; i < _round; i++) {
           expectedClaimAmount = expectedClaimAmount + claimAmounts[i];
        }
        if(_round == 1 ) {
            amount = claimAmounts[0];
        } else if(totalClaimCounts == _round) {
            amount = totalAllocatedAmount - totalClaimsAmount;
        } else {
            amount = expectedClaimAmount - totalClaimsAmount;
        }        
    }

    function approve() external {
        IERC20(token).approve(dividiedPool,totalAllocatedAmount);
    }

    function claim()
        external
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");
        uint256 curRound = currentRound();
        uint256 amount = calculClaimAmount(curRound);

        require(IERC20(token).balanceOf(address(this)) >= amount,"Vault: dont have token");
        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;
        ILockTOSDividend(dividiedPool).distribute(token, amount);

        emit Claimed(msg.sender, amount, totalClaimsAmount);
    }

    function withdraw(address _account, uint256 _amount)
        external    
        onlyOwner
    {
        require(IERC20(token).balanceOf(address(this)) >= _amount,"Vault: dont have token");
        IERC20(token).safeTransfer(_account, _amount);
    }
}
