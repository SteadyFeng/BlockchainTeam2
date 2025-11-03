const Web3 = require('web3');
const GovStable = artifacts.require("GovStable");
const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("🧪 测试报销功能...\n");

    const accounts = await web3.eth.getAccounts();
    console.log("📋 可用账户:");
    accounts.slice(0, 4).forEach((account, index) => {
      console.log(`  accounts[${index}]: ${account}`);
    });

    // 获取合约实例
    const govStable = await GovStable.deployed();
    const insuranceRegistry = await InsuranceRegistry.deployed();
    const hospitalBillContract = await HospitalBillContract.deployed();
    const reimbursementContract = await ReimbursementContract.deployed();

    console.log("\n📄 合约地址:");
    console.log(`  GovStable: ${govStable.address}`);
    console.log(`  InsuranceRegistry: ${insuranceRegistry.address}`);
    console.log(`  HospitalBillContract: ${hospitalBillContract.address}`);
    console.log(`  ReimbursementContract: ${reimbursementContract.address}`);

    // 1. 设置保险计划 (使用政府账户 accounts[1])
    console.log("\n🏥 设置保险计划...");
    const planId = 1;
    const plan = {
      copayBps: 1000, // 10%
      deductible: web3.utils.toWei("0.1", "ether"), // 0.1 ETH
      coverageLimit: web3.utils.toWei("10", "ether") // 10 ETH
    };

    await insuranceRegistry.setPlan(planId, plan, { from: accounts[1] });
    console.log("✅ 保险计划设置完成");

    // 2. 注册公民 (使用政府账户 accounts[1])
    console.log("\n👤 注册公民...");
    const citizen = accounts[0]; // 使用accounts[0]作为公民
    await insuranceRegistry.registerCitizen(citizen, planId, { from: accounts[1] });
    console.log(`✅ 公民 ${citizen} 已注册到计划 ${planId}`);

    // 3. 提交账单 (使用医院账户 accounts[2])
    console.log("\n📋 提交医疗账单...");
    const serviceCode = 1009;
    const billAmount = web3.utils.toWei("2", "ether"); // 2 ETH
    const docHash = web3.utils.keccak256("medical_document_hash");

    const billTx = await hospitalBillContract.submitBill(citizen, serviceCode, billAmount, docHash, { from: accounts[2] });
    const billId = billTx.logs[0].args.billId.toNumber();
    console.log(`✅ 账单提交成功，Bill ID: ${billId}`);

    // 4. 检查账单状态 (提交后)
    console.log("\n🔍 检查账单状态 (提交后)...");
    let bill = await hospitalBillContract.getBill(billId);
    console.log(`  账单状态: ${bill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
    console.log(`  账单金额: ${web3.utils.fromWei(bill.amount, "ether")} ETH`);
    console.log(`  公民地址: ${bill.citizen}`);

    // 5. 处理报销 (使用报销管理员账户 accounts[3])
    console.log("\n💰 处理报销...");
    const reimburseTx = await reimbursementContract.processReimbursement(billId, { from: accounts[3] });
    console.log("✅ 报销处理交易已发送");
    console.log(`  交易哈希: ${reimburseTx.tx}`);

    // 检查交易事件
    if (reimburseTx.logs && reimburseTx.logs.length > 0) {
      console.log("\n📊 交易事件:");
      reimburseTx.logs.forEach((log, index) => {
        console.log(`  事件 ${index + 1}: ${log.event}`);
        if (log.event === 'Reimbursed') {
          console.log(`    Bill ID: ${log.args.billId}`);
          console.log(`    公民: ${log.args.citizen}`);
          console.log(`    支付金额: ${web3.utils.fromWei(log.args.payout, "ether")} ETH`);
        } else if (log.event === 'Rejected') {
          console.log(`    Bill ID: ${log.args.billId}`);
          console.log(`    公民: ${log.args.citizen}`);
          console.log(`    拒绝原因: ${log.args.reason}`);
        }
      });
    }

    // 6. 检查账单状态 (处理后)
    console.log("\n🔍 检查账单状态 (处理后)...");
    bill = await hospitalBillContract.getBill(billId);
    console.log(`  账单状态: ${bill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);
    
    if (bill.status == 1) {
      console.log("✅ 账单状态已正确更新为 Reimbursed");
    } else {
      console.log("❌ 账单状态未正确更新，仍为:", bill.status);
    }

    // 7. 检查公民代币余额
    console.log("\n💰 检查公民代币余额...");
    const balance = await govStable.balanceOf(citizen);
    console.log(`  公民 GOV 代币余额: ${web3.utils.fromWei(balance, "ether")} GOV`);

    // 8. 检查已支付总额
    console.log("\n📊 检查已支付总额...");
    const totalPaid = await insuranceRegistry.totalPaid(citizen);
    console.log(`  已支付总额: ${web3.utils.fromWei(totalPaid, "ether")} ETH`);

    console.log("\n🎉 测试完成！");

  } catch (error) {
    console.error("\n❌ 测试失败:", error.message);
    console.error(error);
  }
  
  callback();
};