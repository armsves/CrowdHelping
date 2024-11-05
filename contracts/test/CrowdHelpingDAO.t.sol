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

    function setUp() public {
        owner = address(this);
        user1 = address(0x1);
        user2 = address(0x2);
        
        vm.deal(user1, 100 ether);
        vm.deal(user2, 100 ether);
        
        dao = new CrowdHelpingDAO();
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
            bool fundsDelegated
        ) = dao.getActivity(1);
        
        assertEq(organizer, user1);
        assertEq(activityType, "Charity Event");
        assertEq(fundingGoal, 1 ether);
        assertEq(currentFunding, 0);
        assertEq(isVerified, false);
        assertEq(fundsDelegated, false);
    }

    function testFailCreateActivityZeroGoal() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 0);
    }

    function testDonate() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.expectEmit(true, true, false, true);
        emit DonationReceived(1, user2, 0.5 ether);
        
        vm.prank(user2);
        dao.donate{value: 0.5 ether}(1);
        
        (,,, uint256 currentFunding,,) = dao.getActivity(1);
        assertEq(currentFunding, 0.5 ether);
        assertEq(dao.getDonation(1, user2), 0.5 ether);
    }

    function testFailDonateZeroAmount() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 0}(1);
    }

    function testVerifyActivity() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 1 ether}(1);
        
        vm.expectEmit(true, false, false, false);
        emit ActivityVerified(1);
        
        dao.verifyActivity(1);
        
        (,,,, bool isVerified,) = dao.getActivity(1);
        assertTrue(isVerified);
    }

    function testFailVerifyUnreachedGoal() public {
        vm.prank(user1);
        dao.createActivity("Charity Event", 1 ether);
        
        vm.prank(user2);
        dao.donate{value: 0.5 ether}(1);
        
        dao.verifyActivity(1);
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
        
        (,,,, bool isVerified, bool fundsDelegated) = dao.getActivity(1);
        assertTrue(isVerified);
        assertTrue(fundsDelegated);
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