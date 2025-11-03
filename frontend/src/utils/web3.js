import { ethers } from 'ethers';
import { 
  CONTRACT_ADDRESSES, 
  GOVSTABLE_ABI, 
  HOSPITAL_BILL_ABI, 
  INSURANCE_REGISTRY_ABI, 
  REIMBURSEMENT_ABI 
} from './contracts.js';

let provider = null;
let signer = null;

// 初始化Web3连接
export const initWeb3 = async () => {
  if (typeof window.ethereum !== 'undefined') {
    try {
      // 请求用户连接钱包
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      provider = new ethers.BrowserProvider(window.ethereum);
      signer = await provider.getSigner();
      
      return { provider, signer };
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      throw error;
    }
  } else {
    throw new Error('Please install MetaMask!');
  }
};

// 获取当前账户地址
export const getCurrentAccount = async () => {
  if (signer) {
    return await signer.getAddress();
  }
  return null;
};

// 获取账户余额
export const getAccountBalance = async (address = null) => {
  if (!provider) await initWeb3();
  
  const account = address || await getCurrentAccount();
  const balance = await provider.getBalance(account);
  return ethers.formatEther(balance);
};

// 获取GovStable代币余额
export const getTokenBalance = async (address = null) => {
  if (!signer) await initWeb3();
  
  const account = address || await getCurrentAccount();
  const contract = new ethers.Contract(CONTRACT_ADDRESSES.GOVSTABLE, GOVSTABLE_ABI, provider);
  const balance = await contract.balanceOf(account);
  const decimals = await contract.decimals();
  return ethers.formatUnits(balance, decimals);
};

// 获取合约实例
export const getContract = (contractName, withSigner = false) => {
  if (!provider && !signer) {
    throw new Error('Web3 not initialized. Please connect wallet first.');
  }
  
  const addresses = CONTRACT_ADDRESSES;
  const abis = {
    GOVSTABLE: GOVSTABLE_ABI,
    HOSPITAL_BILL: HOSPITAL_BILL_ABI,
    INSURANCE_REGISTRY: INSURANCE_REGISTRY_ABI,
    REIMBURSEMENT: REIMBURSEMENT_ABI
  };

  const providerOrSigner = withSigner ? signer : provider;
  return new ethers.Contract(addresses[contractName], abis[contractName], providerOrSigner);
};

// 医院账单相关函数
export const submitBill = async (citizen, serviceCode, amount, docHash) => {
  try {
    const contract = getContract('HOSPITAL_BILL', true);
    const amountWei = ethers.parseEther(amount.toString());
    const tx = await contract.submitBill(citizen, serviceCode, amountWei, docHash);
    const receipt = await tx.wait();
    
    const result = handleTransactionReceipt(receipt);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    if (error.message === 'Transaction failed') {
      throw error;
    }
    throw new Error(handleContractError(error, 'submit bill'));
  }
};

export const getBill = async (billId) => {
  const contract = getContract('HOSPITAL_BILL');
  return await contract.getBill(billId);
};

// 获取账单总数
export const getBillCount = async () => {
  const contract = getContract('HOSPITAL_BILL');
  const count = await contract.getBillCount();
  return count.toString();
};

// 获取指定状态的账单列表
export const getBillsByStatus = async (status) => {
  const contract = getContract('HOSPITAL_BILL');
  const billIds = await contract.getBillsByStatus(status);
  return billIds.map(id => id.toString());
};

// 获取所有账单列表
export const getAllBills = async () => {
  const contract = getContract('HOSPITAL_BILL');
  const billIds = await contract.getAllBills();
  return billIds.map(id => id.toString());
};

// 获取账单详情列表（批量）
export const getBillsDetails = async (billIds) => {
  const contract = getContract('HOSPITAL_BILL');
  const bills = [];
  
  for (const billId of billIds) {
    try {
      const bill = await contract.getBill(billId);
      bills.push({
        id: billId,
        citizen: bill.citizen,
        serviceCode: bill.serviceCode.toString(),
        amount: bill.amount.toString(),
        docHash: bill.docHash,
        status: parseInt(bill.status)
      });
    } catch (error) {
      console.error(`Error fetching bill ${billId}:`, error);
    }
  }
  
  return bills;
};

// 保险注册相关函数
export const registerCitizen = async (citizenAddress, planId) => {
  try {
    const contract = getContract('INSURANCE_REGISTRY', true);
    const tx = await contract.registerCitizen(citizenAddress, planId);
    const receipt = await tx.wait();
    
    const result = handleTransactionReceipt(receipt);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    if (error.message === 'Transaction failed') {
      throw error;
    }
    throw new Error(handleContractError(error, 'register citizen'));
  }
};

