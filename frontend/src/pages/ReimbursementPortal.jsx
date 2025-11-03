import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
  MonetizationOn, 
  PlayArrow, 
  Visibility, 
  ExpandMore,
  CheckCircle,
  Cancel,
  Pending
} from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  processReimbursement, 
  rejectReimbursement,
  getBill, 
  getBillsByStatus,
  getAllBills,
  getBillsDetails,
  getPlanOf, 
  getTotalPaid,
  hasRole, 
  formatAddress, 
  formatAmount,
  listenToEvents 
} from '../utils/web3';
import { ROLES, BILL_STATUS, BILL_STATUS_COLORS } from '../utils/contracts';

const ReimbursementPortal = () => {
  const { isConnected, account, updateBalances } = useWeb3();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  
  // 表单和状态
  const [billId, setBillId] = useState('');
  const [billDetails, setBillDetails] = useState(null);
  const [citizenInfo, setCitizenInfo] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [reimbursementHistory, setReimbursementHistory] = useState([]);
  
  // 新增：所有账单列表
  const [allBills, setAllBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);

  // 新增：拒绝报销相关状态
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  // 检查用户权限
  const checkPermissions = async () => {
    if (!isConnected || !account) return;

    try {
      setLoading(true);
      const adminRole = await hasRole('REIMBURSEMENT', ROLES.DEFAULT_ADMIN_ROLE, account);
      setIsAdmin(adminRole);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Failed to check permissions');
    } finally {
      setLoading(false);
    }
  };

  // 获取所有账单列表
  const fetchAllBills = async () => {
    try {
      setLoadingBills(true);
      setError(null);
      
      // 获取所有账单ID列表
      const allBillIds = await getAllBills();
      
      if (allBillIds.length === 0) {
        setAllBills([]);
        return;
      }
      
      // 获取账单详情
      const billsDetails = await getBillsDetails(allBillIds);
      setAllBills(billsDetails);
      
    } catch (err) {
      console.error('Error fetching all bills:', err);
      setError('Failed to load bills');
      setAllBills([]);
    } finally {
      setLoadingBills(false);
    }
  };

  // 获取账单详情和公民信息
  const fetchBillDetails = async (id) => {
    try {
      setError(null);
      const bill = await getBill(parseInt(id));
      setBillDetails({ id: parseInt(id), ...bill });

      // 获取公民保险信息
      try {
        const planInfo = await getPlanOf(bill.citizen);
        const totalPaid = await getTotalPaid(bill.citizen);
        setCitizenInfo({
          address: bill.citizen,
          planId: planInfo.planId,
          plan: planInfo.plan,
          totalPaid
        });
      } catch (err) {
        setCitizenInfo(null);
        console.warn('Citizen not registered for insurance:', err);
      }
    } catch (err) {
      console.error('Error fetching bill details:', err);
      setError('Bill not found');
      setBillDetails(null);
      setCitizenInfo(null);
    }
  };

  // 处理报销
  const handleProcessReimbursement = async () => {
    if (!billDetails) return;

    // 检查账单状态，防止重复处理
    if (billDetails.status !== 0) {
      setError('This bill has already been processed and cannot be processed again.');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const tx = await processReimbursement(billDetails.id);
      setSuccess(`Reimbursement processed successfully! Transaction hash: ${tx.transactionHash}`);
      
      // 刷新账单详情、余额和待处理账单列表
      await fetchBillDetails(billDetails.id.toString());
      await updateBalances();
      await fetchAllBills(); // 刷新账单列表
      
    } catch (err) {
      console.error('Error processing reimbursement:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // 处理拒绝报销
  const handleRejectReimbursement = async () => {
    if (!billDetails || !rejectReason.trim()) return;

    // 检查账单状态，防止重复处理
    if (billDetails.status !== 0) {
      setError('This bill has already been processed and cannot be rejected again.');
      setRejectDialogOpen(false);
      setRejectReason('');
      return;
    }

    try {
      setProcessing(true);
      setError(null);

      const tx = await rejectReimbursement(billDetails.id, rejectReason);
      setSuccess(`Reimbursement rejected successfully! Transaction hash: ${tx.transactionHash}`);
      
      // 关闭拒绝对话框并清空原因
      setRejectDialogOpen(false);
      setRejectReason('');
      
      // 刷新账单详情、余额和待处理账单列表
      await fetchBillDetails(billDetails.id.toString());
      await updateBalances();
      await fetchAllBills(); // 刷新账单列表
      
    } catch (err) {
      console.error('Error rejecting reimbursement:', err);
      setError(err.message);
    } finally {
      setProcessing(false);
    }
  };

  // 从待处理账单列表中选择账单
  const handleSelectBill = async (bill) => {
    setBillId(bill.id);
    setBillDetails(bill);
    
    // 获取公民保险信息
    try {
      const planInfo = await getPlanOf(bill.citizen);
      const totalPaid = await getTotalPaid(bill.citizen);
      setCitizenInfo({
        address: bill.citizen,
        planId: planInfo.planId,
        plan: planInfo.plan,
        totalPaid
      });
    } catch (err) {
      setCitizenInfo(null);
      console.warn('Citizen not registered for insurance:', err);
    }
  };

  // 计算预期报销金额
  const calculateExpectedPayout = () => {
    if (!billDetails || !citizenInfo) return { eligible: 0, payout: 0, reason: '' };

    const billAmount = parseFloat(billDetails.amount) / 1e18; // Convert from Wei
    const deductible = parseFloat(citizenInfo.plan.deductible);
    const copayBps = parseInt(citizenInfo.plan.copayBps);
    const coverageLimit = parseFloat(citizenInfo.plan.coverageLimit);
    const totalPaid = parseFloat(citizenInfo.totalPaid);

    // Check if bill is eligible
    if (billDetails.status !== 0) {
      return { eligible: 0, payout: 0, reason: `Bill status is ${BILL_STATUS[billDetails.status]}` };
    }

    if (coverageLimit === 0) {
      return { eligible: 0, payout: 0, reason: 'Citizen not registered for insurance' };
    }

    if (totalPaid >= coverageLimit) {
      return { eligible: 0, payout: 0, reason: 'Coverage limit exhausted' };
    }

    // Calculate eligible amount
    let eligible = Math.max(0, billAmount - deductible);
    
    if (eligible === 0) {
      return { eligible: 0, payout: 0, reason: 'Amount below deductible' };
    }

    // Calculate payout after copay
    let payout = (eligible * (10000 - copayBps)) / 10000;

    // Check against remaining coverage
    const remainingCoverage = coverageLimit - totalPaid;
    if (payout > remainingCoverage) {
      payout = remainingCoverage;
    }

    if (payout <= 0) {
      return { eligible: eligible, payout: 0, reason: 'Calculated payout is 0' };
    }

    return { eligible, payout, reason: '' };
  };

  const expectedPayout = calculateExpectedPayout();

  useEffect(() => {
    checkPermissions();
    if (isConnected && isAdmin) {
      fetchAllBills();
    }
  }, [isConnected, account, isAdmin]);

  // 监听报销事件和账单状态变化
  useEffect(() => {
    if (!isConnected) return;

    const cleanupReimbursed = listenToEvents('REIMBURSEMENT', 'Reimbursed', (billId, citizen, payout) => {
      console.log('Reimbursement processed:', { 
        billId: billId.toString(), 
        citizen, 
        payout: payout.toString() 
      });
      
      setReimbursementHistory(prev => [...prev, {
        billId: billId.toString(),
        citizen,
        payout: formatAmount(payout.toString() / 1e18),
        timestamp: new Date().toLocaleString(),
        status: 'Reimbursed'
      }]);

      // 刷新账单列表和当前账单详情
      fetchAllBills();
      if (billDetails && billDetails.id.toString() === billId.toString()) {
        fetchBillDetails(billId.toString());
      }
    });

    const cleanupRejected = listenToEvents('REIMBURSEMENT', 'Rejected', (billId, citizen, reason) => {
      console.log('Reimbursement rejected:', { 
        billId: billId.toString(), 
        citizen, 
        reason 
      });
      
      setReimbursementHistory(prev => [...prev, {
        billId: billId.toString(),
        citizen,
        reason,
        timestamp: new Date().toLocaleString(),
        status: 'Rejected'
      }]);

      // 刷新账单列表和当前账单详情
      fetchAllBills();
      if (billDetails && billDetails.id.toString() === billId.toString()) {
        fetchBillDetails(billId.toString());
      }
    });

    // 监听账单状态变化事件
    const cleanupBillStatusChanged = listenToEvents('HOSPITAL_BILL', 'BillStatusChanged', (billId, newStatus) => {
      console.log('Bill status changed:', { 
        billId: billId.toString(), 
        newStatus: newStatus.toString() 
      });
      
      // 刷新账单列表
      fetchAllBills();
      
      // 如果当前显示的账单状态发生变化，刷新账单详情
      if (billDetails && billDetails.id.toString() === billId.toString()) {
        fetchBillDetails(billId.toString());
      }
    });

    return () => {
      cleanupReimbursed();
      cleanupRejected();
      cleanupBillStatusChanged();
    };
  }, [isConnected, billDetails, fetchAllBills, fetchBillDetails]);

  if (!isConnected) {
    return (
      <Box sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="warning">
          Please connect your wallet to access the reimbursement portal.
        </Alert>
      </Box>
    );
  }

  if (loading) {
    return (
      <Box sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (!isAdmin) {
    return (
      <Box sx={{ mt: 4, px: { xs: 2, sm: 3, md: 4 } }}>
        <Alert severity="error">
          Access denied. You need reimbursement admin role to access this portal.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4, lg: 6, xl: 8 }, mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <MonetizationOn sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Reimbursement Portal
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

      <Grid container spacing={3}>
        {/* Pending Bills List */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Bills for Reimbursement
                </Typography>
                <Button
                  variant="outlined"
                  onClick={fetchAllBills}
                  disabled={loadingBills}
                  startIcon={loadingBills ? <CircularProgress size={20} /> : null}
                >
                  {loadingBills ? 'Loading...' : 'Refresh'}
                </Button>
              </Box>
              
              {loadingBills ? (
                <Box display="flex" justifyContent="center" p={3}>
                  <CircularProgress />
                </Box>
              ) : allBills.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Bill ID</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Service Code</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allBills.map((bill) => (
                        <TableRow 
                          key={bill.id}
                          hover
                          sx={{ cursor: 'pointer' }}
                          onClick={() => handleSelectBill(bill)}
                        >
                          <TableCell>#{bill.id}</TableCell>
                          <TableCell>{formatAddress(bill.citizen)}</TableCell>
                          <TableCell>{bill.serviceCode}</TableCell>
                          <TableCell>{formatAmount(bill.amount / 1e18)} ETH</TableCell>
                          <TableCell>
                            <Chip
                              label={BILL_STATUS[bill.status]}
                              color={BILL_STATUS_COLORS[bill.status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {bill.status === 0 ? (
                              <Button
                                variant="contained"
                                size="small"
                                startIcon={<Visibility />}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleSelectBill(bill);
                                }}
                              >
                                Select
                              </Button>
                            ) : (
                              <Chip
                                label={bill.status === 1 ? "Processed" : "Rejected"}
                                color={bill.status === 1 ? "success" : "error"}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No bills found. No bills have been submitted yet.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Bill Lookup */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Process Reimbursement
              </Typography>
              
              <TextField
                fullWidth
                label="Bill ID"
                type="number"
                value={billId}
                onChange={(e) => setBillId(e.target.value)}
                margin="normal"
                helperText="Enter the bill ID to process reimbursement"
              />
              
              <Button
                variant="outlined"
                onClick={() => fetchBillDetails(billId)}
                disabled={!billId}
                sx={{ mt: 2, mb: 2 }}
                fullWidth
              >
                Lookup Bill
              </Button>

              {/* Bill Details */}
              {billDetails && (
                <Card variant="outlined" sx={{ mt: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle1" gutterBottom>
                      Bill Details
                    </Typography>
                    
                    <Typography variant="body2" gutterBottom>
                      <strong>Bill ID:</strong> #{billDetails.id}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Patient:</strong> {formatAddress(billDetails.citizen)}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Service Code:</strong> {billDetails.serviceCode?.toString()}
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Amount:</strong> {formatAmount(billDetails.amount / 1e18)} ETH
                    </Typography>
                    <Typography variant="body2" gutterBottom>
                      <strong>Status:</strong>
                      <Chip
                        label={BILL_STATUS[billDetails.status]}
                        color={BILL_STATUS_COLORS[billDetails.status]}
                        size="small"
                        sx={{ ml: 1 }}
                      />
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Process and Reject Buttons */}
              {billDetails && (
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  {billDetails.status === 0 ? (
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        size="large"
                        startIcon={processing ? <CircularProgress size={20} /> : <PlayArrow />}
                        onClick={handleProcessReimbursement}
                        disabled={processing}
                        sx={{ flex: 1 }}
                      >
                        {processing ? 'Processing...' : 'Process Reimbursement'}
                      </Button>
                      
                      <Button
                        variant="outlined"
                        color="error"
                        size="large"
                        startIcon={<Cancel />}
                        onClick={() => setRejectDialogOpen(true)}
                        disabled={processing}
                        sx={{ flex: 1 }}
                      >
                        Reject Bill
                      </Button>
                    </>
                  ) : (
                    <Alert severity="info" sx={{ width: '100%' }}>
                      This bill has already been processed and cannot be processed again. 
                      Status: {BILL_STATUS[billDetails.status]}
                    </Alert>
                  )}
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Reimbursement Calculation */}
        <Grid item xs={12} md={6}>
          {citizenInfo && billDetails && (
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Reimbursement Calculation
                </Typography>
                
                <Accordion>
                  <AccordionSummary expandIcon={<ExpandMore />}>
                    <Typography variant="subtitle1">Insurance Plan Details</Typography>
                  </AccordionSummary>
                  <AccordionDetails>
                    <Table size="small">
                      <TableBody>
                        <TableRow>
                          <TableCell><strong>Plan ID</strong></TableCell>
                          <TableCell>{citizenInfo.planId}</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Deductible</strong></TableCell>
                          <TableCell>{formatAmount(citizenInfo.plan.deductible)} ETH</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Co-pay</strong></TableCell>
                          <TableCell>{(citizenInfo.plan.copayBps / 100).toFixed(2)}%</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Coverage Limit</strong></TableCell>
                          <TableCell>{formatAmount(citizenInfo.plan.coverageLimit)} ETH</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Used Coverage</strong></TableCell>
                          <TableCell>{formatAmount(citizenInfo.totalPaid)} ETH</TableCell>
                        </TableRow>
                        <TableRow>
                          <TableCell><strong>Remaining</strong></TableCell>
                          <TableCell>
                            {formatAmount(
                              Math.max(0, parseFloat(citizenInfo.plan.coverageLimit) - parseFloat(citizenInfo.totalPaid))
                            )} ETH
                          </TableCell>
                        </TableRow>
                      </TableBody>
                    </Table>
                  </AccordionDetails>
                </Accordion>

                <Box mt={2}>
                  <Typography variant="subtitle1" gutterBottom>
                    Calculation Result
                  </Typography>
                  
                  {expectedPayout.reason ? (
                    <Alert severity="warning">
                      <Typography variant="body2">
                        <strong>Reason:</strong> {expectedPayout.reason}
                      </Typography>
                    </Alert>
                  ) : (
                    <Box>
                      <Typography variant="body2" gutterBottom>
                        <strong>Bill Amount:</strong> {formatAmount(billDetails.amount / 1e18)} ETH
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>After Deductible:</strong> {formatAmount(expectedPayout.eligible)} ETH
                      </Typography>
                      <Typography variant="body2" gutterBottom>
                        <strong>Expected Payout:</strong> {formatAmount(expectedPayout.payout)} ETH
                      </Typography>
                      <Chip
                        icon={<CheckCircle />}
                        label="Eligible for Reimbursement"
                        color="success"
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          )}
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Reimbursement Activity
              </Typography>
              
              {reimbursementHistory.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Timestamp</TableCell>
                        <TableCell>Bill ID</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Amount/Reason</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reimbursementHistory.slice(-10).reverse().map((item, index) => (
                        <TableRow key={index}>
                          <TableCell>{item.timestamp}</TableCell>
                          <TableCell>#{item.billId}</TableCell>
                          <TableCell>{formatAddress(item.citizen)}</TableCell>
                          <TableCell>
                            <Chip
                              icon={item.status === 'Reimbursed' ? <CheckCircle /> : <Cancel />}
                              label={item.status}
                              color={item.status === 'Reimbursed' ? 'success' : 'error'}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {item.status === 'Reimbursed' 
                              ? `${item.payout} ETH` 
                              : item.reason
                            }
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No recent reimbursement activity. Process some reimbursements to see activity here.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Reject Reimbursement Dialog */}
      <Dialog 
        open={rejectDialogOpen} 
        onClose={() => setRejectDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Reject Reimbursement</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this reimbursement request:
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            label="Rejection Reason"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setRejectDialogOpen(false);
              setRejectReason('');
            }}
            disabled={processing}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleRejectReimbursement}
            variant="contained"
            color="error"
            disabled={processing || !rejectReason.trim()}
            startIcon={processing ? <CircularProgress size={20} /> : <Cancel />}
          >
            {processing ? 'Rejecting...' : 'Reject Bill'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReimbursementPortal;