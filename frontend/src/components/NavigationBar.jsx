import React from 'react';
import { 
  AppBar, 
  Toolbar, 
  Typography, 
  Button, 
  Box, 
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { 
  LocalHospital, 
  AccountBalance, 
  Assignment, 
  MonetizationOn,
  AccountCircle 
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useWeb3 } from '../contexts/Web3Context';
import { formatAddress, formatAmount } from '../utils/web3';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, account, balance, tokenBalance, connectWallet } = useWeb3();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const menuItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <Assignment /> 
    },
    { 
      path: '/hospital', 
      label: 'Hospital Portal', 
      icon: <LocalHospital /> 
    },
    { 
      path: '/government', 
      label: 'Government Portal', 
      icon: <AccountBalance /> 
    },
    { 
      path: '/reimbursement', 
      label: 'Reimbursement', 
      icon: <MonetizationOn /> 
    }
  ];

  return (
    <AppBar 
      position="static" 
      elevation={0}
      sx={{
        background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.1)',
      }}
    >
      <Toolbar sx={{ 
        minHeight: '72px !important', 
        px: { xs: 2, md: 4, lg: 6, xl: 8 },
        width: '100%'
      }}>
        {/* Logo and Title */}
        <Box display="flex" alignItems="center" sx={{ flexGrow: 1 }}>
          <LocalHospital 
            sx={{ mr: 2, fontSize: 32, cursor: 'pointer' }} 
            onClick={() => navigate('/')}
          />
          <Typography variant="h5" component="div" sx={{ mr: 5, fontWeight: 600 }}>
            Medical Insurance System
          </Typography>
          
          {/* Navigation Buttons */}
          {isConnected && (
            <Box display="flex" gap={2}>
              {menuItems.map((item) => (
                <Button
                  key={item.path}
                  color="inherit"
                  onClick={() => navigate(item.path)}
                  startIcon={item.icon}
                  sx={{
                    px: 3,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 500,
                    borderRadius: 2,
                    backgroundColor: location.pathname === item.path ? 'rgba(255,255,255,0.25)' : 'transparent',
                    backdropFilter: location.pathname === item.path ? 'blur(10px)' : 'none',
                    border: location.pathname === item.path ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
                    '&:hover': {
                      backgroundColor: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(10px)',
                    }
                  }}
                >
                  {item.label}
                </Button>
              ))}
            </Box>
          )}
        </Box>

        {/* Wallet Info and Account Menu */}
        {isConnected ? (
          <Box display="flex" alignItems="center" gap={3}>
            {/* Balance Info */}
            <Box display="flex" gap={2}>
              <Chip 
                label={`${formatAmount(balance, 3)} ETH`} 
                size="medium" 
                sx={{
                  bgcolor: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.3)',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 2,
                    py: 1,
                  }
                }}
              />
              <Chip 
                label={`${formatAmount(tokenBalance, 2)} GOVS`} 
                size="medium" 
                sx={{
                  bgcolor: 'rgba(255,255,255,0.2)',
                  color: 'white',
                  border: '1px solid rgba(255,255,255,0.4)',
                  backdropFilter: 'blur(10px)',
                  fontWeight: 600,
                  '& .MuiChip-label': {
                    px: 2,
                    py: 1,
                  }
                }}
              />
            </Box>

            {/* Account Menu */}
            <IconButton
              size="large"
              onClick={handleMenu}
              color="inherit"
            >
              <AccountCircle />
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  {formatAddress(account)}
                </Typography>
              </MenuItem>
              <MenuItem onClick={() => {
                navigator.clipboard.writeText(account);
                handleClose();
              }}>
                Copy Address
              </MenuItem>
              <MenuItem onClick={() => {
                handleClose();
                // 这里可以添加查看交易历史的功能
              }}>
                View on Explorer
              </MenuItem>
            </Menu>
          </Box>
        ) : (
          <Button
            color="inherit"
            onClick={connectWallet}
            startIcon={<AccountCircle />}
            variant="outlined"
          >
            Connect Wallet
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
};

export default NavigationBar;