export const setPlan = async (planId, copayBps, deductible, coverageLimit) => {
  try {
    const contract = getContract('INSURANCE_REGISTRY', true);
    const deductibleWei = ethers.parseEther(deductible.toString());
    const coverageLimitWei = ethers.parseEther(coverageLimit.toString());
    
    const plan = {
      copayBps,
      deductible: deductibleWei,
      coverageLimit: coverageLimitWei
    };
    
    const tx = await contract.setPlan(planId, plan);
    const receipt = await tx.wait();
    
    // 如果交易成功，直接返回结果，不抛出错误
    const result = handleTransactionReceipt(receipt);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    // 检查是否是 ethers v6 的 BAD_DATA 错误，但交易实际成功
    if (error.code === 'BAD_DATA' && error.value && error.value.transactionHash) {
      console.log('交易可能成功，尽管有 BAD_DATA 错误:', error.value.transactionHash);
      // 返回成功结果，忽略错误
      return {
        transactionHash: error.value.transactionHash,
        status: 'success',
        blockNumber: error.value.blockNumber || '0',
        gasUsed: error.value.gasUsed || '0'
      };
    }
    
    if (error.message === 'Transaction failed') {
      throw error;
    }
    
    const errorMsg = handleContractError(error, 'create plan');
    if (errorMsg) {
      throw new Error(errorMsg);
    }
    
    // 如果 handleContractError 返回 null（可能是成功的交易），不抛出错误
    throw new Error(`Failed to create plan: ${error.message}`);
  }
};

export const getPlanOf = async (citizenAddress) => {
  const contract = getContract('INSURANCE_REGISTRY');
  const result = await contract.getPlanOf(citizenAddress);
  return {
    planId: result.planId.toString(),
    plan: {
      copayBps: result.plan.copayBps.toString(),
      deductible: ethers.formatEther(result.plan.deductible),
      coverageLimit: ethers.formatEther(result.plan.coverageLimit)
    }
  };
};

export const getTotalPaid = async (citizenAddress) => {
  const contract = getContract('INSURANCE_REGISTRY');
  const totalPaid = await contract.totalPaid(citizenAddress);
  return ethers.formatEther(totalPaid);
};

// 处理报销
export const processReimbursement = async (billId) => {
  try {
    const contract = getContract('REIMBURSEMENT', true);
    const tx = await contract.processReimbursement(billId);
    const receipt = await tx.wait();
    
    const result = handleTransactionReceipt(receipt);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    if (error.message === 'Transaction failed') {
      throw error;
    }
    throw new Error(handleContractError(error, 'process reimbursement'));
  }
};

// 拒绝报销
export const rejectReimbursement = async (billId, reason) => {
  try {
    const contract = getContract('REIMBURSEMENT', true);
    const tx = await contract.rejectReimbursement(billId, reason);
    const receipt = await tx.wait();
    
    const result = handleTransactionReceipt(receipt);
    if (result.status === 'success') {
      return result;
    } else {
      throw new Error('Transaction failed');
    }
  } catch (error) {
    if (error.message === 'Transaction failed') {
      throw error;
    }
    throw new Error(handleContractError(error, 'reject reimbursement'));
  }
};

// 权限检查函数
export const hasRole = async (contractName, role, address = null) => {
  // 确保 Web3 已初始化
  if (!provider) await initWeb3();
  
  const contract = getContract(contractName);
  const account = address || await getCurrentAccount();
  return await contract.hasRole(role, account);
};

// 处理 ethers v6 交易回执的通用函数
export const handleTransactionReceipt = (receipt) => {
  if (!receipt) {
    throw new Error('Transaction failed: No receipt received');
  }
  
  // 检查交易状态，如果成功就不抛出错误
  if (receipt.status === 1 || receipt.status === '0x1') {
    return {
      ...receipt,
      transactionHash: receipt.hash || receipt.transactionHash,
      status: 'success',
      blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : '0',
      gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0'
    };
  }
  
  return {
    ...receipt,
    transactionHash: receipt.hash || receipt.transactionHash,
    status: 'failed',
    blockNumber: receipt.blockNumber ? receipt.blockNumber.toString() : '0',
    gasUsed: receipt.gasUsed ? receipt.gasUsed.toString() : '0'
  };
};

// 通用错误处理函数
export const handleContractError = (error, operation) => {
  console.error(`Error in ${operation}:`, error);
  
  // 处理常见的错误类型
  if (error.code === 'INVALID_ARGUMENT') {
    return `Invalid argument provided: ${error.argument || 'unknown'}`;
  }
  
  // 对于 BAD_DATA 错误，检查是否包含成功的交易信息
  if (error.code === 'BAD_DATA') {
    // 如果错误消息中包含交易哈希，可能交易实际上是成功的
    if (error.value && error.value.transactionHash) {
      console.log('Transaction may have succeeded despite BAD_DATA error:', error.value.transactionHash);
      // 不返回错误，让上层函数处理
      return null;
    }
    return `Transaction processing error. Please check if the transaction was successful.`;
  }
  
  if (error.message?.includes('user rejected')) {
    return `Transaction was rejected by user`;
  }
  
  if (error.message?.includes('insufficient funds')) {
    return `Insufficient funds to complete transaction`;
  }
  
  if (error.message?.includes('AccessControl:')) {
    return `Access denied: You don't have permission to perform this action`;
  }
  
  return `Failed to ${operation}: ${error.message || error.reason || 'Unknown error'}`;
};

// 格式化地址显示
export const formatAddress = (address) => {
  if (!address) return '';
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

// 格式化金额显示
export const formatAmount = (amount, decimals = 4) => {
  const num = parseFloat(amount);
  if (isNaN(num)) return '0';
  return num.toFixed(decimals);
};

// 生成文档哈希
export const generateDocHash = (content) => {
  return ethers.keccak256(ethers.toUtf8Bytes(content));
};

// 监听合约事件
export const listenToEvents = (contractName, eventName, callback) => {
  const contract = getContract(contractName);
  contract.on(eventName, callback);
  return () => contract.off(eventName, callback);
};