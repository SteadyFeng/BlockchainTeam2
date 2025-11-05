// 合约ABI和地址配置
export const CONTRACT_ADDRESSES = {
  // 最新部署的合约地址 (当前Ganache网络部署)
  GOVSTABLE: "0x9FCD72bb9C63Bfad0047a5020709Bbc3fe26F559",
  INSURANCE_REGISTRY: "0xA4622b91dA6C4184031C6177b3f711acB9993277",
  HOSPITAL_BILL: "0xd7aA85b782320A537A43971783C50a6a3E5215aa",
  REIMBURSEMENT: "0x0ecf39eC6D8035433e02156ff6640F3C52Ea0319",
};

// GovStable合约ABI
export const GOVSTABLE_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address owner) view returns (uint256)",
  "function transfer(address to, uint256 amount) returns (bool)",
  "function mint(address to, uint256 amount)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "event Transfer(address indexed from, address indexed to, uint256 value)"
];

// HospitalBillContract ABI
export const HOSPITAL_BILL_ABI = [
  "function submitBill(address citizen, uint256 serviceCode, uint256 amount, bytes32 docHash) returns (uint256)",
  "function getBill(uint256 billId) view returns (tuple(address citizen, uint256 serviceCode, uint256 amount, bytes32 docHash, uint8 status))",
  "function markReimbursed(uint256 billId)",
  "function markRejected(uint256 billId)",
  "function getBillCount() view returns (uint256)",
  "function getBillsByStatus(uint8 status) view returns (uint256[])",
  "function getAllBills() view returns (uint256[])",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "event BillSubmitted(uint256 billId, address indexed citizen, uint256 amount)",
  "event BillStatusChanged(uint256 billId, uint8 newStatus)"
];

// InsuranceRegistry合约ABI
export const INSURANCE_REGISTRY_ABI = [
  "function setPlan(uint256 planId, tuple(uint16 copayBps, uint256 deductible, uint256 coverageLimit) plan)",
  "function registerCitizen(address citizen, uint256 planId)",
  "function addPaid(address citizen, uint256 amount)",
  "function getPlanOf(address citizen) view returns (uint256 planId, tuple(uint16 copayBps, uint256 deductible, uint256 coverageLimit) plan)",
  "function plans(uint256 planId) view returns (tuple(uint16 copayBps, uint256 deductible, uint256 coverageLimit))",
  "function citizenPlan(address citizen) view returns (uint256)",
  "function totalPaid(address citizen) view returns (uint256)",
  "function terminateCitizen(address citizen)",
  "function terminated(address citizen) view returns (bool)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function GOV_ROLE() view returns (bytes32)",
  "event CitizenRegistered(address indexed citizen, uint256 planId)",
  "event PlanUpdated(uint256 planId)",
  "event CitizenTerminated(address indexed citizen)"
];

// ReimbursementContract合约ABI
export const REIMBURSEMENT_ABI = [
  "function processReimbursement(uint256 billId)",
  "function rejectReimbursement(uint256 billId, string memory reason)",
  "function registry() view returns (address)",
  "function billContract() view returns (address)",
  "function token() view returns (address)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  "function grantRole(bytes32 role, address account)",
  "function DEFAULT_ADMIN_ROLE() view returns (bytes32)",
  "event Reimbursed(uint256 billId, address citizen, uint256 payout)",
  "event Rejected(uint256 billId, address citizen, string reason)"
];

// 角色常量 - 从实际部署的合约获取
export const ROLES = {
  DEFAULT_ADMIN_ROLE: "0x0000000000000000000000000000000000000000000000000000000000000000",
  MINTER_ROLE: "0x9f2df0fed2c77648de5860a4cc508cd0818c85b8b8a1ab4ceeef8d981c8956a6",
  HOSPITAL_ROLE: "0xc8f5b4140cca307cd927e59cbeea8291bffeee228fc677f0fa059aef7b4dd8d5",
  REIMBURSE_ROLE: "0x4976c5005be14b7477dabd18bf13bbb073a7cd736caf6a4d86a5362dca756440",
  GOV_ROLE: "0x0603f2636f0ca34ae3ea5a23bb826e2bd2ffd59fb1c01edc1ba10fba2899d1ba"
};

// 账单状态枚举
export const BILL_STATUS = {
  0: "Submitted",
  1: "Reimbursed", 
  2: "Rejected"
};

export const BILL_STATUS_COLORS = {
  0: "warning", // Submitted - 黄色
  1: "success", // Reimbursed - 绿色
  2: "error"    // Rejected - 红色
};