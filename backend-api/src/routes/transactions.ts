import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  return next();
};

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/transactions - Get all transactions for authenticated user
router.get('/', 
  [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100'),
    query('type').optional().isIn(['income', 'expense']).withMessage('Type must be income or expense'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('startDate').optional().isISO8601().withMessage('Start date must be valid ISO date'),
    query('endDate').optional().isISO8601().withMessage('End date must be valid ISO date')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { page = 1, limit = 20, type, category, startDate, endDate } = req.query;

      // logger.info(`Fetching transactions for user: ${userId}`);

      // Query database for user's transactions
      const query = `
        SELECT 
          t.id,
          t.amount,
          t.type,
          t.description,
          t.date,
          t.created_at,
          t.tags,
          t.from_account,
          t.to_account,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor,
          fa.account_name as from_account_name,
          fa.bank_name as from_bank_name,
          fa.account_number as from_account_number,
          ta.account_name as to_account_name,
          ta.bank_name as to_bank_name,
          ta.account_number as to_account_number
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN bank_accounts fa ON t.from_account::uuid = fa.id
        LEFT JOIN bank_accounts ta ON t.to_account::uuid = ta.id
        WHERE t.user_id = $1
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      const offset = (parseInt(page as string) - 1) * parseInt(limit as string);
      const result = await req.app.locals.db.query(query, [userId, limit, offset]);
      
      // Get total count for pagination
      const countQuery = `
        SELECT COUNT(*) as total
        FROM transactions t
        WHERE t.user_id = $1
      `;
      const countResult = await req.app.locals.db.query(countQuery, [userId]);
      const total = parseInt(countResult.rows[0].total);

      // Map transactions with bank account information
      const mappedTransactions = result.rows.map((row: any) => ({
        ...row,
        fromAccount: row.from_account ? {
          id: row.from_account,
          name: row.from_account_name,
          bankName: row.from_bank_name,
          accountNumber: row.from_account_number
        } : null,
        toAccount: row.to_account ? {
          id: row.to_account,
          name: row.to_account_name,
          bankName: row.to_bank_name,
          accountNumber: row.to_account_number
        } : null
      }));

      return res.json({
        success: true,
        data: {
          transactions: mappedTransactions,
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total,
            totalPages: Math.ceil(total / parseInt(limit as string))
          }
        }
      });
    } catch (error) {
      logger.error('Error fetching transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// POST /api/transactions - Create new transaction
router.post('/',
  [
    body('amount').isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('type').isIn(['income', 'expense', 'transfer']).withMessage('Type must be income, expense, or transfer'),
    body('category').isString().trim().notEmpty().withMessage('Category is required'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('date').isISO8601().withMessage('Valid date required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { amount, type, category, description, date } = req.body;

      logger.info(`Creating transaction for user: ${userId}`);

      // Get category ID from category name
      const categoryQuery = `
        SELECT id FROM categories 
        WHERE name = $1 AND is_active = true
        ORDER BY is_default DESC, sort_order ASC
        LIMIT 1
      `;
      const categoryResult = await req.app.locals.db.query(categoryQuery, [category]);
      
      if (categoryResult.rows.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid category'
        });
      }
      
      const categoryId = categoryResult.rows[0].id;

      // Insert transaction into database with account information
      const insertQuery = `
        INSERT INTO transactions (user_id, amount, type, category_id, description, date, to_account, from_account, tags, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, amount, type, description, date, to_account, from_account, tags, created_at
      `;
      
      const insertResult = await req.app.locals.db.query(insertQuery, [
        userId,
        parseFloat(amount),
        type,
        categoryId,
        description || '',
        new Date(date),
        req.body.toAccount || null,
        req.body.fromAccount || null,
        req.body.tags || []
      ]);

      const newTransaction = insertResult.rows[0];

      // Update account balance(s) based on transaction type
      if (type === 'transfer') {
        // For transfers, update both from and to accounts
        if (req.body.fromAccount && req.body.toAccount) {
          // Deduct from source account (should be a bank account for credit card bill payments)
          const updateFromQuery = `
            UPDATE bank_accounts 
            SET balance = balance - $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
          `;
          await req.app.locals.db.query(updateFromQuery, [parseFloat(amount), req.body.fromAccount, userId]);
          
          // Check if destination account is a credit card
          const creditCardCheckQuery = `
            SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true
          `;
          const creditCardCheck = await req.app.locals.db.query(creditCardCheckQuery, [req.body.toAccount, userId]);
          
          if (creditCardCheck.rows.length > 0) {
            // Destination is a credit card - reduce the balance (payment reduces debt)
            // Note: Credit card balance represents debt, so reducing balance means paying off debt
            const updateCreditQuery = `
              UPDATE credit_cards 
              SET balance = balance - $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateCreditQuery, [parseFloat(amount), req.body.toAccount, userId]);
          } else {
            // Destination is a bank account
            const updateToQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateToQuery, [parseFloat(amount), req.body.toAccount, userId]);
          }
        }
      } else if (req.body.toAccount || req.body.fromAccount) {
        // For income/expense, update single account
        const accountId = req.body.toAccount || req.body.fromAccount;
        const isIncome = type === 'income';
        const balanceChange = isIncome ? parseFloat(amount) : -parseFloat(amount);
        
        if (accountId === 'cash-wallet') {
          // Update cash wallet balance
          const updateCashQuery = `
            UPDATE bank_accounts 
            SET balance = balance + $1, updated_at = NOW()
            WHERE user_id = $2 AND account_type = 'wallet'
          `;
          await req.app.locals.db.query(updateCashQuery, [balanceChange, userId]);
        } else if (accountId.startsWith('credit-')) {
          // Update credit card balance (if frontend still sends with prefix)
          const creditCardId = accountId.replace('credit-', '');
          // For credit cards, balance represents debt, so:
          // - Income: reduce debt (subtract amount)
          // - Expense: increase debt (add amount)
          const creditCardBalanceChange = isIncome ? -parseFloat(amount) : parseFloat(amount);
          const updateCreditQuery = `
            UPDATE credit_cards 
            SET balance = balance + $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
          `;
          await req.app.locals.db.query(updateCreditQuery, [creditCardBalanceChange, creditCardId, userId]);
        } else {
          // Check if this account ID exists in credit_cards table (frontend removed prefix)
          const creditCardCheckQuery = `
            SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true
          `;
          const creditCardCheck = await req.app.locals.db.query(creditCardCheckQuery, [accountId, userId]);
          
          if (creditCardCheck.rows.length > 0) {
            // This is a credit card (frontend removed the prefix)
            // For credit cards, balance represents debt, so:
            // - Income: reduce debt (subtract amount)
            // - Expense: increase debt (add amount)
            const creditCardBalanceChange = isIncome ? -parseFloat(amount) : parseFloat(amount);
            const updateCreditQuery = `
              UPDATE credit_cards 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateCreditQuery, [creditCardBalanceChange, accountId, userId]);
          } else {
            // This is a regular bank account
            const updateBankQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateBankQuery, [balanceChange, accountId, userId]);
          }
        }
      }

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: newTransaction
      });
    } catch (error) {
      logger.error('Error creating transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to create transaction',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// GET /api/transactions/recent - Get recent transactions for authenticated user
router.get('/recent',
  [
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be 1-100')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { limit = 10 } = req.query;

      logger.info(`Fetching recent transactions for user: ${userId}`);

      // Query database for user's recent transactions
      const query = `
        SELECT 
          t.id,
          t.amount,
          t.type,
          t.description,
          t.date,
          t.created_at,
          t.tags,
          t.from_account,
          t.to_account,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor,
          fa.account_name as from_account_name,
          fa.bank_name as from_bank_name,
          fa.account_number as from_account_number,
          ta.account_name as to_account_name,
          ta.bank_name as to_bank_name,
          ta.account_number as to_account_number
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN bank_accounts fa ON t.from_account::uuid = fa.id
        LEFT JOIN bank_accounts ta ON t.to_account::uuid = ta.id
        WHERE t.user_id = $1
        ORDER BY t.date DESC, t.created_at DESC
        LIMIT $2
      `;
      
      const result = await req.app.locals.db.query(query, [userId, limit]);

      // Map transactions with bank account information
      const mappedTransactions = result.rows.map((row: any) => ({
        ...row,
        fromAccount: row.from_account ? {
          id: row.from_account,
          name: row.from_account_name,
          bankName: row.from_bank_name,
          accountNumber: row.from_account_number
        } : null,
        toAccount: row.to_account ? {
          id: row.to_account,
          name: row.to_account_name,
          bankName: row.to_bank_name,
          accountNumber: row.to_account_number
        } : null
      }));

      return res.json({
        success: true,
        data: mappedTransactions,
        message: 'Recent transactions retrieved successfully'
      });
    } catch (error) {
      logger.error('Error fetching recent transactions:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch recent transactions',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// GET /api/transactions/:id - Get specific transaction
router.get('/:id',
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      logger.info(`Fetching transaction ${id} for user: ${userId}`);

      // Query database for specific transaction
      const query = `
        SELECT 
          t.id,
          t.amount,
          t.type,
          t.description,
          t.date,
          t.created_at,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        WHERE t.id = $1 AND t.user_id = $2
      `;
      
      const result = await req.app.locals.db.query(query, [id, userId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      return res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('Error fetching transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch transaction',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// PUT /api/transactions/:id - Update transaction
router.put('/:id',
  [
    body('amount').optional().isFloat({ min: 0.01 }).withMessage('Amount must be a positive number'),
    body('type').optional().isIn(['income', 'expense', 'transfer']).withMessage('Type must be income, expense, or transfer'),
    body('category').optional().isString().trim().notEmpty().withMessage('Category cannot be empty'),
    body('description').optional().isString().trim().isLength({ max: 500 }).withMessage('Description too long'),
    body('date').optional().isISO8601().withMessage('Valid date required')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const updates = req.body;

      logger.info(`Updating transaction ${id} for user: ${userId}`);

      // Check if transaction exists and belongs to user
      const checkQuery = 'SELECT id FROM transactions WHERE id = $1 AND user_id = $2';
      const checkResult = await req.app.locals.db.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      // Build update query dynamically
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      let paramCount = 1;

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${++paramCount}`);
        updateValues.push(parseFloat(updates.amount));
      }
      if (updates.type !== undefined) {
        updateFields.push(`type = $${++paramCount}`);
        updateValues.push(updates.type);
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${++paramCount}`);
        updateValues.push(updates.description);
      }
      if (updates.date !== undefined) {
        updateFields.push(`date = $${++paramCount}`);
        updateValues.push(new Date(updates.date));
      }

      if (updateFields.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      updateFields.push(`updated_at = NOW()`);
      updateValues.unshift(id, userId);

      const updateQuery = `
        UPDATE transactions 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, amount, type, description, date, updated_at
      `;

      const updateResult = await req.app.locals.db.query(updateQuery, updateValues);
      
      return res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: updateResult.rows[0]
      });
    } catch (error) {
      logger.error('Error updating transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to update transaction',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// DELETE /api/transactions/:id - Delete transaction
router.delete('/:id',
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;

      logger.info(`Deleting transaction ${id} for user: ${userId}`);

      // Check if transaction exists and belongs to user
      const checkQuery = 'SELECT id, amount, type, description, to_account, from_account FROM transactions WHERE id = $1 AND user_id = $2';
      const checkResult = await req.app.locals.db.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = checkResult.rows[0];
      const { amount, type, to_account, from_account } = transaction;

      // Reverse the account balance changes before deleting the transaction
      // For income transactions, we need to subtract the amount from the to_account
      // For expense transactions, we need to add the amount back to the from_account
      const balanceChange = type === 'income' ? -parseFloat(amount) : parseFloat(amount);
      const accountToUpdate = type === 'income' ? to_account : from_account;

      if (accountToUpdate) {
        if (accountToUpdate === 'cash-wallet') {
          // Update cash wallet balance
          const updateCashQuery = `
            UPDATE bank_accounts 
            SET balance = balance + $1, updated_at = NOW()
            WHERE user_id = $2 AND account_type = 'wallet'
          `;
          await req.app.locals.db.query(updateCashQuery, [balanceChange, userId]);
        } else if (accountToUpdate.startsWith('credit-')) {
          // Update credit card balance (if still has prefix)
          const creditCardId = accountToUpdate.replace('credit-', '');
          const updateCreditQuery = `
            UPDATE credit_cards 
            SET balance = balance + $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
          `;
          await req.app.locals.db.query(updateCreditQuery, [balanceChange, creditCardId, userId]);
        } else {
          // Check if this account ID exists in credit_cards table
          const creditCardCheckQuery = `
            SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true
          `;
          const creditCardCheck = await req.app.locals.db.query(creditCardCheckQuery, [accountToUpdate, userId]);
          
          if (creditCardCheck.rows.length > 0) {
            // This is a credit card
            const updateCreditQuery = `
              UPDATE credit_cards 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateCreditQuery, [balanceChange, accountToUpdate, userId]);
          } else {
            // This is a regular bank account
            const updateBankQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateBankQuery, [balanceChange, accountToUpdate, userId]);
          }
        }
      }

      // Delete the transaction
      const deleteQuery = 'DELETE FROM transactions WHERE id = $1 AND user_id = $2';
      await req.app.locals.db.query(deleteQuery, [id, userId]);

      return res.json({
        success: true,
        message: 'Transaction deleted successfully'
      });
    } catch (error) {
      logger.error('Error deleting transaction:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to delete transaction',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

// GET /api/transactions/analytics/summary - Get spending summary
router.get('/analytics/summary',
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { startDate, endDate } = req.query;

      logger.info(`Fetching analytics summary for user: ${userId}`);

      // TODO: Implement actual analytics calculation
      // For now, return mock data
      const mockSummary = {
        totalIncome: 5000.00,
        totalExpenses: 3200.00,
        netAmount: 1800.00,
        topCategories: [
          { category: 'Food & Dining', amount: 800.00, percentage: 25 },
          { category: 'Transportation', amount: 600.00, percentage: 18.75 }
        ],
        period: {
          startDate: startDate || new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
          endDate: endDate || new Date().toISOString()
        }
      };

      return res.json({
        success: true,
        data: mockSummary
      });
    } catch (error) {
      logger.error('Error fetching analytics summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch analytics summary',
        error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
      });
    }
  }
);

export default router;
