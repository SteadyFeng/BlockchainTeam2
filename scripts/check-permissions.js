const { Web3 } = require('web3');
const fs = require('fs');
const path = require('path');

// 读取合约ABI
const hospitalBillABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/HospitalBillContract.json'), 'utf8')).abi;
const reimbursementABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../build/contracts/ReimbursementContract.json'), 'utf8')).abi;

async function main() {
  console.log("Checking contract permissions...");

  // 连接到本地网络
  const web3 = new Web3('http://localhost:8545');
  
  // 获取账户
  const accounts = await web3.eth.getAccounts();
  const deployer = accounts[0];
  console.log("Current account:", deployer);

  // 合约地址
  const CONTRACT_ADDRESSES = {
    HOSPITAL_BILL: "0xC89Ce4735882C9F0f0FE26686c53074E09B0D550",
    REIMBURSEMENT: "0xD833215cBcc3f914bD1C9ece3EE7BF8B14f841bb"
  };

  // 获取合约实例
  const hospitalBill = new web3.eth.Contract(hospitalBillABI, CONTRACT_ADDRESSES.HOSPITAL_BILL);
  const reimbursement = new web3.eth.Contract(reimbursementABI, CONTRACT_ADDRESSES.REIMBURSEMENT);

  try {
    // 获取REIMBURSE_ROLE
    const REIMBURSE_ROLE = await hospitalBill.methods.REIMBURSE_ROLE().call();
    console.log("REIMBURSE_ROLE:", REIMBURSE_ROLE);

    // 检查ReimbursementContract是否拥有REIMBURSE_ROLE权限
    const hasReimburseRole = await hospitalBill.methods.hasRole(REIMBURSE_ROLE, CONTRACT_ADDRESSES.REIMBURSEMENT).call();
    console.log("ReimbursementContract has REIMBURSE_ROLE:", hasReimburseRole);

    if (!hasReimburseRole) {
      console.log("❌ ReimbursementContract does NOT have REIMBURSE_ROLE permission!");
      console.log("This will cause status update failures when processing reimbursements.");
      
      // 检查当前账户是否有管理员权限
      const DEFAULT_ADMIN_ROLE = await hospitalBill.methods.DEFAULT_ADMIN_ROLE().call();
      const hasAdminRole = await hospitalBill.methods.hasRole(DEFAULT_ADMIN_ROLE, deployer).call();
      console.log("Current account has admin role:", hasAdminRole);
      
      if (hasAdminRole) {
        console.log("🔧 Attempting to grant REIMBURSE_ROLE to ReimbursementContract...");
        try {
          const tx = await hospitalBill.methods.grantRole(REIMBURSE_ROLE, CONTRACT_ADDRESSES.REIMBURSEMENT).send({
            from: deployer,
            gas: 200000
          });
          console.log("✅ Successfully granted REIMBURSE_ROLE to ReimbursementContract!");
          console.log("Transaction hash:", tx.transactionHash);
        } catch (error) {
          console.error("❌ Failed to grant role:", error.message);
        }
      } else {
        console.log("❌ Current account does not have admin privileges to grant roles.");
      }
    } else {
      console.log("✅ ReimbursementContract already has REIMBURSE_ROLE permission!");
    }

    // 验证权限是否生效
    const finalCheck = await hospitalBill.methods.hasRole(REIMBURSE_ROLE, CONTRACT_ADDRESSES.REIMBURSEMENT).call();
    console.log("Final verification - ReimbursementContract has REIMBURSE_ROLE:", finalCheck);
    
  } catch (error) {
    console.error("Error:", error.message);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });