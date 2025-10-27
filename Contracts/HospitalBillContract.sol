pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";

contract HospitalBillContract is AccessControl {
    bytes32 public constant HOSPITAL_ROLE = keccak256("HOSPITAL_ROLE");
    bytes32 public constant REIMBURSE_ROLE = keccak256("REIMBURSE_ROLE");

    enum BillStatus { Submitted, Reimbursed, Rejected }

    struct Bill {
        address citizen;
        uint256 serviceCode;
        uint256 amount;
        bytes32 docHash;
        BillStatus status;
    }

    Bill[] public bills;

    event BillSubmitted(uint256 billId, address indexed citizen, uint256 amount);
    event BillStatusChanged(uint256 billId, BillStatus newStatus);

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(HOSPITAL_ROLE, msg.sender);
    }

    function submitBill(
        address citizen,
        uint256 serviceCode,
        uint256 amount,
        bytes32 docHash
    ) external onlyRole(HOSPITAL_ROLE) returns (uint256 billId) {
        require(amount > 0, "Invalid amount");
        bills.push(Bill(citizen, serviceCode, amount, docHash, BillStatus.Submitted));
        billId = bills.length - 1;
        emit BillSubmitted(billId, citizen, amount);
    }

    function getBill(uint256 billId) external view returns (Bill memory) {
        return bills[billId];
    }

    function markReimbursed(uint256 billId) external onlyRole(REIMBURSE_ROLE) {
        bills[billId].status = BillStatus.Reimbursed;
        emit BillStatusChanged(billId, BillStatus.Reimbursed);
    }

    function markRejected(uint256 billId) external onlyRole(REIMBURSE_ROLE) {
        bills[billId].status = BillStatus.Rejected;
        emit BillStatusChanged(billId, BillStatus.Rejected);
    }
}
