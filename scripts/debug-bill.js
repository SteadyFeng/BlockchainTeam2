const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("🔍 调试账单信息...\n");

    const accounts = await web3.eth.getAccounts();
    
    // 获取合约实例
    const insuranceRegistry = await InsuranceRegistry.deployed();
    const hospitalBill = await HospitalBillContract.deployed();
    const reimbursement = await ReimbursementContract.deployed();

    // 获取最新的账单ID
    console.log("📋 获取最新账单信息...");
    
    // 假设我们要检查账单ID 3（从您的截图看到的）
    const billId = 3;
    
    try {
      const bill = await hospitalBill.getBill(billId);
      console.log(`\n📄 账单 #${billId} 详情:`);
      console.log(`  公民地址: ${bill.citizen}`);
      console.log(`  服务代码: ${bill.serviceCode}`);
      console.log(`  金额: ${web3.utils.fromWei(bill.amount, "ether")} ETH`);
      console.log(`  状态: ${bill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
      console.log(`  文档哈希: ${bill.docHash}`);

      // 检查公民的保险信息
      console.log(`\n🏥 检查公民保险信息...`);
      try {
        const [planId, plan] = await insuranceRegistry.getPlanOf(bill.citizen);
        console.log(`  计划ID: ${planId}`);
        console.log(`  自付额: ${web3.utils.fromWei(plan.deductible, "ether")} ETH`);
        console.log(`  共付比例: ${plan.copayBps / 100}%`);
        console.log(`  覆盖限额: ${web3.utils.fromWei(plan.coverageLimit, "ether")} ETH`);
        
        // 检查已支付金额
        const totalPaid = await insuranceRegistry.totalPaid(bill.citizen);
        console.log(`  已支付总额: ${web3.utils.fromWei(totalPaid, "ether")} ETH`);
        
        // 计算预期支付金额
        const deductible = parseFloat(web3.utils.fromWei(plan.deductible, "ether"));
        const billAmount = parseFloat(web3.utils.fromWei(bill.amount, "ether"));
        const copayPct = plan.copayBps / 10000; // 转换为小数
        const coverageLimit = parseFloat(web3.utils.fromWei(plan.coverageLimit, "ether"));
        const alreadyPaid = parseFloat(web3.utils.fromWei(totalPaid, "ether"));
        
        console.log(`\n💰 报销计算:`);
        console.log(`  账单金额: ${billAmount} ETH`);
        console.log(`  自付额: ${deductible} ETH`);
        
        let eligible = 0;
        if (billAmount > deductible) {
          eligible = billAmount - deductible;
        }
        console.log(`  符合条件金额: ${eligible} ETH`);
        
        let payout = eligible * (1 - copayPct);
        console.log(`  计算支付金额 (扣除共付): ${payout} ETH`);
        
        if (payout + alreadyPaid > coverageLimit) {
          payout = coverageLimit - alreadyPaid;
          console.log(`  调整后支付金额 (限额): ${payout} ETH`);
        }
        
        console.log(`  最终支付金额: ${payout} ETH`);
        
        // 分析拒绝原因
        console.log(`\n🔍 拒绝原因分析:`);
        if (bill.status !== 0) {
          console.log(`  ❌ 账单状态不是 Submitted (当前: ${bill.status})`);
        } else if (plan.coverageLimit == 0) {
          console.log(`  ❌ 公民未注册保险`);
        } else if (alreadyPaid >= coverageLimit) {
          console.log(`  ❌ 保险额度已用完`);
        } else if (payout <= 0) {
          console.log(`  ❌ 支付金额为0或负数`);
        } else {
          console.log(`  ✅ 应该可以正常报销`);
        }
        
      } catch (planError) {
        console.log(`  ❌ 公民未注册保险: ${planError.message}`);
      }
      
    } catch (billError) {
      console.log(`❌ 无法获取账单信息: ${billError.message}`);
    }

  } catch (error) {
    console.error("❌ 调试失败:", error.message);
    console.error(error);
  }
  
  callback();
};