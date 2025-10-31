# 🏥 医疗保险区块链系统 - 完整部署运行指南

## 📋 项目概述

这是一个基于以太坊区块链的医疗保险系统，包含：
- **智能合约**：4个相互关联的 Solidity 合约
- **前端应用**：React + Vite + Material-UI 构建的 Web 界面
- **开发环境**：Truffle + Ganache 本地区块链

## 🛠️ 环境要求

- **Node.js**: v16+ 
- **npm**: v8+
- **Ganache**: GUI 或 CLI
- **MetaMask**: 浏览器扩展
- **Git**: 版本控制

## 🚀 完整部署流程

### 第1步：克隆项目并安装依赖

```bash
# 克隆项目
git clone <repository-url>
cd BlockchainTeam2

# 安装根目录依赖 (Truffle 相关)
npm install

# 安装前端依赖
cd frontend
npm install
cd ..
```

### 第2步：启动 Ganache 本地区块链

**选项A：使用 Ganache GUI**
1. 启动 Ganache GUI 应用
2. 创建新工作区或快速启动
3. 确认配置：
   - RPC 服务器：`http://127.0.0.1:7545`
   - 网络 ID：`5777`
   - Gas 限制：`6721975`

**选项B：使用 Ganache CLI**
```bash
npx ganache-cli --host 127.0.0.1 --port 7545 --networkId 5777
```

### 第3步：编译和部署智能合约

```bash
# 确保在项目根目录
cd BlockchainTeam2

# 编译合约
npx truffle compile

# 部署合约到本地网络
npx truffle migrate --reset --network development
```

**部署成功后会显示**：
```
📋 合约地址汇总:
┌─────────────────────────────────────────────────────────┐
│ GovStable:            0xae674a265726C81443040031069D92F2Fc4D4b48 │
│ InsuranceRegistry:    0x536C72c7BA165C80d07dD1472E7058ce95436624 │
│ HospitalBillContract: 0xB3C9506462D66ee14D8d9516bC86Edf8DA07894B │
│ ReimbursementContract:0x3AB2f521feb2ba4fd8869E220039b14932AeA145 │
└─────────────────────────────────────────────────────────┘
```
需要将以上内容复制到contract.js下

### 第4步：配置 MetaMask

1. **添加 Ganache 网络**：
   - 打开 MetaMask → 网络 → 添加网络 → 手动添加
   - 网络名称：`Ganache Local`
   - RPC URL：`http://127.0.0.1:7545`
   - 链 ID：`5777`
   - 货币符号：`ETH`

2. **导入测试账户**：
   - 从 Ganache 复制以下账户的私钥并导入到 MetaMask：
     - `accounts[0]` - 部署者账户
     - `accounts[1]` - 🏛️ 政府管理员
     - `accounts[2]` - 🏥 医院管理员  
     - `accounts[3]` - 💸 报销管理员
     - `accounts[4]` - 👤 测试市民1
     - `accounts[5]` - 👤 测试市民2

### 第5步：启动前端应用

```bash
# 进入前端目录
cd frontend

# 启动开发服务器
npm run dev
```

前端将在 `http://localhost:5173` 启动。

## 🧪 完整测试流程

### 测试前准备

1. **确认前端已启动**：访问 http://localhost:5173
2. **MetaMask 网络**：确认已连接到 Ganache Local
3. **账户余额**：确认测试账户有足够的 ETH

### 阶段一：政府管理 (Government Portal)

**使用账户**：政府管理员 (`accounts[1]`)

1. **连接钱包**：
   - 在 MetaMask 中切换到政府管理员账户
   - 点击"连接钱包"按钮

2. **进入政府门户**：
   - 点击导航栏"政府门户"
   - 应该能正常访问，不显示权限错误

3. **创建保险计划**：
   ```
   计划ID: 1
   自付比例: 1000 (10%)
   免赔额: 0.1 (ETH)
   覆盖上限: 10 (ETH)
   ```

4. **注册市民**：
   - 市民地址：使用 `accounts[4]` 的地址
   - 计划ID: 1

### 阶段二：医院管理 (Hospital Portal)

**使用账户**：医院管理员 (`accounts[2]`)

1. **切换账户**：
   - MetaMask 切换到医院管理员
   - 刷新页面并重新连接

2. **进入医院门户**：
   - 点击"医院门户"

3. **创建患者账单**：
   ```
   患者地址: accounts[4] 的地址
   服务代码: 1001
   账单金额: 1 (ETH)
   文档哈希: 任意32字节哈希值
   ```

### 阶段三：市民查看 (Dashboard)

**使用账户**：测试市民1 (`accounts[4]`)

1. **切换到市民账户**
2. **查看仪表板**：
   - 个人保险信息
   - 账单列表
   - 报销记录

### 阶段四：报销处理 (Reimbursement Portal)

**使用账户**：报销管理员 (`accounts[3]`)

1. **切换到报销管理员**
2. **进入报销门户**
3. **处理报销申请**：
   - 查看待处理账单
   - 点击"处理报销"
   - 确认交易

4. **验证结果**：
   - 账单状态变为"已报销"
   - GOV 代币自动转账给市民

## 🔧 故障排除

### 常见问题

**1. 权限错误 "Access denied"**
```bash
# 运行角色验证脚本
npx truffle exec get_roles.js --network development
# 检查前端 contracts.js 中的角色哈希值是否匹配
```

**2. 合约调用失败**
- 检查 MetaMask 是否连接正确网络
- 确认 Ganache 正在运行
- 验证合约地址配置

**3. 前端无法连接**
- 检查防火墙设置
- 确认端口 5173 和 7545 未被占用
- 清除浏览器缓存

**4. 交易失败**
- 检查账户 ETH 余额
- 增加 Gas 限制
- 确认使用正确的角色账户

### 重新部署

如果需要完全重新开始：

```bash
# 1. 停止所有服务
# 2. 重启 Ganache
# 3. 清理并重新部署
npx truffle migrate --reset --network development
# 4. 更新前端合约地址（如果地址改变）
# 5. 重启前端
cd frontend && npm run dev
```

## 📁 项目结构

```
BlockchainTeam2/
├── Contracts/              # Solidity 智能合约
│   ├── GovStable.sol       # ERC20 代币合约
│   ├── InsuranceRegistry.sol
│   ├── HospitalBillContract.sol
│   └── ReimbursementContract.sol
├── migrations/             # Truffle 部署脚本
├── build/                  # 编译输出 (自动生成)
├── frontend/               # React 前端应用
│   ├── src/
│   │   ├── components/     # UI 组件
│   │   ├── pages/          # 页面组件
│   │   ├── contexts/       # React Context
│   │   └── utils/          # 工具函数和配置
│   └── package.json
├── truffle-config.js       # Truffle 配置
├── get_roles.js           # 角色哈希获取工具
└── README.md
```

## 🎯 系统功能

- **角色管理**：基于 OpenZeppelin AccessControl 的权限系统
- **保险计划**：政府可创建和管理多种保险计划
- **市民注册**：将市民分配到不同保险计划
- **医疗账单**：医院可提交患者医疗账单
- **自动报销**：智能计算报销金额并铸造 GOV 代币
- **状态跟踪**：完整的账单生命周期管理

## 📞 技术支持

- **Truffle 文档**：https://trufflesuite.com/docs/
- **OpenZeppelin**：https://docs.openzeppelin.com/
- **React 文档**：https://react.dev/
- **ethers.js**：https://docs.ethers.org/

---
**版本**：v1.0.0  
**最后更新**：2025年11月1日  
**状态**：✅ 生产就绪