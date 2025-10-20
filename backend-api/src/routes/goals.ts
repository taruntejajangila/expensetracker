import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/goals - Get all goals for the authenticated user
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Fetching goals for user: ${userId}`);

    const result = await db.query(
      `SELECT id, title as name, description, target_amount, current_amount, target_date, 
              status, goal_type, icon, color, created_at, updated_at
       FROM goals 
       WHERE user_id = $1 
       ORDER BY created_at DESC`,
      [userId]
    );

    // Map database fields to expected API response format
    const goals = result.rows.map((goal: any) => ({
      id: goal.id,
      name: goal.name,
      title: goal.name,
      description: goal.description,
      targetAmount: parseFloat(goal.target_amount),
      currentAmount: parseFloat(goal.current_amount),
      targetDate: goal.target_date,
      status: goal.status,
      goalType: goal.goal_type,
      icon: goal.icon,
      color: goal.color,
      progress: goal.target_amount > 0 ? Math.round((goal.current_amount / goal.target_amount) * 100) : 0,
      createdAt: goal.created_at,
      updatedAt: goal.updated_at
    }));

    logger.info(`Found ${goals.length} goals for user: ${userId}`);
    return res.json({ success: true, data: goals });
      } catch (error) {
      logger.error('Error fetching goals:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to fetch goals', error: errorMessage });
    }
});

// GET /api/goals/:id - Get a specific goal by ID
router.get('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Fetching goal ${goalId} for user: ${userId}`);

    const result = await db.query(
      `SELECT id, title as name, description, target_amount, current_amount, target_date, 
              status, goal_type, icon, color, created_at, updated_at
       FROM goals 
       WHERE id = $1 AND user_id = $2`,
      [goalId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    logger.info(`Goal ${goalId} fetched successfully for user: ${userId}`);
    return res.json({ success: true, data: result.rows[0] });
      } catch (error) {
      logger.error('Error fetching goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to fetch goal', error: errorMessage });
    }
});

// POST /api/goals - Create a new goal
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { name, description, targetAmount, targetDate, goalType, icon, color } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Validation
    if (!name || !targetAmount || !targetDate || !goalType) {
      return res.status(400).json({ 
        success: false, 
        message: 'Missing required fields: name, targetAmount, targetDate, goalType' 
      });
    }

    if (parseFloat(targetAmount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target amount must be greater than 0' 
      });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Creating new goal for user: ${userId}`);

    const result = await db.query(
      `INSERT INTO goals (user_id, name, title, description, target_amount, current_amount, 
                         target_date, status, goal_type, icon, color, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW(), NOW())
       RETURNING id, name, title, description, target_amount, current_amount, target_date, 
                 status, goal_type, icon, color, created_at, updated_at`,
      [
        userId,
        name, // Use 'name' for 'name' column (NOT NULL)
        name, // Use 'name' for 'title' column (for compatibility)
        description || null,
        parseFloat(targetAmount),
        0, // current_amount starts at 0
        targetDate,
        'active', // status starts as active
        goalType,
        icon || 'target',
        color || '#10B981'
      ]
    );

    logger.info(`Goal created successfully for user: ${userId}, goal ID: ${result.rows[0].id}`);
    return res.status(201).json({ success: true, data: result.rows[0] });
      } catch (error) {
      logger.error('Error creating goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to create goal', error: errorMessage });
    }
});

// PUT /api/goals/:id - Update an existing goal
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;
    const { name, description, targetAmount, targetDate, goalType, icon, color, status } = req.body;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    // Validation - only validate if fields are provided for partial updates
    if (targetAmount && parseFloat(targetAmount) <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Target amount must be greater than 0' 
      });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Updating goal ${goalId} for user: ${userId}`);

    // First check if the goal exists and belongs to the user
    const existingGoal = await db.query(
      'SELECT * FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (existingGoal.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const currentGoal = existingGoal.rows[0];

    // Build dynamic update query for partial updates
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`title = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updateFields.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (targetAmount !== undefined) {
      updateFields.push(`target_amount = $${paramIndex++}`);
      values.push(parseFloat(targetAmount));
    }
    if (targetDate !== undefined) {
      updateFields.push(`target_date = $${paramIndex++}`);
      values.push(targetDate);
    }
    if (goalType !== undefined) {
      updateFields.push(`goal_type = $${paramIndex++}`);
      values.push(goalType);
    }
    if (icon !== undefined) {
      updateFields.push(`icon = $${paramIndex++}`);
      values.push(icon);
    }
    if (color !== undefined) {
      updateFields.push(`color = $${paramIndex++}`);
      values.push(color);
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex++}`);
      values.push(status);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No fields to update' 
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add goal ID and user ID as the last parameters
    values.push(goalId, userId);

    const query = `
      UPDATE goals 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex} AND user_id = $${paramIndex + 1}
      RETURNING id, title as name, description, target_amount, current_amount, target_date, 
                status, goal_type, icon, color, created_at, updated_at
    `;

    const result = await db.query(query, values);

    logger.info(`Goal ${goalId} updated successfully for user: ${userId}`);
    return res.json({ success: true, data: result.rows[0] });
      } catch (error) {
      logger.error('Error updating goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to update goal', error: errorMessage });
    }
});

