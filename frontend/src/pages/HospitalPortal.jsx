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
  DialogActions
} from '@mui/material';
import { LocalHospital, Send, Visibility } from '@mui/icons-material';
import { useWeb3 } from '../contexts/Web3Context';
import { 
  submitBill, 
  getBill, 
  hasRole, 
  generateDocHash, 
  formatAddress, 
  formatAmount,
  listenToEvents 
} from '../utils/web3';
import { ROLES, BILL_STATUS, BILL_STATUS_COLORS } from '../utils/contracts';

const HospitalPortal = () => {
  const { isConnected, account, updateBalances } = useWeb3();
  const [isHospital, setIsHospital] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [bills, setBills] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // 表单数据
  const [formData, setFormData] = useState({
    citizenAddress: '',
    serviceCode: '',
    amount: '',
    description: ''
  });

  // 检查用户权限
  const checkPermissions = async () => {
    if (!isConnected || !account) return;

    try {
      setLoading(true);
      const hospitalRole = await hasRole('HOSPITAL_BILL', ROLES.HOSPITAL_ROLE, account);
      setIsHospital(hospitalRole);
    } catch (err) {
      console.error('Error checking permissions:', err);
      setError('Failed to check permissions');
    } finally {
      setLoading(false);
    }
  };

  // 提交账单
  const handleSubmitBill = async (e) => {
    e.preventDefault();
    
    if (!formData.citizenAddress || !formData.serviceCode || !formData.amount || !formData.description) {
      setError('Please fill in all fields');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // 生成文档哈希
      const docHash = generateDocHash(
        `${formData.citizenAddress}-${formData.serviceCode}-${formData.amount}-${formData.description}`
      );

      // 提交账单
      const tx = await submitBill(
        formData.citizenAddress,
        parseInt(formData.serviceCode),
        parseFloat(formData.amount),
        docHash
      );

      setSuccess(`Bill submitted successfully! Transaction hash: ${tx.transactionHash}`);
      
      // 重置表单
      setFormData({
        citizenAddress: '',
        serviceCode: '',
        amount: '',
        description: ''
      });

      // 刷新余额
      await updateBalances();

    } catch (err) {
      console.error('Error submitting bill:', err);
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // 查看账单详情
  const handleViewBill = async (billId) => {
    try {
      const billData = await getBill(billId);
      setSelectedBill({ id: billId, ...billData });
      setDialogOpen(true);
    } catch (err) {
      console.error('Error fetching bill:', err);
      setError('Failed to fetch bill details');
    }
  };

  // 表单输入处理
  const handleInputChange = (field) => (event) => {
    setFormData({
      ...formData,
      [field]: event.target.value
    });
  };

  useEffect(() => {
    checkPermissions();
  }, [isConnected, account]);

  // 监听账单提交事件
  useEffect(() => {
    if (!isConnected) return;

    const cleanup = listenToEvents('HOSPITAL_BILL', 'BillSubmitted', (billId, citizen, amount) => {
      console.log('New bill submitted:', { billId: billId.toString(), citizen, amount: amount.toString() });
      // 这里可以更新账单列表
    });

    return cleanup;
  }, [isConnected]);

  if (!isConnected) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to access the hospital portal.
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

  if (!isHospital) {
    return (
      <Container maxWidth="md" sx={{ mt: 4 }}>
        <Alert severity="error">
          Access denied. You need hospital role to access this portal.
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ width: '100%', px: { xs: 2, md: 4, lg: 6, xl: 8 }, mt: 4, mb: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <LocalHospital sx={{ mr: 2, fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h4" component="h1">
          Hospital Portal
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
        {/* Submit Bill Form */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Submit Medical Bill
              </Typography>
              
              <Box component="form" onSubmit={handleSubmitBill}>
                <TextField
                  fullWidth
                  label="Patient Address"
                  placeholder="0x..."
                  value={formData.citizenAddress}
                  onChange={handleInputChange('citizenAddress')}
                  margin="normal"
                  required
                  helperText="Enter the patient's Ethereum address"
                />
                
                <TextField
                  fullWidth
                  label="Service Code"
                  type="number"
                  value={formData.serviceCode}
                  onChange={handleInputChange('serviceCode')}
                  margin="normal"
                  required
                  helperText="Medical service code (e.g., 1001 for consultation)"
                />
                
                <TextField
                  fullWidth
                  label="Amount (ETH)"
                  type="number"
                  step="0.001"
                  value={formData.amount}
                  onChange={handleInputChange('amount')}
                  margin="normal"
                  required
                  helperText="Treatment cost in ETH"
                />
                
                <TextField
                  fullWidth
                  label="Treatment Description"
                  multiline
                  rows={3}
                  value={formData.description}
                  onChange={handleInputChange('description')}
                  margin="normal"
                  required
                  helperText="Detailed description of the medical treatment"
                />
                
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  startIcon={submitting ? <CircularProgress size={20} /> : <Send />}
                  disabled={submitting}
                  sx={{ mt: 2 }}
                  fullWidth
                >
                  {submitting ? 'Submitting...' : 'Submit Bill'}
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Recent Bills */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Bills
              </Typography>
              
              {bills.length > 0 ? (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Bill ID</TableCell>
                        <TableCell>Patient</TableCell>
                        <TableCell>Amount</TableCell>
                        <TableCell>Status</TableCell>
                        <TableCell>Action</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bills.map((bill) => (
                        <TableRow key={bill.id}>
                          <TableCell>#{bill.id}</TableCell>
                          <TableCell>{formatAddress(bill.citizen)}</TableCell>
                          <TableCell>{formatAmount(bill.amount)} ETH</TableCell>
                          <TableCell>
                            <Chip
                              label={BILL_STATUS[bill.status]}
                              color={BILL_STATUS_COLORS[bill.status]}
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Button
                              size="small"
                              startIcon={<Visibility />}
                              onClick={() => handleViewBill(bill.id)}
                            >
                              View
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Alert severity="info">
                  No bills submitted yet. Use the form to submit your first medical bill.
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Instructions */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Instructions
              </Typography>
              <Typography variant="body2" paragraph>
                As a hospital staff member, you can submit medical bills for patients who have received treatment. 
                Make sure to:
              </Typography>
              <ul>
                <li>
                  <Typography variant="body2">
                    Enter the correct patient Ethereum address
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Use appropriate service codes for different types of treatments
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Enter accurate treatment costs in ETH
                  </Typography>
                </li>
                <li>
                  <Typography variant="body2">
                    Provide detailed treatment descriptions for transparency
                  </Typography>
                </li>
              </ul>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Bill Details Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Bill Details</DialogTitle>
        <DialogContent>
          {selectedBill && (
            <Box>
              <Typography variant="body2" gutterBottom>
                <strong>Bill ID:</strong> #{selectedBill.id}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Patient:</strong> {selectedBill.citizen}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Service Code:</strong> {selectedBill.serviceCode?.toString()}
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Amount:</strong> {formatAmount(selectedBill.amount)} ETH
              </Typography>
              <Typography variant="body2" gutterBottom>
                <strong>Status:</strong> 
                <Chip
                  label={BILL_STATUS[selectedBill.status]}
                  color={BILL_STATUS_COLORS[selectedBill.status]}
                  size="small"
                  sx={{ ml: 1 }}
                />
              </Typography>
              <Typography variant="body2">
                <strong>Document Hash:</strong> {selectedBill.docHash}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HospitalPortal;