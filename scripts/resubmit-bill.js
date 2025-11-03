const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("🏥 重新提交账单...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const hospitalBill = await HospitalBillContract.deployed();
    const reimbursement = await ReimbursementContract.deployed();

    // 获取原始账单信息
    const originalBillId = 3;
    const originalBill = await hospitalBill.getBill(originalBillId);
    
    console.log(`📄 原始账单 #${originalBillId} 信息:`);
    console.log(`  公民地址: ${originalBill.citizen}`);
    console.log(`  服务代码: ${originalBill.serviceCode}`);
    console.log(`  金额: ${web3.utils.fromWei(originalBill.amount, "ether")} ETH`);
    console.log(`  状态: ${originalBill.status} (2=Rejected)`);
    
    // 使用医院账户 (accounts[2]) 重新提交相同的账单
    console.log("\n🏥 重新提交账单...");
    
    const tx = await hospitalBill.submitBill(
      originalBill.citizen,
      originalBill.serviceCode,
      originalBill.amount,
      originalBill.documentHash,
      { from: accounts[2] }
    );
    
    console.log("✅ 账单重新提交成功！");
    console.log(`  交易哈希: ${tx.tx}`);
    
    // 获取新账单ID（应该是下一个ID）
    const billCount = await hospitalBill.billCount();
    const newBillId = billCount.toNumber();
    
    console.log(`  新账单ID: ${newBillId}`);
    
    // 验证新账单
    const newBill = await hospitalBill.getBill(newBillId);
    console.log(`\n📄 新账单 #${newBillId} 详情:`);
    console.log(`  公民地址: ${newBill.citizen}`);
    console.log(`  服务代码: ${newBill.serviceCode}`);
    console.log(`  金额: ${web3.utils.fromWei(newBill.amount, "ether")} ETH`);
    console.log(`  状态: ${newBill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
    
    // 现在尝试处理报销
    console.log("\n💰 处理新账单的报销...");
    
    try {
      const reimburseTx = await reimbursement.processReimbursement(newBillId, { from: accounts[3] });
      console.log("✅ 报销处理成功！");
      console.log(`  交易哈希: ${reimburseTx.tx}`);
      
      // 检查最终状态
      const finalBill = await hospitalBill.getBill(newBillId);
      console.log(`\n🎉 最终结果:`);
      console.log(`  账单状态: ${finalBill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
      
      if (finalBill.status === 1) {
        console.log("✅ 账单已成功报销！");
        
        // 获取报销详情
        const reimbursementDetails = await reimbursement.getReimbursement(newBillId);
        console.log(`  报销金额: ${web3.utils.fromWei(reimbursementDetails.amount, "ether")} ETH`);
        console.log(`  处理时间: ${new Date(reimbursementDetails.processedAt * 1000).toLocaleString()}`);
        
      } else if (finalBill.status === 2) {
        console.log("❌ 账单仍被拒绝");
      }
      
    } catch (processError) {
      console.log(`❌ 报销处理失败: ${processError.message}`);
      
      // 让我们检查具体的拒绝原因
      console.log("\n🔍 分析拒绝原因...");
      
      // 运行我们之前的调试脚本来分析
      console.log("请运行以下命令来分析具体原因:");
      console.log(`npx truffle exec scripts/debug-bill.js --network development`);
    }

  } catch (error) {
    console.error("❌ 重新提交失败:", error.message);
    console.error(error);
  }
  
  callback();
};