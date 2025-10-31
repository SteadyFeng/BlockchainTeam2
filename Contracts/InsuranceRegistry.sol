pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract InsuranceRegistry is AccessControl {
    bytes32 public constant GOV_ROLE = keccak256("GOV_ROLE");

    struct Plan {
        uint16 copayBps;
        uint256 deductible;
        uint256 coverageLimit;
    }

    mapping(uint256 => Plan) public plans;
    mapping(address => uint256) public citizenPlan;
    mapping(address => uint256) public totalPaid;

    event CitizenRegistered(address indexed citizen, uint256 planId);
    event PlanUpdated(uint256 planId);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(GOV_ROLE, msg.sender);
    }

    function setPlan(uint256 planId, Plan calldata p) external onlyRole(GOV_ROLE) {
        plans[planId] = p;
        emit PlanUpdated(planId);
    }

    function registerCitizen(address citizen, uint256 planId) external onlyRole(GOV_ROLE) {
        require(plans[planId].coverageLimit > 0, "Invalid plan");
        citizenPlan[citizen] = planId;
        emit CitizenRegistered(citizen, planId);
    }

    function addPaid(address citizen, uint256 amount) external onlyRole(GOV_ROLE) {
        totalPaid[citizen] += amount;
    }

    function getPlanOf(address citizen) external view returns (uint256 planId, Plan memory p) {
        planId = citizenPlan[citizen];
        p = plans[planId];
    }
}
