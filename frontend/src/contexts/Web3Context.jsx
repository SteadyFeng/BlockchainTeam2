import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { initWeb3, getCurrentAccount, getAccountBalance, getTokenBalance } from '../utils/web3';

// Web3状态
const initialState = {
  isConnected: false,
  account: null,
  balance: '0',
  tokenBalance: '0',
  provider: null,
  signer: null,
  loading: false,
  error: null
};

// Web3操作类型
const WEB3_ACTIONS = {
  SET_LOADING: 'SET_LOADING',
  SET_CONNECTED: 'SET_CONNECTED',
  SET_ACCOUNT: 'SET_ACCOUNT',
  SET_BALANCE: 'SET_BALANCE',
  SET_TOKEN_BALANCE: 'SET_TOKEN_BALANCE',
  SET_ERROR: 'SET_ERROR',
  DISCONNECT: 'DISCONNECT'
};

// Web3 Reducer
const web3Reducer = (state, action) => {
  switch (action.type) {
    case WEB3_ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case WEB3_ACTIONS.SET_CONNECTED:
      return { 
        ...state, 
        isConnected: true, 
        provider: action.payload.provider,
        signer: action.payload.signer,
        loading: false,
        error: null 
      };
    case WEB3_ACTIONS.SET_ACCOUNT:
      return { ...state, account: action.payload };
    case WEB3_ACTIONS.SET_BALANCE:
      return { ...state, balance: action.payload };
    case WEB3_ACTIONS.SET_TOKEN_BALANCE:
      return { ...state, tokenBalance: action.payload };
    case WEB3_ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };
    case WEB3_ACTIONS.DISCONNECT:
      return { ...initialState };
    default:
      return state;
  }
};

// 创建上下文
const Web3Context = createContext();

// Web3提供者组件
export const Web3Provider = ({ children }) => {
  const [state, dispatch] = useReducer(web3Reducer, initialState);

  // 连接钱包
  const connectWallet = async () => {
    try {
      dispatch({ type: WEB3_ACTIONS.SET_LOADING, payload: true });
      
      const { provider, signer } = await initWeb3();
      dispatch({ 
        type: WEB3_ACTIONS.SET_CONNECTED, 
        payload: { provider, signer } 
      });

      const account = await getCurrentAccount();
      dispatch({ type: WEB3_ACTIONS.SET_ACCOUNT, payload: account });

      await updateBalances(account);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      dispatch({ 
        type: WEB3_ACTIONS.SET_ERROR, 
        payload: error.message 
      });
    }
  };

  // 更新余额
  const updateBalances = async (account = null) => {
    try {
      const targetAccount = account || state.account;
      if (!targetAccount) return;

      const ethBalance = await getAccountBalance(targetAccount);
      dispatch({ type: WEB3_ACTIONS.SET_BALANCE, payload: ethBalance });

      try {
        const tokenBalance = await getTokenBalance(targetAccount);
        dispatch({ type: WEB3_ACTIONS.SET_TOKEN_BALANCE, payload: tokenBalance });
      } catch (error) {
        // 如果合约还没有部署，忽略代币余额错误
        console.warn('Could not fetch token balance:', error.message);
      }
    } catch (error) {
      console.error('Failed to update balances:', error);
    }
  };

  // 断开连接
  const disconnect = () => {
    dispatch({ type: WEB3_ACTIONS.DISCONNECT });
  };

  // 监听账户变化
  useEffect(() => {
    if (typeof window.ethereum !== 'undefined') {
      const handleAccountsChanged = (accounts) => {
        if (accounts.length === 0) {
          disconnect();
        } else {
          dispatch({ type: WEB3_ACTIONS.SET_ACCOUNT, payload: accounts[0] });
          updateBalances(accounts[0]);
        }
      };

      const handleChainChanged = () => {
        // 网络改变时重新加载页面
        window.location.reload();
      };

      window.ethereum.on('accountsChanged', handleAccountsChanged);
      window.ethereum.on('chainChanged', handleChainChanged);

      // 检查是否已经连接
      const checkConnection = async () => {
        try {
          const accounts = await window.ethereum.request({ method: 'eth_accounts' });
          if (accounts.length > 0) {
            await connectWallet();
          }
        } catch (error) {
          console.error('Failed to check connection:', error);
        }
      };

      checkConnection();

      // 清理事件监听器
      return () => {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      };
    }
  }, []);

  // 提供的值
  const value = {
    ...state,
    connectWallet,
    disconnect,
    updateBalances
  };

  return (
    <Web3Context.Provider value={value}>
      {children}
    </Web3Context.Provider>
  );
};

// 使用Web3上下文的钩子
export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (!context) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};