import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Validation middleware for creating accounts
const validateAccountInput = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Account name is required and must be less than 100 characters'),
  body('bankName').trim().isLength({ min: 1, max: 100 }).withMessage('Bank name is required and must be less than 100 characters'),
  body('accountHolderName').trim().isLength({ min: 1, max: 100 }).withMessage('Account holder name is required and must be less than 100 characters'),
  body('accountNumber').trim().isLength({ min: 4, max: 20 }).withMessage('Account number must be between 4 and 20 characters'),
  body('accountType').isIn(['savings', 'current', 'salary', 'wallet']).withMessage('Invalid account type'),
  body('balance').isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
  body('currency').isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters (e.g., USD, INR)'),
  body('icon').optional().isLength({ min: 1, max: 50 }).withMessage('Icon must be less than 50 characters'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
];

// Validation middleware for updating accounts (more flexible)
const validateAccountUpdate = [
  body('name').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Account name must be less than 100 characters'),
  body('bankName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Bank name must be less than 100 characters'),
  body('accountHolderName').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Account holder name must be less than 100 characters'),
  body('accountNumber').optional().trim().isLength({ min: 4, max: 20 }).withMessage('Account number must be between 4 and 20 characters'),
  body('accountType').optional().isIn(['savings', 'current', 'salary', 'wallet']).withMessage('Invalid account type'),
  body('balance').optional().isFloat({ min: 0 }).withMessage('Balance must be a positive number'),
  body('currency').optional().isLength({ min: 3, max: 3 }).withMessage('Currency must be 3 characters (e.g., USD, INR)'),
  body('icon').optional().isLength({ min: 1, max: 50 }).withMessage('Icon must be less than 50 characters'),
  body('color').optional().isHexColor().withMessage('Color must be a valid hex color'),
];

