//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "../common/AccessiblePlusCommon.sol";
import "hardhat/console.sol";

contract typeCVault is AccessiblePlusCommon {
    using SafeERC20 for IERC20;

    string public name;

    IERC20 public token;

    bool public settingCheck;
    address public owner;   

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
        address _owner
    ) {
        name = _name;
        token = IERC20(_token);
        owner = _owner;
        _setRoleAdmin(ADMIN_ROLE, ADMIN_ROLE);
        _setupRole(ADMIN_ROLE, owner);
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
        require(_totalAllocatedAmount == token.balanceOf(address(this)), "need to input the token");
        totalAllocatedAmount = _totalAllocatedAmount;
        totalClaimCounts = _claimCounts;
        uint256 i = 0;
        for(i = 0; i < _claimCounts; i++) {
            claimTimes.push(_claimTimes[i]);
            console.log("claimTimes['%s'] : '%s', _claimTimes[i] : '%s'", i, claimTimes[i], _claimTimes[i]);
            claimAmounts.push(_claimAmounts[i]);
            console.log("claimAmounts['%s'] : '%s', _claimAmounts[i] : '%s'", i, claimTimes[i], _claimTimes[i]);
        }

        grantRole(CLAIMER_ROLE, owner);
        revokeRole(ADMIN_ROLE, owner);
    }

    function changeToken(address _token) external onlyOwner {
        token = IERC20(_token);
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

    function calcalClaimAmount(uint256 _round) public view returns (uint256 amount) {
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

    function claim(address _account)
        external
        onlyClaimer
    {
        require(block.timestamp > claimTimes[0], "Vault: not started yet");
        require(totalAllocatedAmount > totalClaimsAmount,"Vault: already All get");

        uint256 curRound = currentRound();

        uint256 amount = calcalClaimAmount(curRound);

        require(token.balanceOf(address(this)) >= amount,"Vault: dont have token");
        nowClaimRound = curRound;
        totalClaimsAmount = totalClaimsAmount + amount;
        token.safeTransfer(_account, amount);

        emit Claimed(msg.sender, amount, totalClaimsAmount);
    }

    function withdraw(address _account, uint256 _amount)
        external    
        onlyOwner
    {
        require(token.balanceOf(address(this)) >= _amount,"Vault: dont have token");
        token.safeTransfer(_account, _amount);
    }
}
