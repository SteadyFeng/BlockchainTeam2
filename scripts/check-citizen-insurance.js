const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");

module.exports = async function(callback) {
  try {
    console.log("🔍 检查公民保险注册状态...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const insuranceRegistry = await InsuranceRegistry.deployed();
    const hospitalBill = await HospitalBillContract.deployed();

    // 检查账单 #3 的公民
    const billId = 3;
    const bill = await hospitalBill.getBill(billId);
    const citizenAddress = bill.citizen;
    
    console.log(`📄 账单 #${billId} 的公民地址: ${citizenAddress}`);
    
    // 尝试获取公民的保险计划
    try {
      const result = await insuranceRegistry.getPlanOf(citizenAddress);
      console.log("✅ 公民已注册保险");
      console.log(`  计划ID: ${result[0]}`);
      console.log(`  计划详情:`, result[1]);
    } catch (error) {
      console.log("❌ 公民未注册保险");
      console.log(`  错误: ${error.message}`);
      
      // 让我们为这个公民注册保险
      console.log("\n🏥 为公民注册保险...");
      
      // 首先设置一个保险计划（如果还没有的话）
      const planId = 1;
      const plan = {
        copayBps: 1000, // 10%
        deductible: web3.utils.toWei("0.1", "ether"), // 0.1 ETH
        coverageLimit: web3.utils.toWei("10", "ether") // 10 ETH
      };
      
      try {
        // 使用政府账户 (accounts[1]) 设置计划
        await insuranceRegistry.setPlan(planId, plan, { from: accounts[1] });
        console.log("✅ 保险计划设置完成");
      } catch (planError) {
        console.log("ℹ️ 保险计划可能已存在");
      }
      
      // 注册公民
      try {
        await insuranceRegistry.registerCitizen(citizenAddress, planId, { from: accounts[1] });
        console.log("✅ 公民注册成功");
        
        // 验证注册
        const newResult = await insuranceRegistry.getPlanOf(citizenAddress);
        console.log(`  新计划ID: ${newResult[0]}`);
        console.log(`  自付额: ${web3.utils.fromWei(newResult[1].deductible, "ether")} ETH`);
        console.log(`  共付比例: ${newResult[1].copayBps / 100}%`);
        console.log(`  覆盖限额: ${web3.utils.fromWei(newResult[1].coverageLimit, "ether")} ETH`);
        
      } catch (regError) {
        console.log(`❌ 注册失败: ${regError.message}`);
      }
    }

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
    console.error(error);
  }
  
  callback();
};