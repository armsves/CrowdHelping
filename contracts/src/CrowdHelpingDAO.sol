// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CrowdHelpingDAO {
    // State variables
    uint256 public totalActivities;
    address public immutable owner;
    
    struct Activity {
        uint256 id;
        address organizer;
        string activityType;
        uint256 fundingGoal;
        uint256 currentFunding;
        bool isVerified;
        bool fundsDelegated;
        mapping(address => uint256) donations;
    }
    
    mapping(uint256 => Activity) public activities;
    
    // Events
    event ActivityCreated(uint256 indexed id, address indexed organizer, string activityType, uint256 fundingGoal);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);
    event ActivityVerified(uint256 indexed id);
    event FundsDelegated(uint256 indexed id, uint256 amount);
    event EmergencyWithdraw(uint256 amount);
    
    error InvalidActivity();
    error Unauthorized();
    error InvalidAmount();
    error AlreadyVerified();
    error FundingGoalNotReached();
    error FundsAlreadyDelegated();
    error TransferFailed();
    
    constructor() {
        owner = msg.sender;
    }
    
    modifier activityExists(uint256 _activityId) {
        if (_activityId == 0 || _activityId > totalActivities) revert InvalidActivity();
        _;
    }
    
    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    function createActivity(
        string calldata _activityType, 
        uint256 _fundingGoal
    ) external {
        if (_fundingGoal == 0) revert InvalidAmount();
        
        unchecked {
            totalActivities++;
        }
        
        Activity storage newActivity = activities[totalActivities];
        newActivity.id = totalActivities;
        newActivity.organizer = msg.sender;
        newActivity.activityType = _activityType;
        newActivity.fundingGoal = _fundingGoal;
        
        emit ActivityCreated(totalActivities, msg.sender, _activityType, _fundingGoal);
    }

    function donate(uint256 _activityId) 
        external 
        payable 
        activityExists(_activityId) 
    {
        Activity storage activity = activities[_activityId];
        if (activity.isVerified) revert AlreadyVerified();
        if (msg.value == 0) revert InvalidAmount();
        
        activity.donations[msg.sender] += msg.value;
        unchecked {
            activity.currentFunding += msg.value;
        }
        
        emit DonationReceived(_activityId, msg.sender, msg.value);
    }

    function verifyActivity(uint256 _activityId) 
        external 
        onlyOwner 
        activityExists(_activityId) 
    {
        Activity storage activity = activities[_activityId];
        if (activity.currentFunding < activity.fundingGoal) revert FundingGoalNotReached();
        if (activity.isVerified) revert AlreadyVerified();
        
        activity.isVerified = true;
        
        emit ActivityVerified(_activityId);
    }

    function delegateFunds(uint256 _activityId) 
        external 
        activityExists(_activityId) 
    {
        Activity storage activity = activities[_activityId];
        if (msg.sender != activity.organizer) revert Unauthorized();
        if (!activity.isVerified) revert Unauthorized();
        if (activity.fundsDelegated) revert FundsAlreadyDelegated();
        
        uint256 fundsToDelegate = activity.currentFunding;
        if (fundsToDelegate == 0) revert InvalidAmount();
        
        activity.currentFunding = 0;
        activity.fundsDelegated = true;
        
        (bool success, ) = payable(activity.organizer).call{value: fundsToDelegate}("");
        if (!success) revert TransferFailed();
        
        emit FundsDelegated(_activityId, fundsToDelegate);
    }

    function getActivity(uint256 _activityId) 
        external 
        view 
        activityExists(_activityId) 
        returns (
            address organizer,
            string memory activityType,
            uint256 fundingGoal,
            uint256 currentFunding,
            bool isVerified,
            bool fundsDelegated
        ) 
    {
        Activity storage activity = activities[_activityId];
        return (
            activity.organizer,
            activity.activityType,
            activity.fundingGoal,
            activity.currentFunding,
            activity.isVerified,
            activity.fundsDelegated
        );
    }

    function getDonation(uint256 _activityId, address _donor) 
        external 
        view 
        activityExists(_activityId) 
        returns (uint256) 
    {
        return activities[_activityId].donations[_donor];
    }
    
    function withdrawEmergency() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InvalidAmount();
        
        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();
        
        emit EmergencyWithdraw(balance);
    }
    
    receive() external payable {}
}