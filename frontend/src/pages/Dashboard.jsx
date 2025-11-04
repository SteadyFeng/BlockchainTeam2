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
  Refresh
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
  const { isConnected, account, updateBalances } = useWeb3();
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
    <Box sx={{ width: '100%', px: { xs: 2, md: 4, lg: 6, xl: 8 }, mt: 3, mb: 6 }}>
      {/* Header */}
      <Box 
        display="flex" 
        justifyContent="space-between" 
        alignItems="center" 
        mb={4}
        sx={{
          background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)',
          color: 'white',
          p: 4,
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(25,118,210,0.3)',
        }}
      >
        <Box>
          <Typography variant="h3" component="h1" sx={{ fontWeight: 700, mb: 1 }}>
            Dashboard
          </Typography>
          <Typography variant="h6" sx={{ opacity: 0.9, fontWeight: 400 }}>
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

      {/* User Roles */}
      <Grid container spacing={4} mb={5}>
        <Grid item xs={12}>
          <Card sx={{ background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)' }}>
            <CardContent sx={{ p: 4 }}>
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

    {/* Citizen Bills */}
    {(!userInfo.isGovernment && !userInfo.isHospital && !userInfo.isReimbursementAdmin) && (
      <Grid container spacing={3} mt={1}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
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
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bill ID</TableCell>
                        <TableCell>Service Code</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {citizenBills.map((bill) => (
                        <TableRow key={bill.id} hover>
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
      </Grid>
    )}

    {/* Insurance Information */}
    <Grid container spacing={4} mb={5}>
        <Grid item xs={12} lg={8}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
                Insurance Coverage Details
              </Typography>
              {userInfo.hasInsurance ? (
                <Box>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Plan ID: {userInfo.planInfo.planId}
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Deductible:</strong> {formatAmount(userInfo.planInfo.plan.deductible)} ETH
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Co-pay:</strong> {(userInfo.planInfo.plan.copayBps / 100).toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Coverage Limit:</strong> {formatAmount(userInfo.planInfo.plan.coverageLimit)} ETH
                  </Typography>
                  <Typography variant="body2" gutterBottom>
                    <strong>Used Amount:</strong> {formatAmount(userInfo.totalPaid)} ETH
                  </Typography>
                  <Typography variant="body2">
                    <strong>Remaining:</strong> {formatAmount(
                      Math.max(0, parseFloat(userInfo.planInfo.plan.coverageLimit) - parseFloat(userInfo.totalPaid))
                    )} ETH
                  </Typography>
                </Box>
              ) : (
                <Alert severity="info">
                  No insurance coverage registered. Contact government admin to register.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={4}>
          <Card sx={{ height: '100%', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <CardContent sx={{ p: 4 }}>
              <Typography variant="h5" gutterBottom sx={{ color: 'white', fontWeight: 600, mb: 3 }}>
                Quick Actions
              </Typography>
              <Box display="flex" flexDirection="column" gap={3}>
                {userInfo.isHospital && (
                  <Button
                    variant="contained"
                    startIcon={<LocalHospital />}
                    href="/hospital"
                  >
                    Submit Medical Bill
                  </Button>
                )}
                {userInfo.isGovernment && (
                  <Button
                    variant="contained"
                    startIcon={<AccountBalance />}
                    href="/government"
                  >
                    Government Portal
                  </Button>
                )}
                {userInfo.isReimbursementAdmin && (
                  <Button
                    variant="contained"
                    startIcon={<MonetizationOn />}
                    href="/reimbursement"
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

      {/* Account Information */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Account Information
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table size="small">
                  <TableBody>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Account Address</strong>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace">
                          {account}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell component="th" scope="row">
                        <strong>Insurance Status</strong>
                      </TableCell>
                      <TableCell>
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
                          <TableCell component="th" scope="row">
                            <strong>Total Reimbursed</strong>
                          </TableCell>
                          <TableCell>
                            {formatAmount(userInfo.totalPaid)} ETH
                          </TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell component="th" scope="row">
                            <strong>Coverage Remaining</strong>
                          </TableCell>
                          <TableCell>
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
    </Box>
  );
};

export default Dashboard;