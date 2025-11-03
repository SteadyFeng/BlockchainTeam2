const { ethers } = require('ethers');

// 合约地址 - 从最新部署获取
const CONTRACT_ADDRESSES = {
  GOVSTABLE: "0x382f4a294cDab556DdEFC45324898AC3f791Ea35",
  INSURANCE_REGISTRY: "0xe45BC826Ee6cFa2Ba7cF6241F13DFA5fd5F8aB52",
  HOSPITAL_BILL: "0x729F4455c84127C52a0d57fb56c69E0732fF6673",
  REIMBURSEMENT: "0xa23eBBc729b784215000cCf91CF079b897b32a07",
};

// 简化的ABI
const HOSPITAL_BILL_ABI = [
  "function getBill(uint256 billId) view returns (tuple(address citizen, uint256 serviceCode, uint256 amount, bytes32 docHash, uint8 status))",
  "function getBillCount() view returns (uint256)",
  "event BillStatusChanged(uint256 billId, uint8 newStatus)"
];

const REIMBURSEMENT_ABI = [
  "function processReimbursement(uint256 billId)",
  "event Reimbursed(uint256 billId, address citizen, uint256 payout)",
  "event Rejected(uint256 billId, address citizen, string reason)"
];

async function testFrontendConnection() {
  console.log('🔍 Testing frontend contract connection...\n');

  // 连接到Ganache
  const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
  
  // 使用第一个账户作为测试账户
  const accounts = await provider.listAccounts();
  const signer = await provider.getSigner(accounts[0].address);
  
  console.log(`📋 Using account: ${accounts[0].address}`);
  console.log(`💰 Account balance: ${ethers.formatEther(await provider.getBalance(accounts[0].address))} ETH\n`);

  // 获取合约实例
  const hospitalBillContract = new ethers.Contract(CONTRACT_ADDRESSES.HOSPITAL_BILL, HOSPITAL_BILL_ABI, provider);
  const reimbursementContract = new ethers.Contract(CONTRACT_ADDRESSES.REIMBURSEMENT, REIMBURSEMENT_ABI, signer);

  try {
    // 1. 检查账单数量
    const billCount = await hospitalBillContract.getBillCount();
    console.log(`📊 Total bills in system: ${billCount}`);

    if (billCount > 0) {
      // 2. 检查最后一个账单的状态
      const lastBillId = billCount - 1n;
      console.log(`\n🔍 Checking bill ID: ${lastBillId}`);
      
      const bill = await hospitalBillContract.getBill(lastBillId);
      console.log(`👤 Citizen: ${bill.citizen}`);
      console.log(`💵 Amount: ${ethers.formatEther(bill.amount)} ETH`);
      console.log(`📋 Status: ${bill.status} (0=Submitted, 1=Reimbursed, 2=Rejected)`);

      if (bill.status === 0) {
        console.log('\n🚀 Attempting to process reimbursement...');
        
        // 监听事件
        let eventReceived = false;
        
        reimbursementContract.on('Reimbursed', (billId, citizen, payout) => {
          console.log(`✅ Reimbursed event: Bill ${billId}, Citizen ${citizen}, Payout ${ethers.formatEther(payout)} ETH`);
          eventReceived = true;
        });

        reimbursementContract.on('Rejected', (billId, citizen, reason) => {
          console.log(`❌ Rejected event: Bill ${billId}, Citizen ${citizen}, Reason: ${reason}`);
          eventReceived = true;
        });

        try {
          // 处理报销
          const tx = await reimbursementContract.processReimbursement(lastBillId);
          console.log(`📝 Transaction sent: ${tx.hash}`);
          
          const receipt = await tx.wait();
          console.log(`✅ Transaction confirmed in block: ${receipt.blockNumber}`);
          console.log(`⛽ Gas used: ${receipt.gasUsed}`);

          // 等待事件
          await new Promise(resolve => setTimeout(resolve, 1000));

          // 检查账单状态是否更新
          const updatedBill = await hospitalBillContract.getBill(lastBillId);
          console.log(`\n📊 Updated bill status: ${updatedBill.status}`);

          if (updatedBill.status === bill.status) {
            console.log('⚠️  WARNING: Bill status did not change after processing!');
          } else {
            console.log('✅ Bill status successfully updated!');
          }

          // 尝试再次处理同一账单
          console.log('\n🔄 Testing duplicate processing prevention...');
          try {
            const tx2 = await reimbursementContract.processReimbursement(lastBillId);
            const receipt2 = await tx2.wait();
            console.log(`📝 Second transaction: ${tx2.hash}`);
            
            // 等待事件
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const finalBill = await hospitalBillContract.getBill(lastBillId);
            console.log(`📊 Final bill status: ${finalBill.status}`);
            
          } catch (error) {
            console.log(`❌ Second processing failed (expected): ${error.message}`);
          }

        } catch (error) {
          console.error(`❌ Error processing reimbursement: ${error.message}`);
          if (error.data) {
            console.error(`Error data: ${error.data}`);
          }
        }

      } else {
        console.log('ℹ️  Bill is not in Submitted status, cannot process');
      }

    } else {
      console.log('ℹ️  No bills found in the system');
    }

  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
  }
}

// 运行测试
testFrontendConnection().catch(console.error);