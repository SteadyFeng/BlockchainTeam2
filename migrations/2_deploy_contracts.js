const GovStable = artifacts.require("GovStable");
const InsuranceRegistry = artifacts.require("InsuranceRegistry"); 
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function (deployer, network, accounts) {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 Starting fresh deployment of the healthcare insurance blockchain system");
  console.log("=".repeat(60));
  console.log(`📍 Network: ${network}`);
  console.log(`💰 Deployer: ${accounts[0]}`);
  
  // 显示账户分配
  console.log("\n👥 Account role assignment:");
  console.log(`  [0] Deployer: ${accounts[0]}`);
  console.log(`  [1] Government Admin: ${accounts[1]}`);
  console.log(`  [2] Hospital Admin: ${accounts[2]}`);
  console.log(`  [3] Reimbursement Admin: ${accounts[3]}`);
  console.log(`  [4] Test Citizen 1: ${accounts[4]}`);
  console.log(`  [5] Test Citizen 2: ${accounts[5]}`);

  try {
    // 1. 部署 GovStable 代币
    console.log("\n📄 Deploying GovStable token contract...");
    await deployer.deploy(GovStable);
    const govStable = await GovStable.deployed();
    console.log(`✅ GovStable deployed: ${govStable.address}`);

    // 2. 部署 InsuranceRegistry 保险注册合约
    console.log("\n📄 Deploying InsuranceRegistry contract...");
    await deployer.deploy(InsuranceRegistry);
    const insuranceRegistry = await InsuranceRegistry.deployed();
    console.log(`✅ InsuranceRegistry deployed: ${insuranceRegistry.address}`);

    // 3. 部署 HospitalBillContract 医院账单合约
    console.log("\n📄 Deploying HospitalBillContract contract...");
    await deployer.deploy(HospitalBillContract);
    const hospitalBillContract = await HospitalBillContract.deployed();
    console.log(`✅ HospitalBillContract deployed: ${hospitalBillContract.address}`);

    // 4. 部署 ReimbursementContract 报销合约
    console.log("\n📄 Deploying ReimbursementContract contract...");
    await deployer.deploy(
      ReimbursementContract, 
      insuranceRegistry.address,
      hospitalBillContract.address,
      govStable.address
    );
    const reimbursementContract = await ReimbursementContract.deployed();
    console.log(`✅ ReimbursementContract deployed: ${reimbursementContract.address}`);

    // 5. 配置角色权限
    console.log("\n🔐 Configuring role permissions...");

    // 5.1 给报销合约授予代币铸币权限
    const MINTER_ROLE = await govStable.MINTER_ROLE();
    await govStable.grantRole(MINTER_ROLE, reimbursementContract.address);
    console.log("✅ Reimbursement contract granted minting permission");

    // 5.1.5 给部署者临时铸币权限用于初始化
    await govStable.grantRole(MINTER_ROLE, accounts[0]);
    console.log("✅ Deployer temporarily granted minting permission");

    // 5.2 配置政府管理员权限
    const GOV_ROLE = await insuranceRegistry.GOV_ROLE();
    await insuranceRegistry.grantRole(GOV_ROLE, accounts[1]);
    console.log(`✅ Government admin role granted: ${accounts[1]}`);

    // 5.2.5 给报销合约授予政府权限（用于调用addPaid函数）
    await insuranceRegistry.grantRole(GOV_ROLE, reimbursementContract.address);
    console.log("✅ Reimbursement contract granted government role");

    // 5.3 配置医院管理员权限
    const HOSPITAL_ROLE = await hospitalBillContract.HOSPITAL_ROLE();
    await hospitalBillContract.grantRole(HOSPITAL_ROLE, accounts[2]);
    console.log(`✅ Hospital admin role granted: ${accounts[2]}`);
    
    // 5.4 给报销合约授予账单管理权限
    const REIMBURSE_ROLE = await hospitalBillContract.REIMBURSE_ROLE();
    await hospitalBillContract.grantRole(REIMBURSE_ROLE, reimbursementContract.address);
    console.log("✅ Reimbursement contract granted bill management role");

    // 5.5 配置报销管理员权限
    const DEFAULT_ADMIN_ROLE = await reimbursementContract.DEFAULT_ADMIN_ROLE();
    await reimbursementContract.grantRole(DEFAULT_ADMIN_ROLE, accounts[3]);
    console.log(`✅ Reimbursement admin role granted: ${accounts[3]}`);

    // 6. 初始化代币供应
    console.log("\n💰 Initializing token supply...");
    const initialSupply = web3.utils.toWei("1000000", "ether"); // 100万 GOV
    await govStable.mint(reimbursementContract.address, initialSupply);
    console.log("✅ Minted 1,000,000 GOV tokens to the reimbursement contract");

    // 7. 验证权限设置
    console.log("\n🔍 Verifying role assignments...");
    const govRoleCheck = await insuranceRegistry.hasRole(GOV_ROLE, accounts[1]);
    const hospitalRoleCheck = await hospitalBillContract.hasRole(HOSPITAL_ROLE, accounts[2]);
    const reimbRoleCheck = await reimbursementContract.hasRole(DEFAULT_ADMIN_ROLE, accounts[3]);
    
    console.log(`  Government role (${accounts[1]}): ${govRoleCheck ? '✅' : '❌'}`);
    console.log(`  Hospital role (${accounts[2]}): ${hospitalRoleCheck ? '✅' : '❌'}`);
    console.log(`  Reimbursement admin role (${accounts[3]}): ${reimbRoleCheck ? '✅' : '❌'}`);

    // 8. 显示部署摘要
    console.log("\n" + "🎉".repeat(20));
    console.log("🎉 Deployment complete! All contracts have been deployed and configured!");
    console.log("🎉".repeat(20));
    
    console.log("\n📋 Contract addresses summary:");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│                    Contract Addresses                    │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log(`│ GovStable:            ${govStable.address} │`);
    console.log(`│ InsuranceRegistry:    ${insuranceRegistry.address} │`);
    console.log(`│ HospitalBillContract: ${hospitalBillContract.address} │`);
    console.log(`│ ReimbursementContract:${reimbursementContract.address} │`);
    console.log("└─────────────────────────────────────────────────────────┘");

    console.log("\n📝 Please copy the above addresses into the frontend config!");
    
  } catch (error) {
    console.error("\n❌ Deployment failed:", error.message);
    throw error;
  }
};