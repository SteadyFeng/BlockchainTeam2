# Medical Insurance Blockchain System - Frontend

这是一个基于区块链的医疗保险系统前端应用，使用 React + Vite + Material-UI 构建。

## 🚀 功能特性

### 核心功能
- **钱包连接**: 支持 MetaMask 钱包连接
- **角色管理**: 多角色权限控制（公民、医院、政府、报销管理员）
- **医疗账单提交**: 医院可以提交患者医疗账单
- **保险计划管理**: 政府可以创建和管理保险计划
- **公民注册**: 政府可以为公民注册保险
- **自动报销**: 智能合约自动计算和处理报销

### 用户界面
- **响应式设计**: 支持桌面和移动端
- **Material-UI**: 现代化的用户界面
- **实时更新**: 区块链事件监听和实时状态更新
- **多页面导航**: 基于角色的页面访问控制

## 📋 页面说明

### 1. 仪表板 (`/dashboard`)
- 显示用户角色和权限
- 保险覆盖信息
- 账户余额和代币余额
- 快速操作入口

### 2. 医院门户 (`/hospital`)
**需要医院角色权限**
- 提交医疗账单表单
- 查看已提交账单列表
- 账单状态跟踪

### 3. 政府门户 (`/government`)
**需要政府角色权限**
- 注册公民保险
- 创建保险计划
- 查询公民信息

### 4. 报销门户 (`/reimbursement`)
**需要报销管理员权限**
- 处理报销请求
- 查看计算详情
- 报销历史记录

## 🛠 技术栈

- **React 19** - 用户界面框架
- **Vite** - 构建工具和开发服务器
- **Material-UI (MUI)** - UI 组件库
- **React Router** - 路由管理
- **ethers.js** - 以太坊区块链交互

## 📦 安装和运行

### 前置条件
- Node.js 16+ 
- npm 或 yarn
- MetaMask 浏览器扩展

### 安装依赖
```bash
cd frontend
npm install
```

### 启动开发服务器
```bash
npm run dev
```

应用将在 `http://localhost:5173` 上运行

### 构建生产版本
```bash
npm run build
```

## ⚙️ 配置

### 合约配置
编辑 `src/utils/contracts.js` 文件中的合约地址：

```javascript
export const CONTRACT_ADDRESSES = {
  GOVSTABLE: "0x...", // GovStable 合约地址
  HOSPITAL_BILL: "0x...", // 医院账单合约地址
  INSURANCE_REGISTRY: "0x...", // 保险注册合约地址
  REIMBURSEMENT: "0x...", // 报销合约地址
};
```

### 网络配置
确保 MetaMask 连接到正确的以太坊网络

## 👥 用户角色和权限

### 公民 (Citizen)
- 查看个人仪表板
- 检查保险状态
- 接收报销代币

### 医院工作人员 (Hospital Staff)
- 提交医疗账单
- 查看账单状态
- 访问医院门户

### 政府管理员 (Government Admin)  
- 创建保险计划
- 注册公民
- 分配用户角色
- 查看所有数据

### 报销管理员 (Reimbursement Admin)
- 处理报销请求
- 查看计算详情
- 批准/拒绝理赔

## 🔧 项目结构
```
src/
├── components/          # 可复用组件
│   ├── NavigationBar.jsx
│   ├── WalletConnection.jsx
│   └── UserGuide.jsx
├── contexts/           # React Context
│   └── Web3Context.jsx
├── pages/             # 页面组件
│   ├── Dashboard.jsx
│   ├── HospitalPortal.jsx
│   ├── GovernmentPortal.jsx
│   └── ReimbursementPortal.jsx
├── utils/             # 工具函数
│   ├── contracts.js   # 合约 ABI 和地址
│   └── web3.js       # Web3 交互函数
├── App.jsx           # 主应用组件
└── main.jsx         # 应用入口
```

## 🚀 部署

### 构建
```bash
npm run build
```

### 部署到静态托管服务
构建文件可部署到：Vercel、Netlify、GitHub Pages 等

## 📞 故障排除

### 常见问题
- **MetaMask 连接失败**: 确保已安装扩展且网络正确
- **合约交互错误**: 检查合约地址和用户权限
- **页面加载错误**: 检查控制台错误和依赖安装
