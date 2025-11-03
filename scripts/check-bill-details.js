const HospitalBillContract = artifacts.require("HospitalBillContract");

module.exports = async function(callback) {
  try {
    console.log("🔍 检查账单详细信息...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const hospitalBill = await HospitalBillContract.deployed();

    // 获取账单 #3 的详细信息
    const billId = 3;
    const bill = await hospitalBill.getBill(billId);
    
    console.log(`📄 账单 #${billId} 详细信息:`);
    console.log(`  公民地址: ${bill.citizen}`);
    console.log(`  公民地址类型: ${typeof bill.citizen}`);
    console.log(`  服务代码: ${bill.serviceCode}`);
    console.log(`  服务代码类型: ${typeof bill.serviceCode}`);
    console.log(`  金额: ${bill.amount}`);
    console.log(`  金额类型: ${typeof bill.amount}`);
    console.log(`  金额 (ETH): ${web3.utils.fromWei(bill.amount, "ether")} ETH`);
    console.log(`  文档哈希: ${bill.documentHash}`);
    console.log(`  文档哈希类型: ${typeof bill.documentHash}`);
    console.log(`  文档哈希长度: ${bill.documentHash ? bill.documentHash.length : 'undefined'}`);
    console.log(`  状态: ${bill.status}`);
    console.log(`  状态类型: ${typeof bill.status}`);
    
    // 让我们尝试创建一个新的账单，使用正确的参数
    console.log("\n🏥 创建新账单（使用正确的参数）...");
    
    // 创建一个有效的文档哈希
    const validDocumentHash = web3.utils.keccak256("Medical Bill Document for Citizen");
    
    console.log(`  使用的文档哈希: ${validDocumentHash}`);
    
    try {
      const tx = await hospitalBill.submitBill(
        bill.citizen,
        bill.serviceCode,
        bill.amount,
        validDocumentHash,
        { from: accounts[2] }
      );
      
      console.log("✅ 新账单提交成功！");
      console.log(`  交易哈希: ${tx.tx}`);
      
      // 获取新账单ID
      const billCount = await hospitalBill.billCount();
      const newBillId = billCount.toNumber();
      
      console.log(`  新账单ID: ${newBillId}`);
      
      // 验证新账单
      const newBill = await hospitalBill.getBill(newBillId);
      console.log(`\n📄 新账单 #${newBillId} 验证:`);
      console.log(`  公民地址: ${newBill.citizen}`);
      console.log(`  服务代码: ${newBill.serviceCode}`);
      console.log(`  金额: ${web3.utils.fromWei(newBill.amount, "ether")} ETH`);
      console.log(`  状态: ${newBill.status} (0=Submitted)`);
      
      // 现在尝试处理报销
      console.log("\n💰 处理新账单的报销...");
      
      const ReimbursementContract = artifacts.require("ReimbursementContract");
      const reimbursement = await ReimbursementContract.deployed();
      
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
          console.log("❌ 账单被拒绝");
        }
        
      } catch (processError) {
        console.log(`❌ 报销处理失败: ${processError.message}`);
      }
      
    } catch (submitError) {
      console.log(`❌ 账单提交失败: ${submitError.message}`);
    }

  } catch (error) {
    console.error("❌ 检查失败:", error.message);
    console.error(error);
  }
  
  callback();
};