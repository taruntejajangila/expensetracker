import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import LoanService from '../services/loanService';
import { logger } from '../utils/logger';

const router = express.Router();
const loanService = LoanService.getInstance();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/loans - Get all loans for the authenticated user
router.get('/', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Fetching loans for user: ${userId}`);
    
    const loans = await loanService.getUserLoans(userId);
    
    logger.info(`Loans fetched successfully for user: ${userId}, count: ${loans.length}`);
    
    return res.json({
      success: true,
      data: loans,
      message: 'Loans retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching loans:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch loans',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/loans/:id - Get a specific loan by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const loanId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!loanId) {
      return res.status(400).json({ success: false, message: 'Loan ID is required' });
    }

    logger.info(`Fetching loan: ${loanId} for user: ${userId}`);
    
    const loan = await loanService.getLoanById(loanId, userId);
    
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    
    logger.info(`Loan fetched successfully: ${loanId}`);
    
    return res.json({
      success: true,
      data: loan,
      message: 'Loan retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch loan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// POST /api/loans - Create a new loan
router.post('/', [
  body('name').notEmpty().withMessage('Loan name is required'),
  body('loanType').isIn(['Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other']).withMessage('Invalid loan type'),
  body('amount').isFloat({ min: 0.01, max: 1000000000 }).withMessage('Principal amount must be between ₹0.01 and ₹1,000,000,000 (1 Billion)'),
  body('interestRate').isFloat({ min: 0, max: 50 }).withMessage('Interest rate must be between 0 and 50 (percentage)'),
  body('termMonths').isInt({ min: 1 }).withMessage('Loan term must be at least 1 month'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('lender').optional().isString().withMessage('Lender name must be a string'),
  body('accountNumber').optional().isString().withMessage('Account number must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Creating loan for user: ${userId}`);
    
    const loanData = {
      ...req.body,
      startDate: new Date(req.body.startDate),
      interestRate: req.body.interestRate // Keep as percentage to avoid rounding issues
    };
    
    const loan = await loanService.createLoan(userId, loanData);
    
    logger.info(`Loan created successfully: ${loan.id} for user: ${userId}`);
    
    return res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan created successfully'
    });
  } catch (error) {
    logger.error('Error creating loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create loan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// PUT /api/loans/:id - Update a loan
router.put('/:id', [
  body('name').optional().notEmpty().withMessage('Loan name cannot be empty'),
  body('loanType').optional().isIn(['Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other']).withMessage('Invalid loan type'),
  body('amount').optional().isFloat({ min: 0.01, max: 1000000000 }).withMessage('Principal amount must be between ₹0.01 and ₹1,000,000,000 (1 Billion)'),
  body('interestRate').optional().isFloat({ min: 0, max: 50 }).withMessage('Interest rate must be between 0 and 50 (percentage)'),
  body('termMonths').optional().isInt({ min: 1 }).withMessage('Loan term must be at least 1 month'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date'),
  body('status').optional().isIn(['active', 'paid_off', 'defaulted', 'refinanced']).withMessage('Invalid status'),
  body('lender').optional().isString().withMessage('Lender name must be a string'),
  body('accountNumber').optional().isString().withMessage('Account number must be a string'),
  body('notes').optional().isString().withMessage('Notes must be a string')
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user?.id;
    const loanId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!loanId) {
      return res.status(400).json({ success: false, message: 'Loan ID is required' });
    }

    logger.info(`Updating loan: ${loanId} for user: ${userId}`);
    
    const updateData = {
      ...req.body,
      ...(req.body.startDate && { startDate: new Date(req.body.startDate) })
    };
    
    const loan = await loanService.updateLoan(loanId, userId, updateData);
    
    if (!loan) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    
    logger.info(`Loan updated successfully: ${loanId}`);
    
    return res.json({
      success: true,
      data: loan,
      message: 'Loan updated successfully'
    });
  } catch (error) {
    logger.error('Error updating loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update loan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// DELETE /api/loans/:id - Delete a loan
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.user?.id;
    const loanId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!loanId) {
      return res.status(400).json({ success: false, message: 'Loan ID is required' });
    }

    logger.info(`Deleting loan: ${loanId} for user: ${userId}`);
    
    const deleted = await loanService.deleteLoan(loanId, userId);
    
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Loan not found' });
    }
    
    logger.info(`Loan deleted successfully: ${loanId}`);
    
    return res.json({
      success: true,
      message: 'Loan deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting loan:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete loan',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/loans/:id/amortization - Get loan amortization schedule
router.get('/:id/amortization', async (req, res) => {
  try {
    const userId = req.user?.id;
    const loanId = req.params.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!loanId) {
      return res.status(400).json({ success: false, message: 'Loan ID is required' });
    }

    logger.info(`Fetching amortization schedule for loan: ${loanId}`);
    
    const schedule = await loanService.getLoanAmortization(loanId, userId);
    
    if (schedule.length === 0) {
      return res.status(404).json({ success: false, message: 'Loan not found or no schedule available' });
    }
    
    logger.info(`Amortization schedule fetched successfully for loan: ${loanId}`);
    
    return res.json({
      success: true,
      data: schedule,
      message: 'Amortization schedule retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching amortization schedule:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch amortization schedule',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
