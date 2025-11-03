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
  const contract = getContract('HOSPITAL_BILL', true);
  const amountWei = ethers.parseEther(amount.toString());
  const tx = await contract.submitBill(citizen, serviceCode, amountWei, docHash);
  return await tx.wait();
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
  const contract = getContract('INSURANCE_REGISTRY', true);
  const tx = await contract.registerCitizen(citizenAddress, planId);
  return await tx.wait();
};

export const setPlan = async (planId, copayBps, deductible, coverageLimit) => {
  const contract = getContract('INSURANCE_REGISTRY', true);
  const deductibleWei = ethers.parseEther(deductible.toString());
  const coverageLimitWei = ethers.parseEther(coverageLimit.toString());
  
  const plan = {
    copayBps,
    deductible: deductibleWei,
    coverageLimit: coverageLimitWei
  };
  
  const tx = await contract.setPlan(planId, plan);
  return await tx.wait();
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
  const contract = getContract('REIMBURSEMENT', true);
  const tx = await contract.processReimbursement(billId);
  return await tx.wait();
};

// 拒绝报销
export const rejectReimbursement = async (billId, reason) => {
  const contract = getContract('REIMBURSEMENT', true);
  const tx = await contract.rejectReimbursement(billId, reason);
  return await tx.wait();
};

// 权限检查函数
export const hasRole = async (contractName, role, address = null) => {
  // 确保 Web3 已初始化
  if (!provider) await initWeb3();
  
  const contract = getContract(contractName);
  const account = address || await getCurrentAccount();
  return await contract.hasRole(role, account);
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