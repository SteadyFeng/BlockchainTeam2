import React from 'react';
import { 
  Button, 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  CircularProgress,
  Alert
} from '@mui/material';
import { AccountBalanceWallet, Warning } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { formatAddress, formatAmount } from '../utils/web3';

const WalletConnection = () => {
  const { 
    isConnected, 
    account, 
    balance, 
    tokenBalance, 
    loading, 
    error, 
    connectWallet, 
    disconnect 
  } = useWeb3();

  if (loading) {
    return (
      <Box display="flex" alignItems="center" gap={2}>
        <CircularProgress size={24} />
        <Typography>Connecting...</Typography>
      </Box>
    );
  }

  if (!isConnected) {
    return (
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center',
          minHeight: '60vh',
          width: '100%',
          px: { xs: 3, md: 6, lg: 12 }
        }}
      >
        <Card sx={{ 
          maxWidth: { xs: '100%', md: 800, lg: 1000, xl: 1200 }, 
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
        }}>
          <CardContent sx={{ 
            textAlign: 'center', 
            p: { xs: 4, md: 6, lg: 8, xl: 10 }
          }}>
            <AccountBalanceWallet sx={{ 
              fontSize: 80, 
              color: 'primary.main', 
              mb: 3,
              filter: 'drop-shadow(0 4px 8px rgba(25,118,210,0.3))'
            }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 2 }}>
              Medical Insurance System
            </Typography>
            <Typography variant="h6" color="text.primary" sx={{ mb: 1 }}>
              Connect Your Wallet
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 4, maxWidth: 480, mx: 'auto' }}>
              Connect your MetaMask wallet to access the blockchain-based medical insurance system. 
              Manage your insurance coverage, submit claims, and receive reimbursements transparently.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3, textAlign: 'left' }}>
                <Typography variant="body2">{error}</Typography>
              </Alert>
            )}
            
            <Button
              variant="contained"
              size="large"
              onClick={connectWallet}
              startIcon={<AccountBalanceWallet />}
              sx={{ 
                minWidth: 240,
                py: 1.5,
                px: 4,
                fontSize: '1.1rem',
                fontWeight: 600,
                boxShadow: '0 4px 16px rgba(25,118,210,0.3)',
                '&:hover': {
                  boxShadow: '0 6px 20px rgba(25,118,210,0.4)',
                  transform: 'translateY(-2px)',
                },
              }}
            >
              Connect MetaMask Wallet
            </Button>
            
            {typeof window.ethereum === 'undefined' && (
              <Box mt={3}>
                <Alert severity="warning" sx={{ textAlign: 'left' }}>
                  <Typography variant="body2">
                    MetaMask not detected. Please install the MetaMask browser extension to continue.
                  </Typography>
                </Alert>
              </Box>
            )}
            
            <Box sx={{ mt: 4, pt: 3, borderTop: '1px solid rgba(0,0,0,0.1)' }}>
              <Typography variant="body2" color="text.secondary">
                🔒 Secure • 🌐 Decentralized • ⚡ Transparent
              </Typography>
            </Box>
          </CardContent>
        </Card>
      </Box>
    );
  }

  return (
    <Card sx={{ minWidth: 300 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">Wallet Info</Typography>
          <Button
            size="small"
            onClick={disconnect}
            color="error"
            variant="outlined"
          >
            Disconnect
          </Button>
        </Box>
        
        <Box mb={1}>
          <Typography variant="body2" color="text.secondary">
            Account
          </Typography>
          <Typography variant="body1" fontFamily="monospace">
            {formatAddress(account)}
          </Typography>
        </Box>
        
        <Box mb={1}>
          <Typography variant="body2" color="text.secondary">
            ETH Balance
          </Typography>
          <Typography variant="body1">
            {formatAmount(balance)} ETH
          </Typography>
        </Box>
        
        <Box>
          <Typography variant="body2" color="text.secondary">
            GOVS Balance
          </Typography>
          <Typography variant="body1">
            {formatAmount(tokenBalance)} GOVS
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default WalletConnection;