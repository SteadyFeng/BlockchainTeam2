const GovStable = artifacts.require("GovStable");
const InsuranceRegistry = artifacts.require("InsuranceRegistry"); 
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function (deployer, network, accounts) {
  console.log("\n" + "=".repeat(60));
  console.log("🚀 开始全新部署医疗保险区块链系统");
  console.log("=".repeat(60));
  console.log(`📍 网络: ${network}`);
  console.log(`💰 部署者: ${accounts[0]}`);
  
  // 显示账户分配
  console.log("\n👥 账户角色分配:");
  console.log(`  [0] 部署者: ${accounts[0]}`);
  console.log(`  [1] 政府管理员: ${accounts[1]}`);
  console.log(`  [2] 医院管理员: ${accounts[2]}`);
  console.log(`  [3] 报销管理员: ${accounts[3]}`);
  console.log(`  [4] 测试市民1: ${accounts[4]}`);
  console.log(`  [5] 测试市民2: ${accounts[5]}`);

  try {
    // 1. 部署 GovStable 代币
    console.log("\n📄 部署 GovStable 代币合约...");
    await deployer.deploy(GovStable);
    const govStable = await GovStable.deployed();
    console.log(`✅ GovStable 部署成功: ${govStable.address}`);

    // 2. 部署 InsuranceRegistry 保险注册合约
    console.log("\n📄 部署 InsuranceRegistry 合约...");
    await deployer.deploy(InsuranceRegistry);
    const insuranceRegistry = await InsuranceRegistry.deployed();
    console.log(`✅ InsuranceRegistry 部署成功: ${insuranceRegistry.address}`);

    // 3. 部署 HospitalBillContract 医院账单合约
    console.log("\n📄 部署 HospitalBillContract 合约...");
    await deployer.deploy(HospitalBillContract);
    const hospitalBillContract = await HospitalBillContract.deployed();
    console.log(`✅ HospitalBillContract 部署成功: ${hospitalBillContract.address}`);

    // 4. 部署 ReimbursementContract 报销合约
    console.log("\n📄 部署 ReimbursementContract 合约...");
    await deployer.deploy(
      ReimbursementContract, 
      insuranceRegistry.address,
      hospitalBillContract.address,
      govStable.address
    );
    const reimbursementContract = await ReimbursementContract.deployed();
    console.log(`✅ ReimbursementContract 部署成功: ${reimbursementContract.address}`);

    // 5. 配置角色权限
    console.log("\n🔐 配置角色权限...");

    // 5.1 给报销合约授予代币铸币权限
    const MINTER_ROLE = await govStable.MINTER_ROLE();
    await govStable.grantRole(MINTER_ROLE, reimbursementContract.address);
    console.log("✅ 报销合约已获得铸币权限");

    // 5.1.5 给部署者临时铸币权限用于初始化
    await govStable.grantRole(MINTER_ROLE, accounts[0]);
    console.log("✅ 部署者已获得临时铸币权限");

    // 5.2 配置政府管理员权限
    const GOV_ROLE = await insuranceRegistry.GOV_ROLE();
    await insuranceRegistry.grantRole(GOV_ROLE, accounts[1]);
    console.log(`✅ 政府管理员权限已授予: ${accounts[1]}`);

    // 5.3 配置医院管理员权限
    const HOSPITAL_ROLE = await hospitalBillContract.HOSPITAL_ROLE();
    await hospitalBillContract.grantRole(HOSPITAL_ROLE, accounts[2]);
    console.log(`✅ 医院管理员权限已授予: ${accounts[2]}`);
    
    // 5.4 给报销合约授予账单管理权限
    const REIMBURSE_ROLE = await hospitalBillContract.REIMBURSE_ROLE();
    await hospitalBillContract.grantRole(REIMBURSE_ROLE, reimbursementContract.address);
    console.log("✅ 报销合约已获得账单管理权限");

    // 5.5 配置报销管理员权限
    const DEFAULT_ADMIN_ROLE = await reimbursementContract.DEFAULT_ADMIN_ROLE();
    await reimbursementContract.grantRole(DEFAULT_ADMIN_ROLE, accounts[3]);
    console.log(`✅ 报销管理员权限已授予: ${accounts[3]}`);

    // 6. 初始化代币供应
    console.log("\n💰 初始化代币供应...");
    const initialSupply = web3.utils.toWei("1000000", "ether"); // 100万 GOV
    await govStable.mint(reimbursementContract.address, initialSupply);
    console.log("✅ 已向报销合约铸造 1,000,000 GOV 代币");

    // 7. 验证权限设置
    console.log("\n🔍 验证权限设置...");
    const govRoleCheck = await insuranceRegistry.hasRole(GOV_ROLE, accounts[1]);
    const hospitalRoleCheck = await hospitalBillContract.hasRole(HOSPITAL_ROLE, accounts[2]);
    const reimbRoleCheck = await reimbursementContract.hasRole(DEFAULT_ADMIN_ROLE, accounts[3]);
    
    console.log(`  政府权限 (${accounts[1]}): ${govRoleCheck ? '✅' : '❌'}`);
    console.log(`  医院权限 (${accounts[2]}): ${hospitalRoleCheck ? '✅' : '❌'}`);
    console.log(`  报销权限 (${accounts[3]}): ${reimbRoleCheck ? '✅' : '❌'}`);

    // 8. 显示部署摘要
    console.log("\n" + "🎉".repeat(20));
    console.log("🎉 部署完成！所有合约已成功部署并配置！");
    console.log("🎉".repeat(20));
    
    console.log("\n📋 合约地址汇总:");
    console.log("┌─────────────────────────────────────────────────────────┐");
    console.log("│                    合约地址                              │");
    console.log("├─────────────────────────────────────────────────────────┤");
    console.log(`│ GovStable:            ${govStable.address} │`);
    console.log(`│ InsuranceRegistry:    ${insuranceRegistry.address} │`);
    console.log(`│ HospitalBillContract: ${hospitalBillContract.address} │`);
    console.log(`│ ReimbursementContract:${reimbursementContract.address} │`);
    console.log("└─────────────────────────────────────────────────────────┘");

    console.log("\n📝 请复制以上地址到前端配置文件!");
    
  } catch (error) {
    console.error("\n❌ 部署失败:", error.message);
    throw error;
  }
};