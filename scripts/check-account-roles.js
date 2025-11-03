const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("🔍 检查所有账户的角色分配...\n");

    // 获取所有账户
    const accounts = await web3.eth.getAccounts();
    console.log("📋 可用账户:");
    accounts.forEach((account, index) => {
      console.log(`  accounts[${index}]: ${account}`);
    });
    console.log();

    // 获取合约实例
    const insuranceRegistry = await InsuranceRegistry.deployed();
    const hospitalBill = await HospitalBillContract.deployed();
    const reimbursement = await ReimbursementContract.deployed();

    // 获取角色常量
    const GOV_ROLE = await insuranceRegistry.GOV_ROLE();
    const HOSPITAL_ROLE = await hospitalBill.HOSPITAL_ROLE();
    const DEFAULT_ADMIN_ROLE = await reimbursement.DEFAULT_ADMIN_ROLE();

    console.log("🔑 角色常量:");
    console.log(`  GOV_ROLE: ${GOV_ROLE}`);
    console.log(`  HOSPITAL_ROLE: ${HOSPITAL_ROLE}`);
    console.log(`  DEFAULT_ADMIN_ROLE: ${DEFAULT_ADMIN_ROLE}`);
    console.log();

    console.log("👥 账户角色检查:");
    console.log("┌─────────────┬──────────────────────────────────────────────┬─────────────┬─────────────┬─────────────┐");
    console.log("│   账户索引   │                    地址                       │   政府权限   │   医院权限   │   报销权限   │");
    console.log("├─────────────┼──────────────────────────────────────────────┼─────────────┼─────────────┼─────────────┤");
    
    for (let i = 0; i < Math.min(accounts.length, 5); i++) {
      const account = accounts[i];
      
      // 检查各种权限
      const hasGovRole = await insuranceRegistry.hasRole(GOV_ROLE, account);
      const hasHospitalRole = await hospitalBill.hasRole(HOSPITAL_ROLE, account);
      const hasReimbursementRole = await reimbursement.hasRole(DEFAULT_ADMIN_ROLE, account);
      
      const govStatus = hasGovRole ? "✅" : "❌";
      const hospitalStatus = hasHospitalRole ? "✅" : "❌";
      const reimbursementStatus = hasReimbursementRole ? "✅" : "❌";

      console.log(`│ accounts[${i}] │ ${account} │      ${govStatus}      │      ${hospitalStatus}      │      ${reimbursementStatus}      │`);
    }
    
    console.log("└─────────────┴──────────────────────────────────────────────┴─────────────┴─────────────┴─────────────┘");
    console.log();

    // 显示建议
    console.log("💡 使用建议:");
    console.log("  - 要访问政府门户，请使用有政府权限(✅)的账户");
    console.log("  - 要访问医院门户，请使用有医院权限(✅)的账户");
    console.log("  - 要访问报销门户，请使用有报销权限(✅)的账户");
    console.log("  - 在MetaMask中切换到对应的账户地址");

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
    console.error(error);
  }
  
  callback();
};