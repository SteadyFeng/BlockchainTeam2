import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { Web3Provider } from './contexts/Web3Context';
import NavigationBar from './components/NavigationBar';
import WalletConnection from './components/WalletConnection';
import Dashboard from './pages/Dashboard';
import HospitalPortal from './pages/HospitalPortal';
import GovernmentPortal from './pages/GovernmentPortal';
import ReimbursementPortal from './pages/ReimbursementPortal';

// 创建桌面端优化主题
const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    success: {
      main: '#2e7d32',
    },
    warning: {
      main: '#ed6c02',
    },
    error: {
      main: '#d32f2f',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '2.5rem', // 增大标题字体
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.8rem',
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.4rem',
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
  },
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          maxWidth: 'none !important', // 移除最大宽度限制
          width: '100% !important',
          padding: '0 32px !important',
          margin: '0 !important',
          '&.MuiContainer-maxWidthXl': {
            maxWidth: 'none !important',
          },
          '@media (min-width: 1200px)': {
            padding: '0 48px !important',
          },
          '@media (min-width: 1600px)': {
            padding: '0 64px !important',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
          borderRadius: 12,
          border: '1px solid rgba(0,0,0,0.06)',
          transition: 'all 0.3s ease',
          '&:hover': {
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '1rem',
          fontWeight: 500,
        },
        large: {
          padding: '14px 32px',
          fontSize: '1.1rem',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

// 受保护的路由组件
const ProtectedRoute = ({ children }) => {
  return (
    <Web3Provider>
      {children}
    </Web3Provider>
  );
};

// 主页组件
const HomePage = () => {
  return (
    <Box 
      display="flex" 
      justifyContent="center" 
      alignItems="center" 
      minHeight="calc(100vh - 72px)"
      width="100vw"
      sx={{ 
        backgroundColor: '#f8f9fa',
        px: 0,
        mx: 0,
      }}
    >
      <WalletConnection />
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Web3Provider>
          <Box sx={{ 
            minHeight: '100vh', 
            width: '100vw',
            backgroundColor: '#f8f9fa',
            margin: 0,
            padding: 0,
            overflow: 'auto'
          }}>
            <NavigationBar />
            
            <Routes>
              {/* 主页 - 钱包连接 */}
              <Route path="/" element={<HomePage />} />
              
              {/* 仪表板 */}
              <Route path="/dashboard" element={<Dashboard />} />
              
              {/* 医院门户 */}
              <Route path="/hospital" element={<HospitalPortal />} />
              
              {/* 政府门户 */}
              <Route path="/government" element={<GovernmentPortal />} />
              
              {/* 报销门户 */}
              <Route path="/reimbursement" element={<ReimbursementPortal />} />
              
              {/* 重定向到主页 */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Box>
        </Web3Provider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
