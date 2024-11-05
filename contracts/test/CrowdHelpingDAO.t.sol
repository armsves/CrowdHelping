// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "forge-std/Test.sol";
import "../src/CrowdHelpingDAO.sol";

contract CrowdHelpDAOTest is Test {
    CrowdHelpingDAO public dao;
    address public owner;
    address public user1;
    address public user2;
    
    event ActivityCreated(uint256 indexed id, address indexed organizer, string activityType, uint256 fundingGoal);
    event DonationReceived(uint256 indexed id, address indexed donor, uint256 amount);
    event ActivityVerified(uint256 indexed id);
    event FundsDelegated(uint256 indexed id, uint256 amount);
    event EmergencyWithdraw(uint256 amount);
    event UserVerified(address indexed user);
    event UserUnverified(address indexed user);
    event VoteCast(uint256 indexed activityId, address indexed voter);
    event CountUpdated(uint256 newCount);

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        dao = new CrowdHelpingDAO();
    }

    function testVerifyUser() public {
        vm.expectEmit(true, false, false, false);
        emit UserVerified(user1);
        
        dao.verifyUser(user1);
        assertTrue(dao.verifiedUsers(user1));
    }

    function testUnverifyUser() public {
        dao.verifyUser(user1);
        
        vm.expectEmit(true, false, false, false);
        emit UserUnverified(user1);
        
        dao.unverifyUser(user1);
        assertFalse(dao.verifiedUsers(user1));
    }

    function testFailUnverifiedUserVote() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.voteForActivity(1);
    }

    function testVoteForActivity() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        dao.verifyUser(user2);
        
        vm.expectEmit(true, true, false, false);
        emit VoteCast(1, user2);
        
        vm.prank(user2);
        dao.voteForActivity(1);
        
        (,,,,,,uint256 votes) = dao.getActivity(1);
        assertEq(votes, 1);
        assertTrue(dao.hasVoted(1, user2));
    }

    function testFailDoubleVote() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        dao.verifyUser(user2);
        
        vm.startPrank(user2);
        dao.voteForActivity(1);
        dao.voteForActivity(1);
        vm.stopPrank();
    }

    function testGetCount() public {
        assertEq(dao.getCount(), 0);
    }

    function testIncrement() public {
        dao.increment();
        assertEq(dao.getCount(), 1);
    }

    function testDecrement() public {
        dao.increment();
        dao.decrement();
        assertEq(dao.getCount(), 0);
    }

    function testFailDecrementBelowZero() public {
        dao.decrement();
    }

    function testReset() public {
        dao.increment();
        dao.increment();
        dao.reset();
        assertEq(dao.getCount(), 0);
    }

    function testCreateActivity() public {
        vm.expectEmit(true, true, false, true);
        emit ActivityCreated(1, user1, "Charity Event", 1 ether);
        
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        (
            address organizer,
            string memory activityType,
            uint256 fundingGoal,
            uint256 currentFunding,
            bool isVerified,
            bool fundsDelegated,
            uint256 votes
        ) = dao.getActivity(1);
        
        assertEq(organizer, user1);
        assertEq(activityType, "Charity Event");
        assertEq(fundingGoal, 1 ether);
        assertEq(currentFunding, 0);
        assertEq(isVerified, false);
        assertEq(fundsDelegated, false);
        assertEq(votes, 0);
    }

    function testDonate() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.expectEmit(true, true, false, true);
        emit DonationReceived(1, user2, 0.5 ether);
        
        vm.prank(user2);
        dao.donate{value: 0.5 ether}(1);
        
        (,,,uint256 currentFunding,,,) = dao.getActivity(1);
        assertEq(currentFunding, 0.5 ether);
        assertEq(dao.getDonation(1, user2), 0.5 ether);
    }

    function testVerifyActivity() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        vm.expectEmit(true, false, false, false);
        emit ActivityVerified(1);
        
        dao.verifyActivity(1);
        
        (,,,,bool isVerified,,) = dao.getActivity(1);
        assertTrue(isVerified);
    }

    function testDelegateFunds() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        dao.verifyActivity(1);
        
        vm.expectEmit(true, false, false, true);
        emit FundsDelegated(1, 1 ether);
        
        vm.prank(user1);
        dao.delegateFunds(1);
        
        (,,,,bool isVerified, bool fundsDelegated,) = dao.getActivity(1);
        assertTrue(isVerified);
        assertTrue(fundsDelegated);
    }

    function testFailCreateActivityZeroGoal() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 0);
    }

    function testFailDonateZeroAmount() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 0}(1);
    }

    function testFailVerifyUnreachedGoal() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 0.5 ether}(1);
        
        dao.verifyActivity(1);
    }

    function testFailDelegateUnverifiedActivity() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        vm.prank(user1);
        dao.delegateFunds(1);
    }

    function testFailDelegateNonOrganizer() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        dao.verifyActivity(1);
        
        vm.prank(user2);
        dao.delegateFunds(1);
    }

    function testFailDoubleDelegation() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        dao.verifyActivity(1);
        
        vm.startPrank(user1);
        dao.delegateFunds(1);
        dao.delegateFunds(1);
    }

    function testFailDonateToVerifiedActivity() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        dao.verifyActivity(1);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
    }

    function testEmergencyWithdraw() public {
        vm.deal(address(dao), 1 ether);
        
        vm.expectEmit(false, false, false, true);
        emit EmergencyWithdraw(1 ether);
        
        dao.withdrawEmergency();
        assertEq(address(dao).balance, 0);
    }

    function testFailEmergencyWithdrawUnauthorized() public {
        vm.deal(address(dao), 1 ether);
        
        vm.prank(user1);
        dao.withdrawEmergency();
    }

    receive() external payable {}
}