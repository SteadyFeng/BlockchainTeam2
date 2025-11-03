const Web3 = require('web3');
const GovStable = artifacts.require("GovStable");
const InsuranceRegistry = artifacts.require("InsuranceRegistry");
const HospitalBillContract = artifacts.require("HospitalBillContract");
const ReimbursementContract = artifacts.require("ReimbursementContract");

module.exports = async function(callback) {
  try {
    console.log("🧪 测试重复处理防护...");
    
    const accounts = await web3.eth.getAccounts();
    console.log("\n📋 可用账户:");
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
    const plan = {
      copayBps: 1500,      // 15% copay
      deductible: web3.utils.toWei("0.15", "ether"), // 0.15 ETH deductible
      coverageLimit: web3.utils.toWei("10", "ether")  // 10 ETH coverage limit
    };
    
    await insuranceRegistry.setPlan(1, plan, { from: accounts[1] });
    console.log("✅ 保险计划设置完成");

    // 2. 注册公民 (使用政府账户 accounts[1])
    console.log("\n👤 注册公民...");
    await insuranceRegistry.registerCitizen(accounts[0], 1, { from: accounts[1] });
    console.log(`✅ 公民 ${accounts[0]} 已注册到计划 1`);

    // 3. 提交医疗账单 (使用医院账户 accounts[2])
    console.log("\n📋 提交医疗账单...");
    const billAmount = web3.utils.toWei("2", "ether");
    const serviceCode = 1001; // 服务代码
    const docHash = web3.utils.keccak256("测试重复处理防护"); // 文档哈希
    const submitTx = await hospitalBillContract.submitBill(
      accounts[0], 
      serviceCode,
      billAmount, 
      docHash,
      { from: accounts[2] }
    );
    
    const billId = submitTx.logs[0].args.billId.toNumber();
    console.log(`✅ 账单提交成功，Bill ID: ${billId}`);

    // 4. 第一次处理报销 (使用报销管理员账户 accounts[3])
    console.log("\n💰 第一次处理报销...");
    const processTx1 = await reimbursementContract.processReimbursement(billId, { from: accounts[3] });
    console.log("✅ 第一次报销处理成功");
    console.log(`  交易哈希: ${processTx1.tx}`);

    // 检查账单状态
    const billAfterFirst = await hospitalBillContract.getBill(billId);
    console.log(`  账单状态: ${billAfterFirst.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);

    // 5. 尝试第二次处理同一账单 (应该失败)
    console.log("\n⚠️ 尝试第二次处理同一账单...");
    const processTx2 = await reimbursementContract.processReimbursement(billId, { from: accounts[3] });
    
    // 检查第二次处理的事件
    const events2 = processTx2.logs;
    console.log(`📊 第二次处理的事件数量: ${events2.length}`);
    
    let hasRejectedEvent = false;
    events2.forEach((event, index) => {
      console.log(`  事件 ${index + 1}: ${event.event}`);
      if (event.event === 'Rejected') {
        hasRejectedEvent = true;
        console.log(`    Bill ID: ${event.args.billId}`);
        console.log(`    公民: ${event.args.citizen}`);
        console.log(`    原因: ${event.args.reason}`);
      }
    });
    
    if (hasRejectedEvent) {
      console.log("✅ 测试成功: 重复处理被正确阻止并发出Rejected事件");
    } else {
      console.log("❌ 测试失败: 重复处理没有被正确阻止");
    }

    // 6. 再次检查账单状态确保没有变化
    console.log("\n🔍 最终检查账单状态...");
    const billFinal = await hospitalBillContract.getBill(billId);
    console.log(`  最终账单状态: ${billFinal.status} (应该仍为 1=Reimbursed)`);

    if (billFinal.status == 1) {
      console.log("✅ 账单状态保持正确，没有被重复处理影响");
    } else {
      console.log("❌ 账单状态异常！");
    }

    console.log("\n🎉 重复处理防护测试完成！");
    callback();
  } catch (error) {
    console.error("❌ 测试失败:", error);
    callback(error);
  }
};