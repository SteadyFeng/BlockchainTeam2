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
  MenuItem,
  Tooltip
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
import { formatAddress, formatAmount, hasRole } from '../utils/web3';
import { ROLES } from '../utils/contracts';

const NavigationBar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isConnected, account, balance, tokenBalance, connectWallet } = useWeb3();
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [roles, setRoles] = React.useState({
    isHospital: false,
    isGovernment: false,
    isReimbursementAdmin: false,
    loadingRoles: false
  });

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  // 加载用户角色，用于禁用导航按钮
  React.useEffect(() => {
    let cancelled = false;
    const loadRoles = async () => {
      if (!isConnected || !account) {
        setRoles({
          isHospital: false,
          isGovernment: false,
          isReimbursementAdmin: false,
          loadingRoles: false
        });
        return;
      }
      try {
        setRoles((prev) => ({ ...prev, loadingRoles: true }));
        const [isHospitalRes, isGovernmentRes, isReimbursementRes] = await Promise.allSettled([
          hasRole('HOSPITAL_BILL', ROLES.HOSPITAL_ROLE, account),
          hasRole('INSURANCE_REGISTRY', ROLES.GOV_ROLE, account),
          hasRole('REIMBURSEMENT', ROLES.DEFAULT_ADMIN_ROLE, account)
        ]);

        if (!cancelled) {
          setRoles({
            isHospital: isHospitalRes.status === 'fulfilled' ? isHospitalRes.value : false,
            isGovernment: isGovernmentRes.status === 'fulfilled' ? isGovernmentRes.value : false,
            isReimbursementAdmin: isReimbursementRes.status === 'fulfilled' ? isReimbursementRes.value : false,
            loadingRoles: false
          });
        }
      } catch (err) {
        if (!cancelled) {
          setRoles((prev) => ({ ...prev, loadingRoles: false }));
        }
      }
    };

    loadRoles();
    return () => { cancelled = true; };
  }, [isConnected, account]);

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

  const canAccess = (path) => {
    switch (path) {
      case '/dashboard':
        return true;
      case '/hospital':
        return roles.isHospital;
      case '/government':
        return roles.isGovernment;
      case '/reimbursement':
        return roles.isReimbursementAdmin;
      default:
        return true;
    }
  };

  const tooltipFor = (path) => {
    switch (path) {
      case '/hospital':
        return 'Access denied. You need hospital role to access this portal.';
      case '/government':
        return 'Access denied. You need government role to access this portal.';
      case '/reimbursement':
        return 'Access denied. You need reimbursement admin role to access this portal.';
      default:
        return '';
    }
  };

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
              {menuItems.map((item) => {
                const enabled = canAccess(item.path);
                const buttonEl = (
                  <Button
                    color="inherit"
                    disabled={!enabled}
                    onClick={() => enabled && navigate(item.path)}
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
                      opacity: enabled ? 1 : 0.6,
                      cursor: enabled ? 'pointer' : 'not-allowed',
                      '&:hover': {
                        backgroundColor: 'rgba(255,255,255,0.15)',
                        backdropFilter: 'blur(10px)',
                      }
                    }}
                  >
                    {item.label}
                  </Button>
                );

                if (enabled || item.path === '/dashboard') {
                  return (
                    <React.Fragment key={item.path}>
                      {buttonEl}
                    </React.Fragment>
                  );
                }
                return (
                  <Tooltip title={tooltipFor(item.path)} arrow disableInteractive key={item.path}>
                    <span>{buttonEl}</span>
                  </Tooltip>
                );
              })}
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
