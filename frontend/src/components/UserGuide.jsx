import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  Stepper,
  Step,
  StepLabel,
  StepContent,
  Alert,
  Chip,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import {
  AccountBalance,
  LocalHospital,
  MonetizationOn,
  Person,
  CheckCircle,
  ExpandMore
} from '@mui/icons-material';

const UserGuide = () => {
  const steps = [
    {
      label: 'Connect Your Wallet',
      description: 'Connect your MetaMask wallet to access the system',
      icon: <Person />,
      details: [
        'Install MetaMask browser extension if not already installed',
        'Click "Connect Wallet" button in the navigation bar',
        'Approve the connection request in MetaMask',
        'Your wallet address and balance will be displayed'
      ]
    },
    {
      label: 'Role Assignment',
      description: 'Get assigned appropriate roles by system administrators',
      icon: <AccountBalance />,
      details: [
        'Government admins can assign roles to users',
        'Hospital role allows submitting medical bills',
        'Government role allows managing insurance plans and citizens',
        'Reimbursement admin role allows processing claims'
      ]
    },
    {
      label: 'Insurance Registration',
      description: 'Citizens must be registered for insurance coverage',
      icon: <CheckCircle />,
      details: [
        'Government admins register citizens with insurance plans',
        'Each plan has specific deductibles, co-pays, and coverage limits',
        'Citizens can check their coverage status in the dashboard',
        'Registration is required before any reimbursements can be processed'
      ]
    },
    {
      label: 'Medical Bill Submission',
      description: 'Hospitals submit bills for patient treatments',
      icon: <LocalHospital />,
      details: [
        'Hospital staff access the Hospital Portal',
        'Enter patient address, service code, amount, and description',
        'Bills are recorded on the blockchain with document hash',
        'Bills start with "Submitted" status'
      ]
    },
    {
      label: 'Reimbursement Processing',
      description: 'Admins process reimbursements automatically',
      icon: <MonetizationOn />,
      details: [
        'Reimbursement admins access the Reimbursement Portal',
        'Enter bill ID to lookup and review details',
        'System automatically calculates eligible reimbursement amount',
        'GovStable tokens are minted and sent to patients upon approval'
      ]
    }
  ];

  const roleGuide = [
    {
      role: 'Citizen',
      description: 'Regular users who receive medical treatment',
      permissions: ['View dashboard', 'Check insurance status', 'Receive reimbursements'],
      color: 'default'
    },
    {
      role: 'Hospital Staff',
      description: 'Medical providers who submit bills',
      permissions: ['Submit medical bills', 'View bill status', 'Access hospital portal'],
      color: 'secondary'
    },
    {
      role: 'Government Admin',
      description: 'Officials who manage the insurance system',
      permissions: ['Create insurance plans', 'Register citizens', 'Assign roles', 'View all data'],
      color: 'primary'
    },
    {
      role: 'Reimbursement Admin',
      description: 'Administrators who process claims',
      permissions: ['Process reimbursements', 'View calculation details', 'Approve/reject claims'],
      color: 'success'
    }
  ];

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Medical Insurance System - User Guide
      </Typography>

      {/* Introduction */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            System Overview
          </Typography>
          <Typography variant="body1" paragraph>
            This is a blockchain-based medical insurance system that provides transparent, 
            automated reimbursement processing for healthcare expenses. The system uses smart 
            contracts to ensure fair and efficient processing of medical claims.
          </Typography>
          <Alert severity="info">
            <Typography variant="body2">
              Make sure you have MetaMask installed and are connected to the correct network 
              where the contracts are deployed.
            </Typography>
          </Alert>
        </CardContent>
      </Card>

      {/* User Roles */}
      <Card sx={{ mb: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            User Roles
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={2} mb={2}>
            {roleGuide.map((role) => (
              <Accordion key={role.role} sx={{ minWidth: '300px' }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Chip 
                      label={role.role} 
                      color={role.color} 
                      size="small" 
                    />
                    <Typography variant="body1">{role.description}</Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  <Typography variant="body2" gutterBottom>
                    <strong>Permissions:</strong>
                  </Typography>
                  <List dense>
                    {role.permissions.map((permission, index) => (
                      <ListItem key={index} sx={{ py: 0 }}>
                        <ListItemIcon sx={{ minWidth: 20 }}>
                          <CheckCircle sx={{ fontSize: 16, color: 'success.main' }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={permission} 
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </CardContent>
      </Card>

      {/* Step-by-Step Guide */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Step-by-Step Process
          </Typography>
          
          <Stepper orientation="vertical">
            {steps.map((step, index) => (
              <Step key={step.label} active>
                <StepLabel
                  StepIconComponent={() => (
                    <Box 
                      display="flex" 
                      alignItems="center" 
                      justifyContent="center"
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        bgcolor: 'primary.main',
                        color: 'white'
                      }}
                    >
                      {step.icon}
                    </Box>
                  )}
                >
                  <Typography variant="h6">{step.label}</Typography>
                </StepLabel>
                <StepContent>
                  <Typography variant="body1" paragraph>
                    {step.description}
                  </Typography>
                  <List>
                    {step.details.map((detail, detailIndex) => (
                      <ListItem key={detailIndex}>
                        <ListItemIcon>
                          <CheckCircle sx={{ color: 'success.main', fontSize: 20 }} />
                        </ListItemIcon>
                        <ListItemText 
                          primary={detail}
                          primaryTypographyProps={{ variant: 'body2' }}
                        />
                      </ListItem>
                    ))}
                  </List>
                </StepContent>
              </Step>
            ))}
          </Stepper>
        </CardContent>
      </Card>

      {/* Technical Details */}
      <Card sx={{ mt: 4 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Technical Information
          </Typography>
          
          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Smart Contracts</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                The system consists of four main smart contracts:
              </Typography>
              <List>
                <ListItem>
                  <ListItemText 
                    primary="GovStable Token" 
                    secondary="ERC20 token used for reimbursement payments"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Hospital Bill Contract" 
                    secondary="Manages medical bill submissions and status"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Insurance Registry" 
                    secondary="Stores insurance plans and citizen registrations"
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Reimbursement Contract" 
                    secondary="Processes claims and calculates payouts"
                  />
                </ListItem>
              </List>
            </AccordionDetails>
          </Accordion>

          <Accordion>
            <AccordionSummary expandIcon={<ExpandMore />}>
              <Typography variant="subtitle1">Reimbursement Calculation</Typography>
            </AccordionSummary>
            <AccordionDetails>
              <Typography variant="body2" paragraph>
                Reimbursement amounts are calculated using the following formula:
              </Typography>
              <Box component="pre" sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.875rem',
                overflow: 'auto'
              }}>
{`1. Eligible Amount = Bill Amount - Deductible
2. Payout = Eligible Amount × (100% - Co-pay %)
3. Final Payout = Min(Payout, Remaining Coverage)`}
              </Box>
            </AccordionDetails>
          </Accordion>
        </CardContent>
      </Card>
    </Container>
  );
};

export default UserGuide;