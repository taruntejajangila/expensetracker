import express from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticateToken, optionalAuth } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation middleware
const validateRequest = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.error('Validation failed:', errors.array());
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
          t.transaction_type,
          t.description,
          t.transaction_date,
          t.created_at,
          t.tags,
          t.bank_account_id,
          t.from_account_id,
          t.to_account_id,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor,
          ba.account_name,
          ba.bank_name,
          ba.account_number,
          fa.account_name as from_account_name,
          fa.bank_name as from_bank_name,
          fa.account_number as from_account_number,
          ta.account_name as to_account_name,
          ta.bank_name as to_bank_name,
          ta.account_number as to_account_number
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
        LEFT JOIN bank_accounts fa ON t.from_account_id = fa.id
        LEFT JOIN bank_accounts ta ON t.to_account_id = ta.id
        WHERE t.user_id = $1
        ORDER BY t.transaction_date DESC, t.created_at DESC
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
      const mappedTransactions = result.rows.map((row: any, index) => {
        if (index === 0) {
          console.log('📤 Returning transaction date:', row.transaction_date);
          console.log('📤 Date type:', typeof row.transaction_date);
          if (row.transaction_date) {
            console.log('📤 Date toString:', row.transaction_date.toString());
            console.log('📤 Date toISOString:', row.transaction_date.toISOString?.());
          }
        }
        return {
          ...row,
          type: row.transaction_type,
          date: row.transaction_date,
          bankAccount: row.bank_account_id ? {
            id: row.bank_account_id,
            name: row.account_name,
            bankName: row.bank_name,
            accountNumber: row.account_number
          } : null,
          fromAccount: row.from_account_id ? {
            id: row.from_account_id,
            name: row.from_account_name,
            bankName: row.from_bank_name,
            accountNumber: row.from_account_number
          } : null,
          toAccount: row.to_account_id ? {
            id: row.to_account_id,
            name: row.to_account_name,
            bankName: row.to_bank_name,
            accountNumber: row.to_account_number
          } : null
        };
      });

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
      logger.info(`Date received from frontend: ${date}`);

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

      // Validate account IDs - only accept valid UUIDs or null
      const isValidUUID = (str: string) => {
        if (!str) return false;
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        return uuidRegex.test(str);
      };

      const toAccountId = (req.body.toAccount && isValidUUID(req.body.toAccount)) ? req.body.toAccount : null;
      const fromAccountId = (req.body.fromAccount && isValidUUID(req.body.fromAccount)) ? req.body.fromAccount : null;

      // Insert transaction into database with account information
      const insertQuery = `
        INSERT INTO transactions (user_id, amount, transaction_type, category_id, description, transaction_date, to_account_id, from_account_id, tags, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        RETURNING id, amount, transaction_type, description, transaction_date, to_account_id, from_account_id, tags, created_at
      `;
      
      // Parse the date string - frontend now sends ISO string with timezone
      // Example: "2025-10-27T15:21:47.123Z" (in UTC) or "2025-10-27T15:21:47+05:30" (with offset)
      // The frontend sends the date in the user's local timezone with proper ISO formatting
      let parsedDate: Date;
      if (typeof date === 'string') {
        // Parse the ISO string which includes timezone information
        // JavaScript's Date constructor handles ISO strings with timezone automatically
        parsedDate = new Date(date);
        console.log('🗄️ Backend received date string:', date);
        console.log('🗄️ Backend parsed as Date:', parsedDate.toISOString());
        console.log('🗄️ Backend storing to database:', parsedDate);
      } else {
        parsedDate = new Date(date);
      }
      
      const insertResult = await req.app.locals.db.query(insertQuery, [
        userId,
        parseFloat(amount),
        type,
        categoryId,
        description || '',
        parsedDate,
        toAccountId,
        fromAccountId,
        req.body.tags || []
      ]);

      const newTransaction = insertResult.rows[0];
      
      // Map to expected response format
      const mappedTransaction = {
        ...newTransaction,
        type: newTransaction.transaction_type,
        date: newTransaction.transaction_date,
        fromAccount: newTransaction.from_account_id,
        toAccount: newTransaction.to_account_id
      };

      // Update account balance(s) based on transaction type (only if valid UUIDs)
      if (type === 'transfer') {
        // For transfers, update both from and to accounts
        if (fromAccountId && toAccountId) {
          // Deduct from source account (should be a bank account for credit card bill payments)
          const updateFromQuery = `
            UPDATE bank_accounts 
            SET balance = balance - $1, updated_at = NOW()
            WHERE id = $2 AND user_id = $3
          `;
          await req.app.locals.db.query(updateFromQuery, [parseFloat(amount), fromAccountId, userId]);
          
          // Check if destination account is a credit card
          const creditCardCheckQuery = `
            SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true
          `;
          const creditCardCheck = await req.app.locals.db.query(creditCardCheckQuery, [toAccountId, userId]);
          
          if (creditCardCheck.rows.length > 0) {
            // Destination is a credit card - reduce the balance (payment reduces debt)
            // Note: Credit card balance represents debt, so reducing balance means paying off debt
            const updateCreditQuery = `
              UPDATE credit_cards 
              SET balance = balance - $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateCreditQuery, [parseFloat(amount), toAccountId, userId]);
          } else {
            // Destination is a bank account
            const updateToQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(updateToQuery, [parseFloat(amount), toAccountId, userId]);
          }
        }
      } else if (toAccountId || fromAccountId) {
        // For income/expense, update single account (only if valid UUID)
        const accountId = toAccountId || fromAccountId;
        const isIncome = type === 'income';
        const balanceChange = isIncome ? parseFloat(amount) : -parseFloat(amount);
        
        // Check if this account ID exists in credit_cards table
        const creditCardCheckQuery = `
          SELECT id FROM credit_cards WHERE id = $1 AND user_id = $2 AND is_active = true
        `;
        const creditCardCheck = await req.app.locals.db.query(creditCardCheckQuery, [accountId, userId]);
        
        if (creditCardCheck.rows.length > 0) {
          // This is a credit card
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

      return res.status(201).json({
        success: true,
        message: 'Transaction created successfully',
        data: mappedTransaction
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
          t.transaction_type as type,
          t.description,
          t.transaction_date as date,
          t.created_at,
          t.tags,
          t.bank_account_id,
          t.from_account_id,
          t.to_account_id,
          c.name as category,
          c.icon as categoryIcon,
          c.color as categoryColor,
          ba.account_name,
          ba.bank_name,
          ba.account_number,
          fa.account_name as from_account_name,
          fa.bank_name as from_bank_name,
          fa.account_number as from_account_number,
          ta.account_name as to_account_name,
          ta.bank_name as to_bank_name,
          ta.account_number as to_account_number
        FROM transactions t
        JOIN categories c ON t.category_id = c.id
        LEFT JOIN bank_accounts ba ON t.bank_account_id = ba.id
        LEFT JOIN bank_accounts fa ON t.from_account_id = fa.id
        LEFT JOIN bank_accounts ta ON t.to_account_id = ta.id
        WHERE t.user_id = $1
        ORDER BY t.transaction_date DESC, t.created_at DESC
        LIMIT $2
      `;
      
      const result = await req.app.locals.db.query(query, [userId, limit]);

      // Map transactions with bank account information
      const mappedTransactions = result.rows.map((row: any) => ({
        ...row,
        bankAccount: row.bank_account_id ? {
          id: row.bank_account_id,
          name: row.account_name,
          bankName: row.bank_name,
          accountNumber: row.account_number
        } : null,
        fromAccount: row.from_account_id ? {
          id: row.from_account_id,
          name: row.from_account_name,
          bankName: row.from_bank_name,
          accountNumber: row.from_account_number
        } : null,
        toAccount: row.to_account_id ? {
          id: row.to_account_id,
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
          t.transaction_type,
          t.description,
          t.transaction_date,
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
    body('date').optional().isISO8601().withMessage('Valid date required'),
    body('fromAccount').optional().isUUID().withMessage('From account must be valid UUID'),
    body('toAccount').optional().custom((value) => {
      if (value === null || value === undefined) return true;
      return require('validator').isUUID(value);
    }).withMessage('To account must be valid UUID or null'),
    body('note').optional().isString().trim().isLength({ max: 1000 }).withMessage('Note too long')
  ],
  validateRequest,
  async (req: express.Request, res: express.Response) => {
    try {
      const userId = req.user?.id;
      const { id } = req.params;
      const updates = req.body;

      logger.info(`Updating transaction ${id} for user: ${userId}`);
      logger.info(`Update data received:`, JSON.stringify(updates, null, 2));

      // Handle category name to ID conversion if category is provided
      if (updates.category) {
        const categoryQuery = `
          SELECT id FROM categories 
          WHERE name = $1 AND is_active = true
          ORDER BY is_default DESC, sort_order ASC
          LIMIT 1
        `;
        const categoryResult = await req.app.locals.db.query(categoryQuery, [updates.category]);
        
        if (categoryResult.rows.length === 0) {
          return res.status(400).json({
            success: false,
            message: 'Invalid category'
          });
        }
        
        updates.categoryId = categoryResult.rows[0].id;
      }

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
      const updateValues: any[] = [id, userId]; // Start with id and userId as $1 and $2
      let paramCount = 2; // Start from 3 since $1 and $2 are taken

      if (updates.amount !== undefined) {
        updateFields.push(`amount = $${++paramCount}`);
        updateValues.push(parseFloat(updates.amount));
      }
      if (updates.type !== undefined) {
        updateFields.push(`transaction_type = $${++paramCount}`);
        updateValues.push(updates.type);
      }
      if (updates.description !== undefined) {
        updateFields.push(`description = $${++paramCount}`);
        updateValues.push(updates.description);
      }
      if (updates.date !== undefined) {
        updateFields.push(`transaction_date = $${++paramCount}`);
        // Parse the date string - frontend now sends ISO string with timezone
        let parsedDate: Date;
        if (typeof updates.date === 'string') {
          // Parse the ISO string which includes timezone information
          parsedDate = new Date(updates.date);
        } else {
          parsedDate = new Date(updates.date);
        }
        updateValues.push(parsedDate);
      }
      if (updates.fromAccount !== undefined) {
        updateFields.push(`from_account_id = $${++paramCount}`);
        updateValues.push(updates.fromAccount);
      }
      if (updates.toAccount !== undefined) {
        updateFields.push(`to_account_id = $${++paramCount}`);
        updateValues.push(updates.toAccount);
      }
      if (updates.note !== undefined) {
        updateFields.push(`notes = $${++paramCount}`);
        updateValues.push(updates.note);
      }
      if (updates.categoryId !== undefined) {
        updateFields.push(`category_id = $${++paramCount}`);
        updateValues.push(updates.categoryId);
      }

      // Add updated_at field (doesn't need a parameter)
      updateFields.push(`updated_at = NOW()`);
      
      // Check if we have any actual field updates (excluding updated_at)
      if (updateFields.length === 1) {
        return res.status(400).json({
          success: false,
          message: 'No valid fields to update'
        });
      }

      const updateQuery = `
        UPDATE transactions 
        SET ${updateFields.join(', ')}
        WHERE id = $1 AND user_id = $2
        RETURNING id, amount, transaction_type, description, transaction_date, updated_at
      `;

      // Handle account balance updates BEFORE updating the transaction
      // Only run balance updates if there are actual financial changes that affect account balances
      // Check if any of the financial fields that affect account balances have changed
      const hasFinancialChanges = (updates.fromAccount !== undefined) || 
                                 (updates.toAccount !== undefined) || 
                                 (updates.amount !== undefined) || 
                                 (updates.type !== undefined);
      
      logger.info('Checking if balance updates needed:', {
        fromAccount: updates.fromAccount,
        toAccount: updates.toAccount,
        amount: updates.amount,
        type: updates.type,
        hasFinancialChanges: hasFinancialChanges,
        shouldUpdate: hasFinancialChanges,
        note: 'Only run balance updates for financial field changes (fromAccount, toAccount, amount, type)'
      });
      
      if (hasFinancialChanges) {
        logger.info('🔄 Starting NEW ROBUST account balance update process...');
        
        try {
          // Get ORIGINAL transaction data BEFORE updating
          const originalQuery = `
            SELECT amount, transaction_type, from_account_id, to_account_id 
            FROM transactions 
            WHERE id = $1 AND user_id = $2
          `;
          const originalResult = await req.app.locals.db.query(originalQuery, [id, userId]);
          const originalTransaction = originalResult.rows[0];
          
          logger.info('📊 ORIGINAL transaction data:', {
            amount: originalTransaction.amount,
            type: originalTransaction.transaction_type,
            fromAccount: originalTransaction.from_account_id,
            toAccount: originalTransaction.to_account_id
          });
          
          // Calculate NEW transaction values
          const newAmount = updates.amount !== undefined ? updates.amount : originalTransaction.amount;
          const newType = updates.type !== undefined ? updates.type : originalTransaction.transaction_type;
          const newFromAccount = updates.fromAccount !== undefined ? updates.fromAccount : originalTransaction.from_account_id;
          const newToAccount = updates.toAccount !== undefined ? updates.toAccount : originalTransaction.to_account_id;
          
          logger.info('📊 NEW transaction data:', {
            amount: newAmount,
            type: newType,
            fromAccount: newFromAccount,
            toAccount: newToAccount
          });
          
          // ULTRA SIMPLE APPROACH: Just reverse original and apply new
          logger.info('🔄 ULTRA SIMPLE APPROACH: Reverse original, apply new...');
          
          // Step 1: Reverse ORIGINAL transaction
          logger.info('🔄 Step 1: Reversing ORIGINAL transaction...');
          
          if (originalTransaction.transaction_type === 'expense' && originalTransaction.from_account_id) {
            logger.info(`   Reversing expense: +₹${originalTransaction.amount} to account ${originalTransaction.from_account_id}`);
            const reverseQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(reverseQuery, [originalTransaction.amount, originalTransaction.from_account_id, userId]);
          }
          
          if (originalTransaction.transaction_type === 'income' && originalTransaction.to_account_id) {
            logger.info(`   Reversing income: -₹${originalTransaction.amount} from account ${originalTransaction.to_account_id}`);
            const reverseQuery = `
              UPDATE bank_accounts 
              SET balance = balance - $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(reverseQuery, [originalTransaction.amount, originalTransaction.to_account_id, userId]);
          }
          
          if (originalTransaction.transaction_type === 'transfer') {
            if (originalTransaction.from_account_id) {
              logger.info(`   Reversing transfer from: +₹${originalTransaction.amount} to account ${originalTransaction.from_account_id}`);
              const reverseFromQuery = `
                UPDATE bank_accounts 
                SET balance = balance + $1, updated_at = NOW()
                WHERE id = $2 AND user_id = $3
              `;
              await req.app.locals.db.query(reverseFromQuery, [originalTransaction.amount, originalTransaction.from_account_id, userId]);
            }
            if (originalTransaction.to_account_id) {
              logger.info(`   Reversing transfer to: -₹${originalTransaction.amount} from account ${originalTransaction.to_account_id}`);
              const reverseToQuery = `
                UPDATE bank_accounts 
                SET balance = balance - $1, updated_at = NOW()
                WHERE id = $2 AND user_id = $3
              `;
              await req.app.locals.db.query(reverseToQuery, [originalTransaction.amount, originalTransaction.to_account_id, userId]);
            }
          }
          
          // Step 2: Apply NEW transaction
          logger.info('🔄 Step 2: Applying NEW transaction...');
          
          if (newType === 'expense' && newFromAccount) {
            logger.info(`   Applying expense: -₹${newAmount} from account ${newFromAccount}`);
            const applyQuery = `
              UPDATE bank_accounts 
              SET balance = balance - $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(applyQuery, [newAmount, newFromAccount, userId]);
          }
          
          if (newType === 'income' && newToAccount) {
            logger.info(`   Applying income: +₹${newAmount} to account ${newToAccount}`);
            const applyQuery = `
              UPDATE bank_accounts 
              SET balance = balance + $1, updated_at = NOW()
              WHERE id = $2 AND user_id = $3
            `;
            await req.app.locals.db.query(applyQuery, [newAmount, newToAccount, userId]);
          }
          
          if (newType === 'transfer') {
            if (newFromAccount) {
              logger.info(`   Applying transfer from: -₹${newAmount} from account ${newFromAccount}`);
              const applyFromQuery = `
                UPDATE bank_accounts 
                SET balance = balance - $1, updated_at = NOW()
                WHERE id = $2 AND user_id = $3
              `;
              await req.app.locals.db.query(applyFromQuery, [newAmount, newFromAccount, userId]);
            }
            if (newToAccount) {
              logger.info(`   Applying transfer to: +₹${newAmount} to account ${newToAccount}`);
              const applyToQuery = `
                UPDATE bank_accounts 
                SET balance = balance + $1, updated_at = NOW()
                WHERE id = $2 AND user_id = $3
              `;
              await req.app.locals.db.query(applyToQuery, [newAmount, newToAccount, userId]);
            }
          }
          
          logger.info('✅ NEW ROBUST account balance update completed successfully!');
          
        } catch (balanceError) {
          logger.error('❌ Error in NEW ROBUST account balance update:', balanceError);
          const errorMessage = balanceError instanceof Error ? balanceError.message : 'Unknown error';
          logger.error('❌ Error details:', errorMessage);
        }
      } else {
        logger.info('✅ No financial changes detected - skipping account balance updates');
        logger.info('   Only non-financial fields changed (title, category, description, note, etc.)');
      }
      
      logger.info(`Update query: ${updateQuery}`);
      logger.info(`Update values:`, updateValues);

      // Now run the transaction update
      const updateResult = await req.app.locals.db.query(updateQuery, updateValues);
      
      return res.json({
        success: true,
        message: 'Transaction updated successfully',
        data: updateResult.rows[0]
      });
    } catch (error) {
      logger.error('Error updating transaction:', error);
      logger.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      });
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
      const checkQuery = 'SELECT id, amount, transaction_type, description, to_account_id, from_account_id FROM transactions WHERE id = $1 AND user_id = $2';
      const checkResult = await req.app.locals.db.query(checkQuery, [id, userId]);
      
      if (checkResult.rows.length === 0) {
        return res.status(404).json({
          success: false,
          message: 'Transaction not found'
        });
      }

      const transaction = checkResult.rows[0];
      const { amount, transaction_type, to_account_id, from_account_id } = transaction;

      // Reverse the account balance changes before deleting the transaction
      // For income transactions, we need to subtract the amount from the to_account
      // For expense transactions, we need to add the amount back to the from_account
      const balanceChange = transaction_type === 'income' ? -parseFloat(amount) : parseFloat(amount);
      const accountToUpdate = transaction_type === 'income' ? to_account_id : from_account_id;

      if (accountToUpdate) {
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