// GET /api/bank-accounts - Get user bank accounts
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    
    const query = `
      SELECT 
        id, account_name, bank_name, account_holder_name, account_type, balance, currency, 
        account_number, is_active as status, updated_at as last_updated,
        created_at, updated_at
      FROM bank_accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await req.app.locals.db.query(query, [userId]);
    
    logger.info(`Retrieved ${result.rows.length} accounts for user ${userId}`);
    
    res.json({
      success: true,
      data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.account_name,
        bankName: row.bank_name,
        accountHolderName: row.account_holder_name || row.account_name, // Use account_holder_name if available, fallback to account_name
        type: (row.account_type === 'wallet' || (row.bank_name === 'Cash' && row.account_name === 'Cash Wallet')) ? 'cash' : 'bank',
        balance: parseFloat(row.balance),
        currency: row.currency || 'INR',
        icon: (row.account_type === 'wallet' || (row.bank_name === 'Cash' && row.account_name === 'Cash Wallet')) ? 'wallet' : 'card',
        color: (row.account_type === 'wallet' || (row.bank_name === 'Cash' && row.account_name === 'Cash Wallet')) ? '#10B981' : '#3B82F6',
        accountType: row.account_type,
        accountNumber: row.account_number || '',
        status: row.status,
        lastUpdated: row.last_updated,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))
    });
  } catch (error: any) {
    logger.error('Error retrieving bank accounts:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bank accounts',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// GET /api/bank-accounts/:id - Get specific bank account
router.get('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    
    const query = `
      SELECT 
        id, account_name, bank_name, account_holder_name, account_type, balance, currency, 
        account_number, is_active as status, updated_at as last_updated,
        created_at, updated_at
      FROM bank_accounts 
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await req.app.locals.db.query(query, [accountId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Bank account not found'
      });
    }
    
    const account = result.rows[0];
    
    res.json({
      success: true,
      data: {
        id: account.id,
        name: account.account_name,
        bankName: account.bank_name,
        accountHolderName: account.account_holder_name || account.account_name, // Use account_holder_name if available, fallback to account_name
        type: (account.account_type === 'wallet' || (account.bank_name === 'Cash' && account.account_name === 'Cash Wallet')) ? 'cash' : 'bank',
        balance: parseFloat(account.balance),
        currency: account.currency || 'INR',
        icon: (account.account_type === 'wallet' || (account.bank_name === 'Cash' && account.account_name === 'Cash Wallet')) ? 'wallet' : 'card',
        color: (account.account_type === 'wallet' || (account.bank_name === 'Cash' && account.account_name === 'Cash Wallet')) ? '#10B981' : '#3B82F6',
        accountType: account.account_type,
        accountNumber: account.account_number,
        status: account.status,
        lastUpdated: account.last_updated,
        createdAt: account.created_at,
        updatedAt: account.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error retrieving bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// POST /api/bank-accounts - Create new bank account
router.post('/', authenticateToken, validateAccountInput, async (req: any, res: any) => {
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
    const {
      name, bankName, accountHolderName, accountNumber, accountType,
      balance = 0, currency = 'INR', icon = 'card', color = '#007AFF'
    } = req.body;
    
    // Check for duplicate accounts
    const duplicateCheckQuery = `
      SELECT id, account_name, bank_name, account_number 
      FROM bank_accounts 
      WHERE user_id = $1 
      AND (
        (account_number = $2 AND account_number != '') 
        OR (account_name = $3)
        OR (bank_name = $4 AND account_number = $2 AND account_number != '')
      )
    `;
    
    const duplicateCheckValues = [userId, accountNumber, name, bankName];
    const duplicateResult = await req.app.locals.db.query(duplicateCheckQuery, duplicateCheckValues);
    
    if (duplicateResult.rows.length > 0) {
      const duplicates = duplicateResult.rows;
      let errorMessage = 'Account already exists: ';
      
      if (duplicates.some((d: any) => d.account_number === accountNumber && d.account_number !== '')) {
        errorMessage += `Account number ${accountNumber} is already in use`;
      } else if (duplicates.some((d: any) => d.account_name === name)) {
        errorMessage += `Account nickname "${name}" is already in use`;
      } else if (duplicates.some((d: any) => d.bank_name === bankName && d.account_number === accountNumber)) {
        errorMessage += `Account with bank ${bankName} and number ${accountNumber} already exists`;
      }
      
      return res.status(409).json({
        success: false,
        message: errorMessage,
        error: 'DUPLICATE_ACCOUNT',
        duplicates: duplicates
      });
    }
    
    const query = `
      INSERT INTO bank_accounts (
        user_id, account_name, bank_name, account_holder_name, account_type, balance, currency,
        account_number, is_active, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
      RETURNING *
    `;
    
    const values = [
      userId, name, bankName, accountHolderName, accountType, balance, currency,
      accountNumber, true
    ];
    
    const result = await req.app.locals.db.query(query, values);
    const newAccount = result.rows[0];
    
    logger.info(`Created new bank account ${newAccount.id} for user ${userId}`);
    
    res.status(201).json({
      success: true,
      message: 'Bank account created successfully',
      data: {
        id: newAccount.id,
        name: newAccount.account_name,
        bankName: newAccount.bank_name,
        accountHolderName: newAccount.account_holder_name || newAccount.account_name, // Use account_holder_name if available, fallback to account_name
        type: (newAccount.account_type === 'wallet' || (newAccount.bank_name === 'Cash' && newAccount.account_name === 'Cash Wallet')) ? 'cash' : 'bank',
        balance: parseFloat(newAccount.balance),
        currency: newAccount.currency || 'INR',
        icon: newAccount.account_type === 'wallet' ? 'wallet' : 'card', // Default icons
        color: newAccount.account_type === 'wallet' ? '#10B981' : '#3B82F6', // Default colors
        accountType: newAccount.account_type,
        accountNumber: newAccount.account_number || '',
        status: newAccount.is_active ? 'Active' : 'Inactive',
        lastUpdated: newAccount.updated_at,
        createdAt: newAccount.created_at,
        updatedAt: newAccount.updated_at,
      }
    });
  } catch (error: any) {
    logger.error('Error creating bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// PUT /api/bank-accounts/:id - Update bank account
router.put('/:id', authenticateToken, validateAccountUpdate, async (req: any, res: any) => {
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
    const accountId = req.params.id;
    const {
      name, bankName, accountHolderName, accountNumber, accountType,
      balance, currency, icon, color
    } = req.body;
    
         // Check if account exists and belongs to user
     const checkQuery = 'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2';
     const checkResult = await req.app.locals.db.query(checkQuery, [accountId, userId]);
     
     if (checkResult.rows.length === 0) {
       return res.status(404).json({
         success: false,
         message: 'Bank account not found'
       });
     }
     
     // Check for duplicate accounts (excluding current account)
     if (name !== undefined || bankName !== undefined || accountNumber !== undefined) {
       const duplicateCheckQuery = `
         SELECT id, account_name, bank_name, account_number 
         FROM bank_accounts 
         WHERE user_id = $1 
         AND id != $2
         AND (
           (account_number = $3 AND account_number != '' AND $3 != '') 
           OR (account_name = $4 AND $4 != '')
           OR (bank_name = $5 AND account_number = $3 AND account_number != '' AND $3 != '')
         )
       `;
       
       const duplicateCheckValues = [
         userId, 
         accountId, 
         accountNumber || checkResult.rows[0].account_number,
         name || checkResult.rows[0].account_name,
         bankName || checkResult.rows[0].bank_name
       ];
       
       const duplicateResult = await req.app.locals.db.query(duplicateCheckQuery, duplicateCheckValues);
       
       if (duplicateResult.rows.length > 0) {
         const duplicates = duplicateResult.rows;
         let errorMessage = 'Account already exists: ';
         
         if (duplicates.some((d: any) => d.account_number === (accountNumber || checkResult.rows[0].account_number) && (accountNumber || checkResult.rows[0].account_number) !== '')) {
           errorMessage += `Account number ${accountNumber || checkResult.rows[0].account_number} is already in use`;
         } else if (duplicates.some((d: any) => d.account_name === (name || checkResult.rows[0].account_name))) {
           errorMessage += `Account nickname "${name || checkResult.rows[0].account_name}" is already in use`;
         } else if (duplicates.some((d: any) => d.bank_name === (bankName || checkResult.rows[0].bank_name) && d.account_number === (accountNumber || checkResult.rows[0].account_number))) {
           errorMessage += `Account with bank ${bankName || checkResult.rows[0].bank_name} and number ${accountNumber || checkResult.rows[0].account_number} already exists`;
         }
         
         return res.status(409).json({
           success: false,
           message: errorMessage,
           error: 'DUPLICATE_ACCOUNT',
           duplicates: duplicates
         });
       }
     }
     
     // Build dynamic update query based on provided fields
     const updateFields: string[] = [];
     const updateValues: any[] = [];
     let paramIndex = 1;
     
     if (name !== undefined) {
       updateFields.push(`account_name = $${paramIndex++}`);
       updateValues.push(name);
     }
     if (bankName !== undefined) {
       updateFields.push(`bank_name = $${paramIndex++}`);
       updateValues.push(bankName);
     }
     if (accountType !== undefined) {
       updateFields.push(`account_type = $${paramIndex++}`);
       updateValues.push(accountType);
     }
     if (accountNumber !== undefined) {
       updateFields.push(`account_number = $${paramIndex++}`);
       updateValues.push(accountNumber);
     }
     if (accountHolderName !== undefined) {
       updateFields.push(`account_holder_name = $${paramIndex++}`);
       updateValues.push(accountHolderName);
     }
     if (balance !== undefined) {
       updateFields.push(`balance = $${paramIndex++}`);
       updateValues.push(balance);
     }
     if (currency !== undefined) {
       updateFields.push(`currency = $${paramIndex++}`);
       updateValues.push(currency);
     }
     
     // Always update the updated_at timestamp
     updateFields.push(`updated_at = NOW()`);
     
     if (updateFields.length === 1) {
       // Only updated_at field, return current account
       const currentAccountQuery = 'SELECT * FROM bank_accounts WHERE id = $1 AND user_id = $2';
       const currentResult = await req.app.locals.db.query(currentAccountQuery, [accountId, userId]);
       const currentAccount = currentResult.rows[0];
       
       res.json({
         success: true,
         message: 'Bank account updated successfully',
         data: {
           id: currentAccount.id,
           name: currentAccount.account_name,
           bankName: currentAccount.bank_name,
           accountHolderName: currentAccount.account_holder_name || currentAccount.account_name,
           type: (currentAccount.account_type === 'wallet' || (currentAccount.bank_name === 'Cash' && currentAccount.account_name === 'Cash Wallet')) ? 'cash' : 'bank',
           balance: parseFloat(currentAccount.balance),
           currency: currentAccount.currency || 'INR',
           icon: currentAccount.account_type === 'wallet' ? 'wallet' : 'card',
           color: currentAccount.account_type === 'wallet' ? '#10B981' : '#3B82F6',
           accountType: currentAccount.account_type,
           accountNumber: currentAccount.account_number || '',
           status: currentAccount.is_active ? 'Active' : 'Inactive',
           lastUpdated: currentAccount.updated_at,
           createdAt: currentAccount.created_at,
           updatedAt: currentAccount.updated_at,
         }
       });
       return;
     }
     
     const query = `
       UPDATE bank_accounts SET
         ${updateFields.join(', ')}
       WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
       RETURNING *
     `;
     
     const values = [...updateValues, accountId, userId];
     
    const result = await req.app.locals.db.query(query, values);
    const updatedAccount = result.rows[0];
    
    logger.info(`Updated bank account ${accountId} for user ${userId}`);
    
    const responseData = {
      id: updatedAccount.id,
      name: updatedAccount.account_name,
      bankName: updatedAccount.bank_name,
      accountHolderName: updatedAccount.account_holder_name || updatedAccount.account_name, // Use account_holder_name if available, fallback to account_name
      type: (updatedAccount.account_type === 'wallet' || (updatedAccount.bank_name === 'Cash' && updatedAccount.account_name === 'Cash Wallet')) ? 'cash' : 'bank',
      balance: parseFloat(updatedAccount.balance),
      currency: updatedAccount.currency || 'INR',
      icon: updatedAccount.account_type === 'wallet' ? 'wallet' : 'card', // Default icons
      color: updatedAccount.account_type === 'wallet' ? '#10B981' : '#3B82F6', // Default colors
      accountType: updatedAccount.account_type,
      accountNumber: updatedAccount.account_number || '',
      status: updatedAccount.is_active ? 'Active' : 'Inactive',
      lastUpdated: updatedAccount.updated_at,
      createdAt: updatedAccount.created_at,
      updatedAt: updatedAccount.updated_at,
    };
    
    res.json({
      success: true,
      message: 'Bank account updated successfully',
      data: responseData
    });
  } catch (error: any) {
    logger.error('Error updating bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// DELETE /api/bank-accounts/:id - Delete bank account
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const userId = req.user.id;
    const accountId = req.params.id;
    
         // Check if account exists and belongs to user
     const checkQuery = 'SELECT id FROM bank_accounts WHERE id = $1 AND user_id = $2';
     const checkResult = await req.app.locals.db.query(checkQuery, [accountId, userId]);
     
     if (checkResult.rows.length === 0) {
       return res.status(404).json({
         success: false,
         message: 'Bank account not found'
       });
     }
     
    // Check if account has transactions (prevent deletion if in use)
    const transactionQuery = 'SELECT id FROM transactions WHERE to_account_id = $1 OR from_account_id = $1 LIMIT 1';
     const transactionResult = await req.app.locals.db.query(transactionQuery, [accountId]);
     
     if (transactionResult.rows.length > 0) {
       return res.status(400).json({
         success: false,
         message: 'Cannot delete account with existing transactions. Please delete all transactions first.'
       });
     }
     
     // Delete the account
     const deleteQuery = 'DELETE FROM bank_accounts WHERE id = $1 AND user_id = $2';
    await req.app.locals.db.query(deleteQuery, [accountId, userId]);
    
    logger.info(`Deleted bank account ${accountId} for user ${userId}`);
    
    res.json({
      success: true,
      message: 'Bank account deleted successfully'
    });
  } catch (error: any) {
    logger.error('Error deleting bank account:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete bank account',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
    });
  }
});

// Temporary test endpoint (remove in production)
router.get('/test/sync', async (req: any, res: any) => {
  try {
    console.log('🧪 Test endpoint called - fetching accounts for user 0041a7fa-a4cf-408a-a106-4bc3e3744fbb (Tarun)');
    
    const query = `
      SELECT 
        id, account_name, bank_name, account_holder_name, account_type, balance, currency, 
        account_number, is_active, created_at, updated_at
      FROM bank_accounts 
      WHERE user_id = $1 
      ORDER BY created_at DESC
    `;
    
    const result = await req.app.locals.db.query(query, ['0041a7fa-a4cf-408a-a106-4bc3e3744fbb']);
    
    logger.info(`Test endpoint: Retrieved ${result.rows.length} accounts`);
    
    res.json({
      success: true,
      message: 'Test endpoint - accounts retrieved successfully',
        data: result.rows.map((row: any) => ({
        id: row.id,
        name: row.account_name,
        bankName: row.bank_name,
        accountHolderName: row.account_holder_name,
        accountType: row.account_type,
        balance: parseFloat(row.balance),
        currency: row.currency,
        accountNumber: row.account_number,
        isActive: row.is_active,
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
