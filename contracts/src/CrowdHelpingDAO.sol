// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract CrowdHelpingDAO {
    // State variables
    uint256 public totalActivities;
    address public immutable owner;
    uint256 private count;

    struct Activity {
        uint256 id;
        address organizer;
        string activityType;
        uint256 fundingGoal;
        uint256 currentFunding;
        bool isVerified;
        bool fundsDelegated;
        uint256 votes;
        mapping(address => bool) hasVoted;
        mapping(address => uint256) donations;
    }

    mapping(uint256 => Activity) public activities;
    mapping(address => bool) public verifiedUsers;

    // Events
    event ActivityCreated(
        uint256 indexed id,
        address indexed organizer,
        string activityType,
        uint256 fundingGoal
    );
    event DonationReceived(
        uint256 indexed id,
        address indexed donor,
        uint256 amount
    );
    event ActivityVerified(uint256 indexed id);
    event FundsDelegated(uint256 indexed id, uint256 amount);
    event EmergencyWithdraw(uint256 amount);
    event CountUpdated(uint256 newCount);
    event UserVerified(address indexed user);
    event UserUnverified(address indexed user);
    event VoteCast(uint256 indexed activityId, address indexed voter);

    error InvalidActivity();
    error Unauthorized();
    error InvalidAmount();
    error AlreadyVerified();
    error FundingGoalNotReached();
    error FundsAlreadyDelegated();
    error TransferFailed();
    error AlreadyVoted();
    error NotVerifiedUser();

    constructor() {
        owner = msg.sender;
        count = 0;
        verifiedUsers[msg.sender] = true; // Owner is verified by default
    }

    modifier activityExists(uint256 _activityId) {
        if (_activityId == 0 || _activityId > totalActivities)
            revert InvalidActivity();
        _;
    }

    modifier onlyOwner() {
        if (msg.sender != owner) revert Unauthorized();
        _;
    }

    modifier onlyVerifiedUser() {
        if (!verifiedUsers[msg.sender]) revert NotVerifiedUser();
        _;
    }

    // New function to verify users
    function verifyUser(address _user) external //onlyOwner
    {
        verifiedUsers[_user] = true;
        emit UserVerified(_user);
    }

    // New function to unverify users
    function unverifyUser(address _user) external onlyOwner {
        verifiedUsers[_user] = false;
        emit UserUnverified(_user);
    }

    // New function to vote for an activity
    function voteForActivity(
        uint256 _activityId
    ) external activityExists(_activityId) onlyVerifiedUser {
        Activity storage activity = activities[_activityId];
        if (activity.hasVoted[msg.sender]) revert AlreadyVoted();

        activity.votes++;
        activity.hasVoted[msg.sender] = true;

        emit VoteCast(_activityId, msg.sender);
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

        emit ActivityCreated(
            totalActivities,
            msg.sender,
            _activityType,
            _fundingGoal
        );
    }

    function donate(
        uint256 _activityId
    ) external payable activityExists(_activityId) {
        Activity storage activity = activities[_activityId];
        if (activity.isVerified) revert AlreadyVerified();
        if (msg.value == 0) revert InvalidAmount();

        activity.donations[msg.sender] += msg.value;
        unchecked {
            activity.currentFunding += msg.value;
        }

        emit DonationReceived(_activityId, msg.sender, msg.value);
    }

    function verifyActivity(
        uint256 _activityId
    )
        external
        //onlyOwner
        activityExists(_activityId)
    {
        Activity storage activity = activities[_activityId];
        if (activity.currentFunding < activity.fundingGoal)
            revert FundingGoalNotReached();
        if (activity.isVerified) revert AlreadyVerified();

        activity.isVerified = true;

        emit ActivityVerified(_activityId);
    }

    function delegateFunds(
        uint256 _activityId
    ) external activityExists(_activityId) {
        Activity storage activity = activities[_activityId];
        if (msg.sender != activity.organizer) revert Unauthorized();
        if (!activity.isVerified) revert Unauthorized();
        if (activity.fundsDelegated) revert FundsAlreadyDelegated();

        uint256 fundsToDelegate = activity.currentFunding;
        if (fundsToDelegate == 0) revert InvalidAmount();

        activity.currentFunding = 0;
        activity.fundsDelegated = true;

        (bool success, ) = payable(activity.organizer).call{
            value: fundsToDelegate
        }("");
        if (!success) revert TransferFailed();

        emit FundsDelegated(_activityId, fundsToDelegate);
    }

    // Modified getActivity function to include votes
    function getActivity(
        uint256 _activityId
    )
        external
        view
        activityExists(_activityId)
        returns (
            address organizer,
            string memory activityType,
            uint256 fundingGoal,
            uint256 currentFunding,
            bool isVerified,
            bool fundsDelegated,
            uint256 votes
        )
    {
        Activity storage activity = activities[_activityId];
        return (
            activity.organizer,
            activity.activityType,
            activity.fundingGoal,
            activity.currentFunding,
            activity.isVerified,
            activity.fundsDelegated,
            activity.votes
        );
    }

    // Function to check if a user has voted for an activity
    function hasVoted(
        uint256 _activityId,
        address _user
    ) external view activityExists(_activityId) returns (bool) {
        return activities[_activityId].hasVoted[_user];
    }

    function getDonation(
        uint256 _activityId,
        address _donor
    ) external view activityExists(_activityId) returns (uint256) {
        return activities[_activityId].donations[_donor];
    }

    function withdrawEmergency() external onlyOwner {
        uint256 balance = address(this).balance;
        if (balance == 0) revert InvalidAmount();

        (bool success, ) = payable(owner).call{value: balance}("");
        if (!success) revert TransferFailed();

        emit EmergencyWithdraw(balance);
    }

    // Function to get current count
    function getCount() public view returns (uint256) {
        return count;
    }

    // Function to increment count
    function increment() public {
        count += 1;
        emit CountUpdated(count);
    }

    // Function to decrement count
    function decrement() public {
        require(count > 0, "Count cannot be negative");
        count -= 1;
        emit CountUpdated(count);
    }

    // Function to reset count to zero
    function reset() public {
        count = 0;
        emit CountUpdated(count);
    }

    receive() external payable {}
}
