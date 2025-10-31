import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip
} from '@mui/material';
import { AccountBalance, PersonAdd, Assignment, Settings } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  registerCitizen, 
  setPlan, 
  getPlanOf, 
  getTotalPaid,
  hasRole, 
  formatAddress, 
  formatAmount 
} from '../utils/web3';
import { ROLES, CONTRACT_ADDRESSES } from '../utils/contracts';

// Tab Panel Component
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const GovernmentPortal = () => {
  const { isConnected, account } = useWeb3();
  const [isGovernment, setIsGovernment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [tabValue, setTabValue] = useState(0);

  // 注册公民表单
  const [citizenForm, setCitizenForm] = useState({
    address: '',
    planId: ''
  });

  // 创建保险计划表单
  const [planForm, setPlanForm] = useState({
    planId: '',
    copayBps: '',
    deductible: '',
    coverageLimit: ''
  });

  // 查询表单
  const [queryForm, setQueryForm] = useState({
    citizenAddress: ''
  });

  const [citizenInfo, setCitizenInfo] = useState(null);

  // 检查用户权限
  const checkPermissions = async () => {
    if (!isConnected || !account) return;

    try {
      setLoading(true);
      console.log('🔍 正在检查政府权限...');
      console.log('当前账户:', account);
      console.log('GOV_ROLE:', ROLES.GOV_ROLE);
      console.log('合约地址:', CONTRACT_ADDRESSES.INSURANCE_REGISTRY);
      
      const govRole = await hasRole('INSURANCE_REGISTRY', ROLES.GOV_ROLE, account);
      console.log('权限检查结果:', govRole);
      
      setIsGovernment(govRole);
      
      if (!govRole) {
        console.error('❌ 权限验证失败');
        setError(`Access denied. Account ${account.slice(0,8)}... does not have government role.`);
      } else {
        console.log('✅ 权限验证成功');
        setError(null);
      }
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError(`Permission check failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // 注册公民
  const handleRegisterCitizen = async (e) => {
    e.preventDefault();
    
    if (!citizenForm.address || !citizenForm.planId) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const tx = await registerCitizen(citizenForm.address, parseInt(citizenForm.planId));
      setSuccess(`Citizen registered successfully! Transaction hash: ${tx.transactionHash}`);
      
      setCitizenForm({ address: '', planId: '' });
    } catch (err) {
      console.error('Error registering citizen:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 创建保险计划
  const handleCreatePlan = async (e) => {
    e.preventDefault();
    
    if (!planForm.planId || !planForm.copayBps || !planForm.deductible || !planForm.coverageLimit) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const tx = await setPlan(
        parseInt(planForm.planId),
        parseInt(planForm.copayBps),
        parseFloat(planForm.deductible),
        parseFloat(planForm.coverageLimit)
      );

      setSuccess(`Insurance plan created successfully! Transaction hash: ${tx.transactionHash}`);
      
      setPlanForm({ planId: '', copayBps: '', deductible: '', coverageLimit: '' });
    } catch (err) {
      console.error('Error creating plan:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 查询公民信息
  const handleQueryCitizen = async (e) => {
    e.preventDefault();
    
    if (!queryForm.citizenAddress) {
      setError('Please enter citizen address');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      const planInfo = await getPlanOf(queryForm.citizenAddress);
      const totalPaid = await getTotalPaid(queryForm.citizenAddress);

      setCitizenInfo({
        address: queryForm.citizenAddress,
        planId: planInfo.planId,
        plan: planInfo.plan,
        totalPaid
      });
    } catch (err) {
      console.error('Error querying citizen:', err);
      setError('Citizen not found or not registered');
      setCitizenInfo(null);
    } finally {
      setSubmitting(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
    setError(null);
    setSuccess(null);
  };

  useEffect(() => {
    checkPermissions();
  }, [isConnected, account]);

  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access the government portal.
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

  if (!isGovernment) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. You need government role to access this portal.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4, lg: 6, xl: 8 }, mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <AccountBalance sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Government Portal
        </Typography>
      </Box>

      {/* Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab icon={<PersonAdd />} label="Register Citizens" />
            <Tab icon={<Settings />} label="Manage Plans" />
            <Tab icon={<Assignment />} label="Query Citizens" />
          </Tabs>
        </Box>

        {/* Register Citizens Tab */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Register Citizen for Insurance
              </Typography>
              
              <Box component="form" onSubmit={handleRegisterCitizen}>
                <TextField
                  fullWidth
                  label="Citizen Address"
                  placeholder="0x..."
                  value={citizenForm.address}
                  onChange={(e) => setCitizenForm({...citizenForm, address: e.target.value})}
                  margin="normal"
                  required
                />
                
                <TextField
                  fullWidth
                  label="Plan ID"
                  type="number"
                  value={citizenForm.planId}
                  onChange={(e) => setCitizenForm({...citizenForm, planId: e.target.value})}
                  margin="normal"
                  required
                  helperText="Enter the insurance plan ID (must exist)"
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {submitting ? 'Registering...' : 'Register Citizen'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Alert severity="info">
                <Typography variant="body2">
                  Register citizens for insurance coverage by providing their Ethereum address and 
                  assigning them to an existing insurance plan.
                </Typography>
              </Alert>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Manage Plans Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Create Insurance Plan
              </Typography>
              
              <Box component="form" onSubmit={handleCreatePlan}>
                <TextField
                  fullWidth
                  label="Plan ID"
                  type="number"
                  value={planForm.planId}
                  onChange={(e) => setPlanForm({...planForm, planId: e.target.value})}
                  margin="normal"
                  required
                  helperText="Unique identifier for the plan"
                />
                
                <TextField
                  fullWidth
                  label="Co-pay Percentage (Basis Points)"
                  type="number"
                  value={planForm.copayBps}
                  onChange={(e) => setPlanForm({...planForm, copayBps: e.target.value})}
                  margin="normal"
                  required
                  helperText="Co-pay in basis points (100 = 1%, 1000 = 10%)"
                />
                
                <TextField
                  fullWidth
                  label="Deductible (ETH)"
                  type="number"
                  step="0.01"
                  value={planForm.deductible}
                  onChange={(e) => setPlanForm({...planForm, deductible: e.target.value})}
                  margin="normal"
                  required
                  helperText="Amount patient pays before insurance coverage"
                />
                
                <TextField
                  fullWidth
                  label="Coverage Limit (ETH)"
                  type="number"
                  step="0.01"
                  value={planForm.coverageLimit}
                  onChange={(e) => setPlanForm({...planForm, coverageLimit: e.target.value})}
                  margin="normal"
                  required
                  helperText="Maximum amount insurance will pay"
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {submitting ? 'Creating...' : 'Create Plan'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Plan Configuration Guide
              </Typography>
              <Alert severity="info">
                <Typography variant="body2" paragraph>
                  <strong>Co-pay:</strong> Percentage patient pays (in basis points)
                </Typography>
                <Typography variant="body2" paragraph>
                  <strong>Deductible:</strong> Amount patient pays before coverage starts
                </Typography>
                <Typography variant="body2">
                  <strong>Coverage Limit:</strong> Maximum total coverage per citizen
                </Typography>
              </Alert>
              
              <Typography variant="subtitle2" sx={{ mt: 2 }} gutterBottom>
                Example Plans:
              </Typography>
              <ul>
                <li><Typography variant="body2">Basic: 2000 bps (20% co-pay), 0.1 ETH deductible, 5 ETH limit</Typography></li>
                <li><Typography variant="body2">Standard: 1000 bps (10% co-pay), 0.05 ETH deductible, 10 ETH limit</Typography></li>
                <li><Typography variant="body2">Premium: 500 bps (5% co-pay), 0.01 ETH deductible, 50 ETH limit</Typography></li>
              </ul>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Query Citizens Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                Query Citizen Information
              </Typography>
              
              <Box component="form" onSubmit={handleQueryCitizen}>
                <TextField
                  fullWidth
                  label="Citizen Address"
                  placeholder="0x..."
                  value={queryForm.citizenAddress}
                  onChange={(e) => setQueryForm({citizenAddress: e.target.value})}
                  margin="normal"
                  required
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={submitting}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {submitting ? 'Querying...' : 'Query Citizen'}
                </Button>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={6}>
              {citizenInfo && (
                <Card variant="outlined">
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      Citizen Information
                    </Typography>
                    
                    <TableContainer>
                      <Table size="small">
                        <TableBody>
                          <TableRow>
                            <TableCell><strong>Address</strong></TableCell>
                            <TableCell>{formatAddress(citizenInfo.address)}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Plan ID</strong></TableCell>
                            <TableCell>{citizenInfo.planId}</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Co-pay</strong></TableCell>
                            <TableCell>{(citizenInfo.plan.copayBps / 100).toFixed(2)}%</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Deductible</strong></TableCell>
                            <TableCell>{formatAmount(citizenInfo.plan.deductible)} ETH</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Coverage Limit</strong></TableCell>
                            <TableCell>{formatAmount(citizenInfo.plan.coverageLimit)} ETH</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Total Paid</strong></TableCell>
                            <TableCell>{formatAmount(citizenInfo.totalPaid)} ETH</TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell><strong>Remaining Coverage</strong></TableCell>
                            <TableCell>
                              {formatAmount(
                                Math.max(0, parseFloat(citizenInfo.plan.coverageLimit) - parseFloat(citizenInfo.totalPaid))
                              )} ETH
                            </TableCell>
                          </TableRow>
                        </TableBody>
                      </Table>
                    </TableContainer>
                  </CardContent>
                </Card>
              )}
            </Grid>
          </Grid>
        </TabPanel>
      </Card>
    </Box>
  );
};

export default GovernmentPortal;