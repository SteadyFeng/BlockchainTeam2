pragma solidity ^0.8.19;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "./GovStable.sol";
import "./InsuranceRegistry.sol";
import "./HospitalBillContract.sol";

contract ReimbursementContract is AccessControl, ReentrancyGuard {
    InsuranceRegistry public registry;
    HospitalBillContract public billContract;
    GovStable public token;

    event Reimbursed(uint256 billId, address citizen, uint256 payout);
    event Rejected(uint256 billId, address citizen, string reason);

    constructor(address _registry, address _billContract, address _token) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        registry = InsuranceRegistry(_registry);
        billContract = HospitalBillContract(_billContract);
        token = GovStable(_token);
    }

    function processReimbursement(uint256 billId) external nonReentrant onlyRole(DEFAULT_ADMIN_ROLE) {
        HospitalBillContract.Bill memory bill = billContract.getBill(billId);
        if (bill.status != HospitalBillContract.BillStatus.Submitted) {
            emit Rejected(billId, bill.citizen, "Invalid status");
            return;
        }

        (uint256 planId, InsuranceRegistry.Plan memory plan) = registry.getPlanOf(bill.citizen);
        if (plan.coverageLimit == 0) {
            emit Rejected(billId, bill.citizen, "Citizen not registered");
            return;
        }

        uint256 paidSoFar = registry.totalPaid(bill.citizen);
        if (paidSoFar >= plan.coverageLimit) {
            emit Rejected(billId, bill.citizen, "Coverage exhausted");
            return;
        }

        uint256 deductible = plan.deductible;
        uint256 copayPct = plan.copayBps; // e.g., 100 = 1%

        uint256 eligible = 0;
        if (bill.amount > deductible) {
            eligible = bill.amount - deductible;
        }

        uint256 payout = (eligible * (10000 - copayPct)) / 10000;
        if (payout + paidSoFar > plan.coverageLimit) {
            payout = plan.coverageLimit - paidSoFar;
        }

        if (payout == 0) {
            emit Rejected(billId, bill.citizen, "Payout = 0");
            return;
        }

        token.mint(bill.citizen, payout);
        registry.addPaid(bill.citizen, payout);
        billContract.markReimbursed(billId);

        emit Reimbursed(billId, bill.citizen, payout);
    }
}
