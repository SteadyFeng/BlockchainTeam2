const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");

module.exports = async function(callback) {
  try {
    console.log("🔧 修复公民保险注册...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const insuranceRegistry = await InsuranceRegistry.deployed();
    const hospitalBill = await HospitalBillContract.deployed();

    // 检查账单 #3 的公民
    const billId = 3;
    const bill = await hospitalBill.getBill(billId);
    const citizenAddress = bill.citizen;
    
    console.log(`📄 账单 #${billId} 的公民地址: ${citizenAddress}`);
    
    // 设置一个有效的保险计划
    console.log("\n🏥 设置有效的保险计划...");
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
      console.log("ℹ️ 保险计划可能已存在，继续...");
    }
    
    // 重新注册公民到有效计划
    console.log("\n👤 重新注册公民到有效计划...");
    try {
      await insuranceRegistry.registerCitizen(citizenAddress, planId, { from: accounts[1] });
      console.log("✅ 公民重新注册成功");
    } catch (regError) {
      console.log(`ℹ️ 注册可能已存在: ${regError.message}`);
    }
    
    // 验证注册
    console.log("\n🔍 验证注册结果...");
    const result = await insuranceRegistry.getPlanOf(citizenAddress);
    console.log(`  计划ID: ${result[0]}`);
    console.log(`  自付额: ${web3.utils.fromWei(result[1].deductible, "ether")} ETH`);
    console.log(`  共付比例: ${result[1].copayBps / 100}%`);
    console.log(`  覆盖限额: ${web3.utils.fromWei(result[1].coverageLimit, "ether")} ETH`);
    
    if (result[1].coverageLimit > 0) {
      console.log("✅ 公民现在有有效的保险覆盖！");
      
      // 现在尝试重新处理报销
      console.log("\n💰 尝试重新处理报销...");
      
      // 首先检查账单状态
      const currentBill = await hospitalBill.getBill(billId);
      console.log(`  当前账单状态: ${currentBill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
      
      if (currentBill.status === 2) {
        console.log("  账单当前状态为 Rejected，需要重新提交或重置状态");
        console.log("  建议：让医院重新提交这个账单，或者联系管理员重置账单状态");
      } else if (currentBill.status === 0) {
        console.log("  账单状态为 Submitted，可以尝试处理报销");
        
        // 使用报销管理员账户 (accounts[3]) 处理报销
        const ReimbursementContract = artifacts.require("ReimbursementContract");
        const reimbursement = await ReimbursementContract.deployed();
        
        try {
          const tx = await reimbursement.processReimbursement(billId, { from: accounts[3] });
          console.log("✅ 报销处理成功！");
          console.log(`  交易哈希: ${tx.tx}`);
          
          // 检查最终状态
          const finalBill = await hospitalBill.getBill(billId);
          console.log(`  最终账单状态: ${finalBill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
          
        } catch (processError) {
          console.log(`❌ 报销处理失败: ${processError.message}`);
        }
      }
      
    } else {
      console.log("❌ 保险计划仍然无效");
    }

  } catch (error) {
    console.error("❌ 修复失败:", error.message);
    console.error(error);
  }
  
  callback();
};