import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();
const pool = getPool();

// Validation middleware
const validateBudgetInput = [
  body('name').notEmpty().withMessage('Budget name is required'),
  body('amount').isNumeric().withMessage('Amount must be a number'),
  body('categoryId').isUUID().withMessage('Category ID must be a valid UUID'),
  body('period').isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly'),
  body('startDate').isISO8601().withMessage('Start date must be a valid date'),
  body('endDate').isISO8601().withMessage('End date must be a valid date'),
];

const validateBudgetUpdate = [
  body('name').optional().notEmpty().withMessage('Budget name cannot be empty if provided'),
  body('amount').optional().isNumeric().withMessage('Amount must be a number if provided'),
  body('categoryId').optional().isUUID().withMessage('Category ID must be a valid UUID if provided'),
  body('period').optional().isIn(['monthly', 'yearly']).withMessage('Period must be monthly or yearly if provided'),
  body('startDate').optional().isISO8601().withMessage('Start date must be a valid date if provided'),
  body('endDate').optional().isISO8601().withMessage('End date must be a valid date if provided'),
];

// GET /api/budgets - Get user budgets
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        b.id, b.name, b.amount, b.spent, b.period, 
        b.start_date, b.end_date, b.status, b.created_at, b.updated_at,
        b.category_id, c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1 
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    
    logger.info(`Retrieved ${result.rows.length} budgets for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Budgets retrieved successfully',
      data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        amount: parseFloat(row.amount),
        spent: parseFloat(row.spent),
        category: row.category_name || 'Uncategorized',
        categoryId: row.category_id,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    });
  } catch (error: any) {
    logger.error('Error getting budgets:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budgets',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/budgets/:id - Get specific budget
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    
    const query = `
      SELECT 
        id, name, amount, spent, category, period, 
        start_date, end_date, status, created_at, updated_at
      FROM budgets 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [budgetId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    const budget = result.rows[0];
    
    res.json({
      success: true,
      message: 'Budget retrieved successfully',
      data: {
        id: budget.id,
        name: budget.name,
        amount: parseFloat(budget.amount),
        spent: parseFloat(budget.spent),
        category: budget.category,
        period: budget.period,
        startDate: budget.start_date,
        endDate: budget.end_date,
        status: budget.status,
        createdAt: budget.created_at,
        updatedAt: budget.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error getting budget by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/budgets - Create new budget
router.post('/', authenticateToken, validateBudgetInput, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const { name, amount, categoryId, period, startDate, endDate } = req.body;
    
    const query = `
      INSERT INTO budgets (
        user_id, name, amount, spent, category_id, period, 
        start_date, end_date, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, name, amount, spent, category_id, period, 
                start_date, end_date, status, created_at, updated_at
    `;
    
    const values = [
      userId, name, amount, 0, categoryId, period, startDate, endDate, 'on-track'
    ];
    
    const result = await pool.query(query, values);
    const newBudget = result.rows[0];
    
    logger.info(`Created budget ${newBudget.id} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Budget created successfully',
      data: {
        id: newBudget.id,
        name: newBudget.name,
        amount: parseFloat(newBudget.amount),
        spent: parseFloat(newBudget.spent),
        category: newBudget.category_id,
        period: newBudget.period,
        startDate: newBudget.start_date,
        endDate: newBudget.end_date,
        status: newBudget.status,
        createdAt: newBudget.created_at,
        updatedAt: newBudget.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error creating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/budgets/:id - Update budget
router.put('/:id', authenticateToken, validateBudgetUpdate, async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { name, amount, categoryId, period, startDate, endDate } = req.body;
    
    // Check if budget exists and belongs to user
    const checkQuery = 'SELECT * FROM budgets WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [budgetId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    const existingBudget = checkResult.rows[0];
    
    // Use provided values or fall back to existing values
    const updateName = name || existingBudget.name;
    const updateAmount = amount !== undefined ? amount : existingBudget.amount;
    const updateCategoryId = categoryId || existingBudget.category_id;
    const updatePeriod = period || existingBudget.period;
    const updateStartDate = startDate || existingBudget.start_date;
    const updateEndDate = endDate || existingBudget.end_date;
    
    const query = `
      UPDATE budgets 
      SET name = $1, amount = $2, category_id = $3, period = $4, 
          start_date = $5, end_date = $6, updated_at = NOW()
      WHERE id = $7 AND user_id = $8
      RETURNING id, name, amount, spent, category_id, period, 
                start_date, end_date, status, created_at, updated_at
    `;
    
    const values = [updateName, updateAmount, updateCategoryId, updatePeriod, updateStartDate, updateEndDate, budgetId, userId];
    
    const result = await pool.query(query, values);
    const updatedBudget = result.rows[0];
    
    logger.info(`Updated budget ${budgetId} for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: {
        id: updatedBudget.id,
        name: updatedBudget.name,
        amount: parseFloat(updatedBudget.amount),
        spent: parseFloat(updatedBudget.spent),
        category: updatedBudget.category_id,
        period: updatedBudget.period,
        startDate: updatedBudget.start_date,
        endDate: updatedBudget.end_date,
        status: updatedBudget.status,
        createdAt: updatedBudget.created_at,
        updatedAt: updatedBudget.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error updating budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/budgets/:id - Delete budget
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    
    // Check if budget exists and belongs to user
    const checkQuery = 'SELECT id FROM budgets WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [budgetId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    const query = 'DELETE FROM budgets WHERE id = $1 AND user_id = $2';
    await pool.query(query, [budgetId, userId]);
    
    logger.info(`Deleted budget ${budgetId} for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Budget deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting budget:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete budget',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/budgets/:id/spent - Update budget spent amount
router.put('/:id/spent', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const budgetId = req.params.id;
    const { spent } = req.body;
    
    if (typeof spent !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Spent amount must be a number'
      });
    }
    
    // Check if budget exists and belongs to user
    const checkQuery = 'SELECT id, amount FROM budgets WHERE id = $1 AND user_id = $2';
    const checkResult = await pool.query(checkQuery, [budgetId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Budget not found'
      });
    }
    
    const budget = checkResult.rows[0];
    const status = spent > budget.amount ? 'over-budget' : 
                  spent === budget.amount ? 'on-track' : 'under-budget';
    
    const query = `
      UPDATE budgets 
      SET spent = $1, status = $2, updated_at = NOW()
      WHERE id = $3 AND user_id = $4
      RETURNING id, name, amount, spent, category_id, period, 
                start_date, end_date, status, created_at, updated_at
    `;
    
    const result = await pool.query(query, [spent, status, budgetId, userId]);
    const updatedBudget = result.rows[0];
    
    logger.info(`Updated budget ${budgetId} spent amount to ${spent} for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Budget spent amount updated successfully',
      data: {
        id: updatedBudget.id,
        name: updatedBudget.name,
        amount: parseFloat(updatedBudget.amount),
        spent: parseFloat(updatedBudget.spent),
        category: updatedBudget.category_id,
        period: updatedBudget.period,
        startDate: updatedBudget.start_date,
        endDate: updatedBudget.end_date,
        status: updatedBudget.status,
        createdAt: updatedBudget.created_at,
        updatedAt: updatedBudget.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error updating budget spent amount:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update budget spent amount',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Temporary test endpoint (remove in production)
router.get('/test/sync', async (req: any, res: any) => {
  try {
    console.log('🧪 Test endpoint called - fetching budgets for user 060bb3ac-b695-4f46-a543-f728cb2ee733');
    
    const query = `
      SELECT 
        b.id, b.name, b.amount, b.spent, b.period, 
        b.start_date, b.end_date, b.status, b.created_at, b.updated_at,
        c.name as category_name, c.icon as category_icon, c.color as category_color
      FROM budgets b
      LEFT JOIN categories c ON b.category_id = c.id
      WHERE b.user_id = $1 
      ORDER BY b.created_at DESC
    `;
    
    const result = await pool.query(query, ['060bb3ac-b695-4f46-a543-f728cb2ee733']);
    
    logger.info(`Test endpoint: Retrieved ${result.rows.length} budgets`);
    
    res.json({
      success: true,
      message: 'Test endpoint - budgets retrieved successfully',
      data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.name,
        amount: parseFloat(row.amount),
        spent: parseFloat(row.spent),
        category: row.category_name || 'Uncategorized',
        categoryId: row.category_id,
        period: row.period,
        startDate: row.start_date,
        endDate: row.end_date,
        status: row.status,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    });
  } catch (error: any) {
    logger.error('Test endpoint error:', error);
    res.status(500).json({
      success: false,
      message: 'Test endpoint failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

export default router;
