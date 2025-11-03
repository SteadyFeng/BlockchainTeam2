const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("💰 处理新账单的报销...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const hospitalBill = await HospitalBillContract.deployed();
    const reimbursement = await ReimbursementContract.deployed();

    // 获取最新的账单ID（应该是刚刚创建的）
    // 我们需要手动检查最近的账单
    console.log("🔍 查找最新的账单...");
    
    let latestBillId = 0;
    let foundBill = false;
    
    // 从账单ID 4 开始检查（因为我们知道3是被拒绝的）
    for (let i = 4; i <= 10; i++) {
      try {
        const bill = await hospitalBill.getBill(i);
        if (bill.citizen === "0xccdb411260c705088EBAA0289FD8a3C8084bb356" && bill.status == 0) {
          latestBillId = i;
          foundBill = true;
          console.log(`✅ 找到新账单 #${i}`);
          break;
        }
      } catch (error) {
        // 账单不存在，继续查找
        break;
      }
    }
    
    if (!foundBill) {
      console.log("❌ 未找到新的待处理账单");
      callback();
      return;
    }
    
    // 验证账单信息
    const bill = await hospitalBill.getBill(latestBillId);
    console.log(`\n📄 账单 #${latestBillId} 详情:`);
    console.log(`  公民地址: ${bill.citizen}`);
    console.log(`  服务代码: ${bill.serviceCode}`);
    console.log(`  金额: ${web3.utils.fromWei(bill.amount, "ether")} ETH`);
    console.log(`  状态: ${bill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
    
    // 处理报销
    console.log("\n💰 处理报销...");
    
    try {
      const reimburseTx = await reimbursement.processReimbursement(latestBillId, { from: accounts[3] });
      console.log("✅ 报销处理成功！");
      console.log(`  交易哈希: ${reimburseTx.tx}`);
      
      // 检查最终状态
      const finalBill = await hospitalBill.getBill(latestBillId);
      console.log(`\n🎉 最终结果:`);
      console.log(`  账单状态: ${finalBill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
      
      if (finalBill.status === 1) {
        console.log("✅ 账单已成功报销！");
        
        // 获取报销详情
        try {
          const reimbursementDetails = await reimbursement.getReimbursement(latestBillId);
          console.log(`  报销金额: ${web3.utils.fromWei(reimbursementDetails.amount, "ether")} ETH`);
          console.log(`  处理时间: ${new Date(reimbursementDetails.processedAt * 1000).toLocaleString()}`);
        } catch (detailError) {
          console.log("  报销详情获取失败，但账单状态显示已报销");
        }
        
        console.log("\n🎯 问题解决方案总结:");
        console.log("1. 原始问题：账单 #3 被拒绝是因为公民没有有效的保险覆盖");
        console.log("2. 解决步骤：");
        console.log("   - 为公民注册了有效的保险计划（计划ID 1）");
        console.log("   - 重新提交了账单（因为原账单的documentHash字段有问题）");
        console.log("   - 成功处理了新账单的报销");
        console.log("3. 现在该公民可以正常获得医疗保险报销");
        
      } else if (finalBill.status === 2) {
        console.log("❌ 账单仍被拒绝，需要进一步调查");
      }
      
    } catch (processError) {
      console.log(`❌ 报销处理失败: ${processError.message}`);
      console.log("可能的原因：");
      console.log("- 权限问题：确保使用正确的报销管理员账户");
      console.log("- 合约逻辑问题：检查报销合约的处理逻辑");
    }

  } catch (error) {
    console.error("❌ 处理失败:", error.message);
    console.error(error);
  }
  
  callback();
};