// PATCH /api/goals/:id/progress - Update goal progress
router.patch('/:id/progress', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;
    const { amount, operation = 'add' } = req.body; // operation: 'add' or 'withdraw'

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    if (!amount || isNaN(parseFloat(amount))) {
      return res.status(400).json({ 
        success: false, 
        message: 'Valid amount is required' 
      });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Updating progress for goal ${goalId} for user: ${userId}, amount: ${amount}, operation: ${operation}`);

    // First check if the goal exists and belongs to the user
    const existingGoal = await db.query(
      'SELECT id, current_amount, target_amount FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (existingGoal.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const goal = existingGoal.rows[0];
    let newCurrentAmount: number;

    if (operation === 'add') {
      newCurrentAmount = parseFloat(goal.current_amount) + parseFloat(amount);
    } else if (operation === 'withdraw') {
      newCurrentAmount = parseFloat(goal.current_amount) - parseFloat(amount);
      if (newCurrentAmount < 0) {
        newCurrentAmount = 0;
      }
    } else {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid operation. Use "add" or "withdraw"' 
      });
    }

    // Determine new status based on progress
    const progressPercentage = (newCurrentAmount / parseFloat(goal.target_amount)) * 100;
    let newStatus = goal.status;
    
    if (progressPercentage >= 100) {
      newStatus = 'completed';
    } else if (goal.status === 'completed' && progressPercentage < 100) {
      newStatus = 'active';
    }

    const result = await db.query(
      `UPDATE goals 
       SET current_amount = $1, status = $2, updated_at = NOW()
       WHERE id = $3 AND user_id = $4
       RETURNING id, name, description, target_amount, current_amount, target_date, 
                 status, goal_type, icon, color, created_at, updated_at`,
      [newCurrentAmount, newStatus, goalId, userId]
    );

    logger.info(`Goal ${goalId} progress updated successfully for user: ${userId}. New amount: ${newCurrentAmount}, Status: ${newStatus}`);
    return res.json({ success: true, data: result.rows[0] });
      } catch (error) {
      logger.error('Error updating goal progress:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to update goal progress', error: errorMessage });
    }
});

// DELETE /api/goals/:id - Delete a goal
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const goalId = req.params.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Deleting goal ${goalId} for user: ${userId}`);

    // First check if the goal exists and belongs to the user
    const existingGoal = await db.query(
      'SELECT id, current_amount, title FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    if (existingGoal.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const goal = existingGoal.rows[0];
    
    // Check if goal has money saved - prevent deletion if it does
    if (parseFloat(goal.current_amount) > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete goal "${goal.title}" with ₹${goal.current_amount} saved. Please withdraw all money first, then delete the empty goal.`
      });
    }

    await db.query(
      'DELETE FROM goals WHERE id = $1 AND user_id = $2',
      [goalId, userId]
    );

    logger.info(`Goal ${goalId} deleted successfully for user: ${userId}`);
    return res.json({ success: true, message: 'Goal deleted successfully' });
      } catch (error) {
      logger.error('Error deleting goal:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to delete goal', error: errorMessage });
    }
});

// GET /api/goals/stats/summary - Get goals summary statistics
router.get('/stats/summary', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const db = req.app.locals.db;
    if (!db) {
      logger.error('Database connection not found');
      return res.status(500).json({ success: false, message: 'Database connection error' });
    }

    logger.info(`Fetching goals summary for user: ${userId}`);

    const result = await db.query(
      `SELECT 
         COUNT(*) as total_goals,
         COUNT(CASE WHEN status = 'active' THEN 1 END) as active_goals,
         COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_goals,
         COUNT(CASE WHEN status = 'paused' THEN 1 END) as paused_goals,
         COALESCE(SUM(target_amount), 0) as total_target_amount,
         COALESCE(SUM(current_amount), 0) as total_current_amount,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN target_amount ELSE 0 END), 0) as completed_target_amount,
         COALESCE(SUM(CASE WHEN status = 'completed' THEN current_amount ELSE 0 END), 0) as completed_current_amount
       FROM goals 
       WHERE user_id = $1`,
      [userId]
    );

    const stats = result.rows[0];
    const totalProgress = stats.total_target_amount > 0 
      ? (stats.total_current_amount / stats.total_target_amount) * 100 
      : 0;

    const summary = {
      ...stats,
      total_progress_percentage: Math.round(totalProgress * 100) / 100,
      total_remaining_amount: stats.total_target_amount - stats.total_current_amount
    };

    logger.info(`Goals summary fetched successfully for user: ${userId}`);
    return res.json({ success: true, data: summary });
      } catch (error) {
      logger.error('Error fetching goals summary:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return res.status(500).json({ success: false, message: 'Failed to fetch goals summary', error: errorMessage });
    }
});

export default router;
