import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/credit-cards - Get user credit cards
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const query = `
      SELECT 
        id, name, card_number, card_type, issuer, 
        credit_limit, balance, due_date, min_payment,
        statement_day, payment_due_day,
        color, icon, is_active, created_at, updated_at
      FROM credit_cards 
      WHERE user_id = $1 AND is_active = true
      ORDER BY created_at DESC
    `;
    
    const result = await req.app.locals.db.query(query, [userId]);
    
    res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    console.error('Error fetching credit cards:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit cards'
    });
  }
});

// GET /api/credit-cards/:id - Get specific credit card
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const cardId = req.params.id;
    
    const query = `
      SELECT 
        id, name, card_number, card_type, issuer, 
        credit_limit, balance, due_date, min_payment,
        statement_day, payment_due_day,
        color, icon, is_active, created_at, updated_at
      FROM credit_cards 
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const result = await req.app.locals.db.query(query, [cardId, userId]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credit card not found'
      });
    }
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching credit card:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch credit card'
    });
  }
});

// POST /api/credit-cards - Create new credit card
router.post('/', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const {
      name,
      cardNumber,
      cardType,
      issuer,
      creditLimit,
      balance,
      dueDate,
      minPayment,
      statementDay,
      paymentDueDay,
      color,
      icon
    } = req.body;
    
    // Validation
    if (!name || !cardType || !issuer || !creditLimit || balance === undefined || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }
    
    if (creditLimit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit limit must be greater than 0'
      });
    }
    
    if (balance < 0 || balance > creditLimit) {
      return res.status(400).json({
        success: false,
        message: 'Balance must be between 0 and credit limit'
      });
    }

    // Check for duplicate credit cards
    const duplicateCheckQuery = `
      SELECT id, name, card_number, card_type, issuer 
      FROM credit_cards 
      WHERE user_id = $1 AND is_active = true
      AND (
        (card_number = $2 AND card_number != '') 
        OR (name = $3 AND issuer = $4)
        OR (card_type = $5 AND issuer = $4)
      )
    `;
    
    const duplicateCheckValues = [userId, cardNumber, name, issuer, cardType];
    const duplicateResult = await req.app.locals.db.query(duplicateCheckQuery, duplicateCheckValues);
    
    if (duplicateResult.rows.length > 0) {
      const duplicates = duplicateResult.rows;
      let errorMessage = 'Credit card already exists: ';
      
      if (duplicates.some((d: any) => d.card_number === cardNumber && d.card_number !== '')) {
        errorMessage += `Card number ${cardNumber} is already in use`;
      } else if (duplicates.some((d: any) => d.name === name && d.issuer === issuer)) {
        errorMessage += `A credit card with the name "${name}" already exists at ${issuer}`;
      } else if (duplicates.some((d: any) => d.card_type === cardType && d.issuer === issuer)) {
        errorMessage += `A ${cardType} credit card from ${issuer} already exists`;
      }
      
      return res.status(409).json({
        success: false,
        message: errorMessage,
        error: 'DUPLICATE_CREDIT_CARD',
        duplicates: duplicates
      });
    }
    
    const query = `
      INSERT INTO credit_cards (
        user_id, name, card_number, card_type, issuer, 
        credit_limit, balance, due_date, min_payment, 
        statement_day, payment_due_day, color, icon
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
      RETURNING *
    `;
    
    const values = [
      userId,
      name,
      cardNumber || `000000000000${Math.random().toString().slice(2, 6)}`,
      cardType,
      issuer,
      creditLimit,
      balance,
      dueDate,
      minPayment || Math.round(balance * 0.05), // 5% of balance
      statementDay || 1, // Default to 1 if not provided
      paymentDueDay || 15, // Default to 15 if not provided
      color || '#007AFF',
      icon || 'card'
    ];
    
                    const result = await req.app.locals.db.query(query, values);
        
        return res.status(201).json({
          success: true,
          data: result.rows[0]
        });
      } catch (error) {
        console.error('Error creating credit card:', error);
        return res.status(500).json({
          success: false,
          message: 'Failed to create credit card'
        });
      }
});

// PUT /api/credit-cards/:id - Update credit card
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const cardId = req.params.id;
    const updates = req.body;
    
    // Check if card exists and belongs to user
    const checkQuery = `
      SELECT id FROM credit_cards 
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const checkResult = await req.app.locals.db.query(checkQuery, [cardId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credit card not found'
      });
    }
    
    // Map camelCase field names to snake_case database column names
    const fieldMapping: { [key: string]: string } = {
      'name': 'name',
      'cardName': 'name', // Frontend sends cardName, map to name
      'cardNumber': 'card_number',
      'cardType': 'card_type',
      'issuer': 'issuer',
      'creditLimit': 'credit_limit',
      'balance': 'balance',
      'currentBalance': 'balance', // Frontend sends currentBalance, map to balance
      'minPayment': 'min_payment',
      'statementDay': 'statement_day',
      'paymentDueDay': 'payment_due_day',
      'dueDay': 'payment_due_day', // Frontend sends dueDay, map to payment_due_day
      'color': 'color',
      'icon': 'icon'
    };
    
    const allowedFields = [
      'name', 'card_number', 'card_type', 'issuer', 'credit_limit', 
      'balance', 'min_payment', 'color', 'icon', 'statement_day', 'payment_due_day'
    ];
    
    console.log('🔍 Backend: Received updates:', updates);
    console.log('🔍 Backend: Field mapping:', fieldMapping);
    
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;
    
    for (const [key, value] of Object.entries(updates)) {
      console.log(`🔍 Backend: Processing field ${key} = ${value}`);
      
      // Map camelCase to snake_case
      const dbField = fieldMapping[key];
      if (dbField && allowedFields.includes(dbField) && value !== undefined) {
        updateFields.push(`${dbField} = $${paramCount + 3}`); // +3 because we'll add cardId, userId, and updated_at
        values.push(value);
        paramCount++;
        console.log(`✅ Backend: Added field ${key} -> ${dbField} to update`);
      } else {
        console.log(`❌ Backend: Skipped field ${key} (not mapped or undefined)`);
      }
    }
    
    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    // Check for duplicate credit cards (excluding current card)
    if (updates.name !== undefined || updates.issuer !== undefined || updates.card_type !== undefined || updates.card_number !== undefined) {
      const duplicateCheckQuery = `
        SELECT id, name, card_number, card_type, issuer 
        FROM credit_cards 
        WHERE user_id = $1 AND id != $2 AND is_active = true
        AND (
          (card_number = $3 AND card_number != '' AND $3 != '') 
          OR (name = $4 AND issuer = $5 AND $4 != '' AND $5 != '')
          OR (card_type = $6 AND issuer = $5 AND $6 != '' AND $5 != '')
        )
      `;
      
      const duplicateCheckValues = [
        userId, 
        cardId, 
        updates.card_number || (await req.app.locals.db.query('SELECT card_number FROM credit_cards WHERE id = $1', [cardId])).rows[0].card_number,
        updates.name || (await req.app.locals.db.query('SELECT name FROM credit_cards WHERE id = $1', [cardId])).rows[0].name,
        updates.issuer || (await req.app.locals.db.query('SELECT issuer FROM credit_cards WHERE id = $1', [cardId])).rows[0].issuer,
        updates.card_type || (await req.app.locals.db.query('SELECT card_type FROM credit_cards WHERE id = $1', [cardId])).rows[0].card_type
      ];
      
      const duplicateResult = await req.app.locals.db.query(duplicateCheckQuery, duplicateCheckValues);
      
      if (duplicateResult.rows.length > 0) {
        const duplicates = duplicateResult.rows;
        let errorMessage = 'Credit card already exists: ';
        
        if (duplicates.some((d: any) => d.card_number === updates.card_number && updates.card_number !== '')) {
          errorMessage += `Card number ${updates.card_number} is already in use`;
        } else if (duplicates.some((d: any) => d.name === updates.name && d.issuer === updates.issuer)) {
          errorMessage += `A credit card with the name "${updates.name}" already exists at ${updates.issuer}`;
        } else if (duplicates.some((d: any) => d.card_type === updates.card_type && d.issuer === updates.issuer)) {
          errorMessage += `A ${updates.card_type} credit card from ${updates.issuer} already exists`;
        }
        
        return res.status(409).json({
          success: false,
          message: errorMessage,
          error: 'DUPLICATE_CREDIT_CARD',
          duplicates: duplicates
        });
      }
    }
    
    // Add validation for critical fields
    if (updates.credit_limit !== undefined && updates.credit_limit <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Credit limit must be greater than 0'
      });
    }
    
    if (updates.balance !== undefined) {
      const creditLimit = updates.credit_limit || 
        (await req.app.locals.db.query('SELECT credit_limit FROM credit_cards WHERE id = $1', [cardId])).rows[0].credit_limit;
      
      if (updates.balance < 0 || updates.balance > creditLimit) {
        return res.status(400).json({
          success: false,
          message: 'Balance must be between 0 and credit limit'
        });
      }
    }
    
    const query = `
      UPDATE credit_cards 
      SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;
    
    // Add cardId and userId to the beginning of values array
    values.unshift(cardId, userId);
    
    console.log('🔍 Backend: Final update query:', query);
    console.log('🔍 Backend: Final values:', values);
    console.log('🔍 Backend: Total parameters:', values.length);
    console.log('🔍 Backend: Parameter placeholders in query:', (query.match(/\$/g) || []).length);
    console.log('🔍 Backend: Update fields count:', updateFields.length);
    console.log('🔍 Backend: Param count after loop:', paramCount);
    console.log('🔍 Backend: Values array after unshift:', values.length);
    
    const result = await req.app.locals.db.query(query, values);
    
    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error: any) {
    console.error('Error updating credit card:', error);
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      name: error.name
    });
    return res.status(500).json({
      success: false,
      message: 'Failed to update credit card',
      error: error.message
    });
  }
});

// DELETE /api/credit-cards/:id - Delete credit card (soft delete)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const cardId = req.params.id;
    
    // Check if card exists and belongs to user
    const checkQuery = `
      SELECT id FROM credit_cards 
      WHERE id = $1 AND user_id = $2 AND is_active = true
    `;
    
    const checkResult = await req.app.locals.db.query(checkQuery, [cardId, userId]);
    
    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Credit card not found'
      });
    }
    
    // Soft delete by setting is_active to false
    const query = `
      UPDATE credit_cards 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND user_id = $2
    `;
    
    await req.app.locals.db.query(query, [cardId, userId]);
    
    return res.json({
      success: true,
      message: 'Credit card deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting credit card:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete credit card'
    });
  }
});

// GET /api/credit-cards/summary - Get credit card summary
router.get('/summary', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const query = `
      SELECT 
        COUNT(*) as total_cards,
        SUM(credit_limit) as total_credit_limit,
        SUM(balance) as total_balance,
        AVG(balance::numeric / credit_limit::numeric * 100) as avg_utilization
      FROM credit_cards 
      WHERE user_id = $1 AND is_active = true
    `;
    
    const result = await req.app.locals.db.query(query, [userId]);
    const summary = result.rows[0];
    
    res.json({
      success: true,
      data: {
        totalCards: parseInt(summary.total_cards) || 0,
        totalCreditLimit: parseFloat(summary.total_credit_limit) || 0,
        totalBalance: parseFloat(summary.total_balance) || 0,
        availableCredit: Math.max((parseFloat(summary.total_credit_limit) || 0) - (parseFloat(summary.total_balance) || 0), 0),
        averageUtilization: parseFloat(summary.avg_utilization) || 0
      }
    });
  } catch (error) {
    console.error('Error fetching credit card summary:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch credit card summary'
    });
  }
});

export default router;
