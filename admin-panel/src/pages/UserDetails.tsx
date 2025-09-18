import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  Alert,
  CircularProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tabs,
  Tab
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Email as EmailIcon,
  CalendarToday as CalendarIcon,
  TrendingUp as TrendingUpIcon,
  AccountBalance as AccountIcon,
  TrendingDown as TrendingDownIcon,
  CheckCircle as ActiveIcon,
  Cancel as InactiveIcon
} from '@mui/icons-material';
import { userAPI } from '../services/api';
import { format } from 'date-fns';

interface User {
  id: number;
  name: string;
  email: string;
  isActive: boolean;
  isAdmin: boolean;
  createdAt: string;
  lastLoginAt: string;
  avatar: string;
}

interface Expense {
  id: number;
  amount: number;
  description: string;
  date: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

interface Income {
  id: number;
  amount: number;
  source: string;
  description: string;
  date: string;
}

interface Budget {
  id: number;
  amount: number;
  period: string;
  startDate: string;
  endDate: string;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

interface UserCategory {
  id: number;
  category: {
    name: string;
    color: string;
    icon: string;
  };
}

interface UserDetailsData {
  user: User;
  statistics: {
    totalExpenses: number;
    totalIncome: number;
    netBalance: number;
    expenseCount: number;
    incomeCount: number;
    budgetCount: number;
    categoryCount: number;
  };
  expenses: Expense[];
  income: Income[];
  budgets: Budget[];
  userCategories: UserCategory[];
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [userDetails, setUserDetails] = useState<UserDetailsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    type: 'expense' | 'income' | 'budget' | null;
    data: any;
  }>({ open: false, type: null, data: null });
  const [deleteDialog, setDeleteDialog] = useState<{
    open: boolean;
    type: 'expense' | 'income' | 'budget' | null;
    data: any;
  }>({ open: false, type: null, data: null });

  const fetchUserDetails = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await userAPI.getById(parseInt(id!));

