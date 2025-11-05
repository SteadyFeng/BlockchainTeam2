pragma solidity ^0.8.19;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract InsuranceRegistry is AccessControl {
    bytes32 public constant GOV_ROLE = keccak256("GOV_ROLE");
    
    // 报销合约地址，用于限制 addPaid 的调用方
    address public reimbursementContract;

    struct Plan {
        uint16 copayBps;
        uint256 deductible;
        uint256 coverageLimit;
    }

    mapping(uint256 => Plan) public plans;
    mapping(address => uint256) public citizenPlan;
    mapping(address => uint256) public totalPaid;
    // 终止状态：true 表示已终止，false 表示活跃
    mapping(address => bool) public terminated;

    event CitizenRegistered(address indexed citizen, uint256 planId);
    event PlanUpdated(uint256 planId);
    // 新增事件：公民保险被终止
    event CitizenTerminated(address indexed citizen);

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
        terminated[citizen] = false; // 注册时标记为活跃
        emit CitizenRegistered(citizen, planId);
    }

    // 仅允许报销合约调用，用于记录已支付金额
    function addPaid(address citizen, uint256 amount) external {
        require(msg.sender == reimbursementContract, "Only ReimbursementContract");
        totalPaid[citizen] += amount;
    }

    // 设置报销合约地址（仅政府角色）
    function setReimbursementContract(address _rc) external onlyRole(GOV_ROLE) {
        require(_rc != address(0), "Invalid address");
        reimbursementContract = _rc;
    }

    // 终止公民保险（仅政府角色），不删除链上数据，仅标记为终止
    function terminateCitizen(address citizen) external onlyRole(GOV_ROLE) {
        terminated[citizen] = true;
        emit CitizenTerminated(citizen);
    }

    function getPlanOf(address citizen) external view returns (uint256 planId, Plan memory p) {
        // 若已终止，返回空计划用于逻辑停用
        if (terminated[citizen]) {
            planId = 0;
            p = Plan({copayBps: 0, deductible: 0, coverageLimit: 0});
            return (planId, p);
        }
        planId = citizenPlan[citizen];
        p = plans[planId];
    }
}
