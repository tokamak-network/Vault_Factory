//SPDX-License-Identifier: Unlicense
pragma solidity ^0.8.4;

interface IRewardProgramVaultFactory {

    event CreatedRewardProgramVault(address contractAddress, string name);

    /// ###### only admin ######

    /// @dev set Staker
    /// @param _staker staker address
    function setStaker(
        address _staker
    ) external;


    /// ### anybody can use

    /// @dev Create a RewardProgramVaultProxy
    /// @param _name name
    /// @param pool pool address
    /// @param rewardToken  rewardToken address
    /// @param _admin  admin address
    /// @param waitStartTime  Waiting time before start time (seconds)
    /// @param programPeriod  Program operation period (seconds)
    /// @return created contract address
    function create(
        string calldata _name,
        address pool,
        address rewardToken,
        address _admin,
        uint256 waitStartTime,
        uint256 programPeriod
    )
        external
        returns (address);


}
