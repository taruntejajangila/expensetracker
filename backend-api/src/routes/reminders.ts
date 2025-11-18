import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/reminders - Get all reminders for authenticated user
router.get('/', authenticateToken, async (req: any, res: any) => {
  try {
    const pool = getPool();
    const userId = req.user.id;

    const remindersQuery = `
      SELECT 
        id,
        title,
        description,
        due_date,
        reminder_time,
        is_completed,
        priority,
        category,
        source_type,
        source_id,
        type,
        paid_at,
        created_at,
        updated_at
      FROM reminders
      WHERE user_id = $1
      ORDER BY due_date ASC, reminder_time ASC
    `;

    const result = await pool.query(remindersQuery, [userId]);

    logger.info(`Retrieved ${result.rows.length} reminders for user ${userId}`);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching reminders:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch reminders'
    });
  }
});

// POST /api/reminders - Create new reminder
router.post('/', authenticateToken, [
  body('title').notEmpty().withMessage('Title is required'),
  body('dueDate').isISO8601().withMessage('Valid due date is required'),
  body('reminderTime').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('category').optional().isString(),
  body('sourceType').optional().isString(),
  body('sourceId').optional().isString()
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

    const pool = getPool();
    const userId = req.user.id;
    const {
      title,
      description,
      dueDate,
      reminderTime,
      priority = 'medium',
      category,
      sourceType = 'manual',
      sourceId
    } = req.body;

    const insertQuery = `
      INSERT INTO reminders (
        user_id, title, description, due_date, reminder_time,
        priority, category, source_type, source_id, is_completed, type
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `;

    const result = await pool.query(insertQuery, [
      userId,
      title,
      description || null,
      dueDate,
      reminderTime || null,
      priority,
      category || null,
      sourceType,
      sourceId || null,
      false,
      'general'
    ]);

    logger.info(`Created reminder ${result.rows[0].id} for user ${userId}`);

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error creating reminder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create reminder'
    });
  }
});

// PUT /api/reminders/:id - Update reminder
router.put('/:id', authenticateToken, [
  body('title').optional().notEmpty(),
  body('description').optional().isString(),
  body('type').optional().isString(),
  body('dueDate').optional().isISO8601(),
  body('reminderTime').optional().isString(),
  body('priority').optional().isIn(['low', 'medium', 'high']),
  body('category').optional().isString(),
  body('isCompleted').optional().isBoolean(),
  body('isEnabled').optional().isBoolean(),
  body('repeatType').optional().isString(),
  body('amount').optional().isNumeric(),
  body('sourceType').optional().isString(),
  body('sourceId').optional().isString(),
  body('paidAt').optional().isISO8601()
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

    const pool = getPool();
    const userId = req.user.id;
    const reminderId = req.params.id;
    const updates = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    Object.keys(updates).forEach(key => {
      if (updates[key] !== undefined) {
        const dbKey = key === 'dueDate' ? 'due_date' : 
                     key === 'reminderTime' ? 'reminder_time' :
                     key === 'isCompleted' ? 'is_completed' :
                     key === 'isEnabled' ? 'is_enabled' :
                     key === 'repeatType' ? 'repeat_type' :
                     key === 'sourceType' ? 'source_type' :
                     key === 'sourceId' ? 'source_id' :
                     key === 'paidAt' ? 'paid_at' : key;
        updateFields.push(`${dbKey} = $${paramIndex}`);
        values.push(updates[key]);
        paramIndex++;
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }

    updateFields.push(`updated_at = NOW()`);
    values.push(reminderId, userId);

    const updateQuery = `
      UPDATE reminders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING *
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    logger.info(`Updated reminder ${reminderId} for user ${userId}`);

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    logger.error('Error updating reminder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update reminder'
    });
  }
});

// DELETE /api/reminders/:id - Delete reminder
router.delete('/:id', authenticateToken, async (req: any, res: any) => {
  try {
    const pool = getPool();
    const userId = req.user.id;
    const reminderId = req.params.id;

    const deleteQuery = `
      DELETE FROM reminders 
      WHERE id = $1 AND user_id = $2
      RETURNING *
    `;

    const result = await pool.query(deleteQuery, [reminderId, userId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Reminder not found'
      });
    }

    logger.info(`Deleted reminder ${reminderId} for user ${userId}`);

    return res.json({
      success: true,
      message: 'Reminder deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting reminder:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete reminder'
    });
  }
});

export default router;
