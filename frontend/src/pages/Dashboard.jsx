import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress
} from '@mui/material';
import {
  LocalHospital,
  AccountBalance,
  MonetizationOn,
  Assignment,
  Refresh,
  CheckCircle
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  getPlanOf, 
  getTotalPaid, 
  hasRole, 
  formatAddress, 
  formatAmount,
  getAllBills,
  getBillsDetails,
  listenToEvents
} from '../utils/web3';
import { ROLES, BILL_STATUS, BILL_STATUS_COLORS } from '../utils/contracts';

const Dashboard = () => {
  const { isConnected, account, balance, tokenBalance, updateBalances } = useWeb3();
  const [userInfo, setUserInfo] = useState({
    isHospital: false,
    isGovernment: false,
    isReimbursementAdmin: false,
    hasInsurance: false,
    planInfo: null,
    totalPaid: '0'
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // 市民账单列表状态
  const [citizenBills, setCitizenBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // 加载用户信息
  const loadUserInfo = async () => {
    if (!isConnected || !account) return;

    try {
      setLoading(true);
      setError(null);

      // 检查用户角色
      const [isHospital, isGovernment, isReimbursementAdmin] = await Promise.allSettled([
        hasRole('HOSPITAL_BILL', ROLES.HOSPITAL_ROLE, account),
        hasRole('INSURANCE_REGISTRY', ROLES.GOV_ROLE, account),
        hasRole('REIMBURSEMENT', ROLES.DEFAULT_ADMIN_ROLE, account)
      ]);

      // 检查保险信息
      let planInfo = null;
      let totalPaid = '0';
      let hasInsurance = false;

      try {
        planInfo = await getPlanOf(account);
        totalPaid = await getTotalPaid(account);
        hasInsurance = parseFloat(planInfo.plan.coverageLimit) > 0;
      } catch (err) {
        // 用户可能没有注册保险
        console.warn('User not registered for insurance:', err);
      }

      setUserInfo({
        isHospital: isHospital.status === 'fulfilled' ? isHospital.value : false,
        isGovernment: isGovernment.status === 'fulfilled' ? isGovernment.value : false,
        isReimbursementAdmin: isReimbursementAdmin.status === 'fulfilled' ? isReimbursementAdmin.value : false,
        hasInsurance,
        planInfo,
        totalPaid
      });
    } catch (err) {
      console.error('Error loading user info:', err);
      setError(err.message);
  } finally {
    setLoading(false);
  }
  };

  // 加载当前账户的账单列表（仅市民）
  const fetchCitizenBills = async () => {
    if (!isConnected || !account) return;
    try {
      setLoadingBills(true);
      setError(null);
      const allBillIds = await getAllBills();
      if (allBillIds.length === 0) {
        setCitizenBills([]);
        return;
      }
      const billsDetails = await getBillsDetails(allBillIds);
      const myBills = billsDetails.filter(b => (b.citizen || '').toLowerCase() === account.toLowerCase());
      setCitizenBills(myBills);
    } catch (err) {
      console.error('Error fetching citizen bills:', err);
      setError('Failed to load your bills');
      setCitizenBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  useEffect(() => {
    loadUserInfo();
    // 加载市民账单列表
    fetchCitizenBills();
  }, [isConnected, account]);

  // 监听账单相关事件，自动刷新列表
  useEffect(() => {
    if (!isConnected) return;
    const cleanupSubmitted = listenToEvents('HOSPITAL_BILL', 'BillSubmitted', (billId, citizen, amount) => {
      if ((citizen || '').toLowerCase() === account.toLowerCase()) {
        fetchCitizenBills();
      }
    });
    const cleanupStatusChanged = listenToEvents('HOSPITAL_BILL', 'BillStatusChanged', () => {
      fetchCitizenBills();
    });
    return () => {
      cleanupSubmitted();
      cleanupStatusChanged();
    };
  }, [isConnected, account]);

  const handleRefresh = async () => {
    await Promise.all([loadUserInfo(), updateBalances()]);
  };

  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access the dashboard.
        </Alert>
      </Container>
    );
  }

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 6, mb: 6 }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          mt: 1,
          background: 'linear-gradient(135deg, #1e88e5 0%, #1565c0 100%)',
          color: 'white',
          p: { xs: 2, md: 3 },
          borderRadius: 2,
          boxShadow: '0 6px 20px rgba(25,118,210,0.2)',
        }}
      >
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, mb: 0.5 }}>
            Dashboard
          </Typography>
          <Typography variant="body1" sx={{ opacity: 0.9, fontWeight: 400 }}>
            Medical Insurance System Overview
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Refresh />}
          onClick={handleRefresh}
          sx={{
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(10px)',
            '&:hover': {
              bgcolor: 'rgba(255,255,255,0.25)',
            },
          }}
        >
          Refresh Data
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Overview Metrics */}
      <Grid container spacing={2} mb={3} justifyContent="center">
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' } }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={0.5}>
                <AccountBalance fontSize="small" color="primary" />
                <Typography variant="subtitle2" color="text.secondary">ETH Balance</Typography>
              </Box>
              <Typography variant="h6">{formatAmount(balance)} ETH</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' } }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={0.5}>
                <MonetizationOn fontSize="small" color="success" />
                <Typography variant="subtitle2" color="text.secondary">GovStable Balance</Typography>
              </Box>
              <Typography variant="h6">{formatAmount(tokenBalance)} GOVS</Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card elevation={2} sx={{ transition: 'all 0.3s ease', '&:hover': { transform: 'translateY(-2px)', boxShadow: '0 6px 18px rgba(0,0,0,0.08)' } }}>
            <CardContent sx={{ p: 2, textAlign: 'center' }}>
              <Box display="flex" justifyContent="center" alignItems="center" gap={1} mb={0.5}>
                <Assignment fontSize="small" color={userInfo.hasInsurance ? 'success' : 'disabled'} />
                <Typography variant="subtitle2" color="text.secondary">Insurance Status</Typography>
              </Box>
              <Chip 
                label={userInfo.hasInsurance ? "Registered" : "Not Registered"} 
                color={userInfo.hasInsurance ? "success" : "default"}
                size="small"
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Roles */}
      <Grid container spacing={4} mb={4} justifyContent="center">
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Account Roles & Permissions
              </Typography>
              <Box display="flex" gap={2} flexWrap="wrap" justifyContent="center">
                {userInfo.isGovernment && (
                  <Chip 
                    icon={<AccountBalance />} 
                    label="Government Admin" 
                    color="primary" 
                  />
                )}
                {userInfo.isHospital && (
                  <Chip 
                    icon={<LocalHospital />} 
                    label="Hospital Staff" 
                    color="secondary" 
                  />
                )}
                {userInfo.isReimbursementAdmin && (
                  <Chip 
                    icon={<MonetizationOn />} 
                    label="Reimbursement Admin" 
                    color="success" 
                  />
                )}
                {!userInfo.isGovernment && !userInfo.isHospital && !userInfo.isReimbursementAdmin && (
                  <Chip 
                    icon={<Assignment />} 
                    label="Citizen" 
                    color="default" 
                  />
                )}
              </Box>
            </CardContent>
          </Card>
      </Grid>
    </Grid>
    {/* Row 1: Bills + Quick Actions */}
    <Grid container spacing={4} alignItems="stretch" mb={4} justifyContent="center">
      {(!userInfo.isGovernment && !userInfo.isHospital && !userInfo.isReimbursementAdmin) && (
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2} gap={2}>
                <Typography variant="h6" gutterBottom>
                  My Medical Bills
                </Typography>
                <Button 
                  variant="outlined" 
                  startIcon={<Refresh />} 
                  onClick={fetchCitizenBills}
                  disabled={loadingBills}
                >
                  {loadingBills ? 'Loading...' : 'Refresh'}
                </Button>
              </Box>

              {loadingBills ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : citizenBills.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead sx={{ bgcolor: 'grey.100' }}>
                      <TableRow>
                        <TableCell sx={{ fontWeight: 600 }}>Bill ID</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Service Code</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Amount</TableCell>
                        <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {citizenBills.map((bill) => (
                        <TableRow key={bill.id} hover sx={{ '&:hover': { bgcolor: 'grey.50' } }}>
                          <TableCell>#{bill.id}</TableCell>
                          <TableCell>{bill.serviceCode}</TableCell>
                          <TableCell>{formatAmount(bill.amount / 1e18)} ETH</TableCell>
                          <TableCell>
                            <Chip
                              label={BILL_STATUS[bill.status]}
                              color={BILL_STATUS_COLORS[bill.status]}
                              size="small"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No bills found for your account.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      )}

      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Quick Actions
            </Typography>
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Basic Actions */}
              <Typography variant="subtitle2" color="text.secondary">Basic Actions</Typography>
              <Button variant="outlined" startIcon={<Refresh />} onClick={handleRefresh} fullWidth>
                Refresh Data
              </Button>
              <Button 
                variant="outlined" 
                onClick={() => navigator.clipboard?.writeText(account)}
                fullWidth
              >
                Copy Account Address
              </Button>
              <Button variant="text" href="/guide" fullWidth>
                View User Guide
              </Button>
              <Box sx={{ my: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">Role-Specific Actions</Typography>
              </Box>

              {userInfo.isHospital && (
                <Button
                  variant="contained"
                  startIcon={<LocalHospital />}
                  href="/hospital"
                  fullWidth
                >
                  Submit Medical Bill
                </Button>
              )}
              {userInfo.isGovernment && (
                <Button
                  variant="contained"
                  startIcon={<AccountBalance />}
                  href="/government"
                  fullWidth
                >
                  Government Portal
                </Button>
              )}
              {userInfo.isReimbursementAdmin && (
                <Button
                  variant="contained"
                  startIcon={<MonetizationOn />}
                  href="/reimbursement"
                  fullWidth
                >
                  Process Reimbursements
                </Button>
              )}
              {!userInfo.isHospital && !userInfo.isGovernment && !userInfo.isReimbursementAdmin && userInfo.hasInsurance && (
                <Alert severity="info">
                  Your medical bills will be automatically processed for reimbursement when submitted by hospitals.
                </Alert>
              )}
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    {/* Row 2: Insurance + Account */}
    <Grid container spacing={4} alignItems="stretch" justifyContent="center">
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
              Insurance Coverage Details
            </Typography>
            {userInfo.hasInsurance ? (
              <Box>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  Plan ID: {userInfo.planInfo.planId}
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Deductible</Typography>
                    <Typography variant="body1">{formatAmount(userInfo.planInfo.plan.deductible)} ETH</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Co-pay</Typography>
                    <Typography variant="body1">{(userInfo.planInfo.plan.copayBps / 100).toFixed(2)}%</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Coverage Limit</Typography>
                    <Typography variant="body1">{formatAmount(userInfo.planInfo.plan.coverageLimit)} ETH</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Used Amount</Typography>
                    <Typography variant="body1">{formatAmount(userInfo.totalPaid)} ETH</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2" color="text.secondary">Remaining</Typography>
                    <Typography variant="body1">{formatAmount(
                      Math.max(0, parseFloat(userInfo.planInfo.plan.coverageLimit) - parseFloat(userInfo.totalPaid))
                    )} ETH</Typography>
                  </Grid>
                </Grid>
              </Box>
            ) : (
              <Alert severity="info">
                No insurance coverage registered. Contact government admin to register.
              </Alert>
            )}
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} md={6}>
        <Card sx={{ height: '100%' }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Account Information
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row" align="right">
                        <strong>Account Address</strong>
                      </TableCell>
                      <TableCell align="left">
                        <Typography variant="body2" fontFamily="monospace">
                          {account}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row" align="right">
                        <strong>Insurance Status</strong>
                      </TableCell>
                      <TableCell align="left">
                        <Chip 
                          label={userInfo.hasInsurance ? "Registered" : "Not Registered"} 
                          color={userInfo.hasInsurance ? "success" : "default"}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                    {userInfo.hasInsurance && (
                      <>
                        <TableRow>
                          <TableCell component="th" scope="row" align="right">
                            <strong>Total Reimbursed</strong>
                          </TableCell>
                          <TableCell align="left">
                            {formatAmount(userInfo.totalPaid)} ETH
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row" align="right">
                            <strong>Coverage Remaining</strong>
                          </TableCell>
                          <TableCell align="left">
                            {formatAmount(
                              Math.max(0, parseFloat(userInfo.planInfo.plan.coverageLimit) - parseFloat(userInfo.totalPaid))
                            )} ETH
                          </TableCell>
                        </TableRow>
                      </>
                    )}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
    </Container>
  );
};

export default Dashboard;