      setUserDetails(response.data);
    } catch (err: any) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.error || 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchUserDetails();
    }
  }, [id, fetchUserDetails]);

  const handleEdit = (type: 'expense' | 'income' | 'budget', data: any) => {
    setEditDialog({ open: true, type, data });
  };

  const handleDelete = (type: 'expense' | 'income' | 'budget', data: any) => {
    setDeleteDialog({ open: true, type, data });
  };

  const handleEditSave = async () => {
    if (!editDialog.data || !editDialog.type) return;

    try {
      const { type, data } = editDialog;
      let response;

      switch (type) {
        case 'expense':
          response = await userAPI.updateExpense(parseInt(id!), data.id, {
            amount: data.amount,
            description: data.description,
            date: data.date,
            categoryId: data.categoryId
          });
          break;
        case 'income':
          response = await userAPI.updateIncome(parseInt(id!), data.id, {
            amount: data.amount,
            source: data.source,
            description: data.description,
            date: data.date
          });
          break;
        case 'budget':
          response = await userAPI.updateBudget(parseInt(id!), data.id, {
            amount: data.amount,
            period: data.period,
            startDate: data.startDate,
            endDate: data.endDate,
            categoryId: data.categoryId
          });
          break;
      }

      if (response) {
        setEditDialog({ open: false, type: null, data: null });
        fetchUserDetails(); // Refresh data
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to update item');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteDialog.data || !deleteDialog.type) return;

    try {
      const { type, data } = deleteDialog;
      let response;

      switch (type) {
        case 'expense':
          response = await userAPI.deleteExpense(parseInt(id!), data.id);
          break;
        case 'income':
          response = await userAPI.deleteIncome(parseInt(id!), data.id);
          break;
        case 'budget':
          response = await userAPI.deleteBudget(parseInt(id!), data.id);
          break;
      }

      if (response) {
        setDeleteDialog({ open: false, type: null, data: null });
        fetchUserDetails(); // Refresh data
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to delete item');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !userDetails) {
    return (
      <Box>
        <Alert severity="error">{error || 'User not found'}</Alert>
        <Button onClick={() => navigate('/users')} startIcon={<ArrowBackIcon />}>
          Back to Users
        </Button>
      </Box>
    );
  }

  const { user, statistics } = userDetails;

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <IconButton onClick={() => navigate('/users')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4" gutterBottom>
            {user.name}'s Profile
          </Typography>
          <Typography variant="body1" color="textSecondary">
            User ID: {user.id} • {user.email}
          </Typography>
        </Box>
      </Box>

      {/* User Info Cards */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <PersonIcon color="primary" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">{user.name}</Typography>
                  <Typography variant="body2" color="textSecondary">Name</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingUpIcon color="success" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">${statistics.totalIncome.toFixed(2)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Income</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <TrendingDownIcon color="error" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6">${statistics.totalExpenses.toFixed(2)}</Typography>
                  <Typography variant="body2" color="textSecondary">Total Expenses</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center">
                <AccountIcon color="info" sx={{ mr: 1 }} />
                <Box>
                  <Typography variant="h6" color={statistics.netBalance >= 0 ? 'success.main' : 'error.main'}>
                    ${statistics.netBalance.toFixed(2)}
                  </Typography>
                  <Typography variant="body2" color="textSecondary">Net Balance</Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* User Details */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>User Information</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <EmailIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Email:</strong> {user.email}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Joined:</strong> {format(new Date(user.createdAt), 'PPP')}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              <CalendarIcon sx={{ mr: 1, color: 'text.secondary' }} />
              <Typography variant="body2">
                <strong>Last Login:</strong> {user.lastLoginAt ? format(new Date(user.lastLoginAt), 'PPP') : 'Never'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Box display="flex" alignItems="center" mb={2}>
              {user.isActive ? <ActiveIcon color="success" /> : <InactiveIcon color="error" />}
              <Typography variant="body2" sx={{ ml: 1 }}>
                <strong>Status:</strong> {user.isActive ? 'Active' : 'Inactive'}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Tabs for different data types */}
      <Paper sx={{ width: '100%' }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="user data tabs">
          <Tab label={`Expenses (${statistics.expenseCount})`} />
          <Tab label={`Income (${statistics.incomeCount})`} />
          <Tab label={`Budgets (${statistics.budgetCount})`} />
          <Tab label={`Categories (${statistics.categoryCount})`} />
        </Tabs>

        {/* Expenses Tab */}
        <TabPanel value={tabValue} index={0}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.expenses.map((expense) => (
                  <TableRow key={expense.id}>
                    <TableCell>{format(new Date(expense.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Chip
                        label={expense.category.name}
                        size="small"
                        sx={{ backgroundColor: expense.category.color, color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>{expense.description || 'No description'}</TableCell>
                    <TableCell>${expense.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit('expense', expense)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete('expense', expense)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Income Tab */}
        <TabPanel value={tabValue} index={1}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Source</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.income.map((inc) => (
                  <TableRow key={inc.id}>
                    <TableCell>{format(new Date(inc.date), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{inc.source}</TableCell>
                    <TableCell>{inc.description || 'No description'}</TableCell>
                    <TableCell>${inc.amount.toFixed(2)}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit('income', inc)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete('income', inc)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Budgets Tab */}
        <TabPanel value={tabValue} index={2}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Category</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Period</TableCell>
                  <TableCell>Start Date</TableCell>
                  <TableCell>End Date</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {userDetails.budgets.map((budget) => (
                  <TableRow key={budget.id}>
                    <TableCell>
                      <Chip
                        label={budget.category.name}
                        size="small"
                        sx={{ backgroundColor: budget.category.color, color: 'white' }}
                      />
                    </TableCell>
                    <TableCell>${budget.amount.toFixed(2)}</TableCell>
                    <TableCell>{budget.period}</TableCell>
                    <TableCell>{format(new Date(budget.startDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>{format(new Date(budget.endDate), 'MMM dd, yyyy')}</TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleEdit('budget', budget)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete('budget', budget)}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </TabPanel>

        {/* Categories Tab */}
        <TabPanel value={tabValue} index={3}>
          <Grid container spacing={2}>
            {userDetails.userCategories.map((userCat) => (
              <Grid item xs={12} sm={6} md={4} key={userCat.id}>
                <Card>
                  <CardContent>
                    <Box display="flex" alignItems="center">
                      <Box
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          backgroundColor: userCat.category.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          mr: 2
                        }}
                      >
                        <Typography variant="h6" color="white">
                          {userCat.category.icon}
                        </Typography>
                      </Box>
                      <Typography variant="body1">{userCat.category.name}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>
      </Paper>

      {/* Edit Dialog */}
      <Dialog open={editDialog.open} onClose={() => setEditDialog({ open: false, type: null, data: null })} maxWidth="sm" fullWidth>
        <DialogTitle>Edit {editDialog.type}</DialogTitle>
        <DialogContent>
          {editDialog.type === 'expense' && editDialog.data && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editDialog.data.amount}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, amount: parseFloat(e.target.value) }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={editDialog.data.description || ''}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={editDialog.data.date.split('T')[0]}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, date: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
          {editDialog.type === 'income' && editDialog.data && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editDialog.data.amount}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, amount: parseFloat(e.target.value) }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Source"
                value={editDialog.data.source}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, source: e.target.value }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Description"
                value={editDialog.data.description || ''}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, description: e.target.value }
                }))}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="Date"
                type="date"
                value={editDialog.data.date.split('T')[0]}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, date: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
          {editDialog.type === 'budget' && editDialog.data && (
            <Box sx={{ pt: 2 }}>
              <TextField
                fullWidth
                label="Amount"
                type="number"
                value={editDialog.data.amount}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, amount: parseFloat(e.target.value) }
                }))}
                sx={{ mb: 2 }}
              />
              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel>Period</InputLabel>
                <Select
                  value={editDialog.data.period}
                  label="Period"
                  onChange={(e) => setEditDialog(prev => ({
                    ...prev,
                    data: { ...prev.data, period: e.target.value }
                  }))}
                >
                  <MenuItem value="monthly">Monthly</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="yearly">Yearly</MenuItem>
                </Select>
              </FormControl>
              <TextField
                fullWidth
                label="Start Date"
                type="date"
                value={editDialog.data.startDate.split('T')[0]}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, startDate: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
                sx={{ mb: 2 }}
              />
              <TextField
                fullWidth
                label="End Date"
                type="date"
                value={editDialog.data.endDate.split('T')[0]}
                onChange={(e) => setEditDialog(prev => ({
                  ...prev,
                  data: { ...prev.data, endDate: e.target.value }
                }))}
                InputLabelProps={{ shrink: true }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog({ open: false, type: null, data: null })}>Cancel</Button>
          <Button onClick={handleEditSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, type: null, data: null })}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this {deleteDialog.type}? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, type: null, data: null })}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mt: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
    </Box>
  );
}
