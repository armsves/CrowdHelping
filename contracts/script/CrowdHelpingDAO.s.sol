// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.19;

import {Script, console} from "forge-std/Script.sol";
import {CrowdHelpingDAO} from "../src/CrowdHelpingDAO.sol";

contract DeployScript is Script {
    CrowdHelpingDAO public dao;

    function setUp() public {}

    function run() public {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployerAddress = vm.addr(deployerPrivateKey);
        
        console.log("Deploying CrowdHelpingDAO with address:", deployerAddress);
        
        vm.startBroadcast(deployerPrivateKey);

        dao = new CrowdHelpingDAO();
        
        console.log("CrowdHelpingDAO deployed at:", address(dao));

        vm.stopBroadcast();
        
        // Verify deployment
        require(dao.owner() == deployerAddress, "Deployment verification failed: incorrect owner");
        require(dao.totalActivities() == 0, "Deployment verification failed: non-zero activities");
        
        console.log("Deployment verified successfully");
    }
}