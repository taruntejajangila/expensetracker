import express from 'express';
import { authenticateToken } from '../middleware/auth';
import { logger } from '../utils/logger';

const router = express.Router();

// Apply authentication to all routes
router.use(authenticateToken);

// GET /api/categories - Get all categories (global categories available to all users)
router.get('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;

    logger.info(`Fetching categories for user: ${userId}`);

    const db = req.app.locals.db;
    
    if (!db) {
      logger.error('Database connection not available in app.locals');
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    logger.info('Database connection found, executing query...');

    // Get all categories (they are global, available to all users)
    const allCategories = await db.query(
      'SELECT * FROM categories WHERE is_active = true ORDER BY sort_order, name'
    );

    logger.info(`Found ${allCategories.rows.length} categories`);
    logger.info('Categories data:', allCategories.rows);

    return res.json({
      success: true,
      data: allCategories.rows
    });
  } catch (error) {
    logger.error('Error fetching categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch categories',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
});

// POST /api/categories - Create new category (for future user custom categories)
router.post('/', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const { name, type, icon, color } = req.body;

    logger.info(`Creating category for user: ${userId}`);

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    // Check if category name already exists (global check since categories are shared)
    const db = req.app.locals.db;
    const existingCategory = await db.query(
      'SELECT id FROM categories WHERE name = $1 AND type = $2',
      [name, type]
    );

    if (existingCategory.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name and type already exists'
      });
    }

    // Insert new category (global, available to all users)
    const result = await db.query(
      `INSERT INTO categories (name, type, icon, color, is_default, is_active, sort_order, created_at, updated_at)
       VALUES ($1, $2, $3, $4, false, true, 999, NOW(), NOW())
       RETURNING *`,
      [name, type, icon || 'ellipsis-horizontal', color || '#A9A9A9']
    );

    const newCategory = result.rows[0];

    return res.status(201).json({
      success: true,
      message: 'Category created successfully',
      data: newCategory
    });
  } catch (error) {
    logger.error('Error creating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      message: 'Failed to create category',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
});

// PUT /api/categories/:id - Update category
router.put('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const categoryId = req.params.id;
    const { name, type, icon, color } = req.body;

    logger.info(`Attempting to update category ${categoryId} by user: ${userId}`);

    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({
        success: false,
        message: 'Name and type are required'
      });
    }

    const db = req.app.locals.db;

    // First, check if the category exists and get its details
    const existingCategory = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    );

    if (existingCategory.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = existingCategory.rows[0];

    // Check if this is a global category (is_default = true)
    if (category.is_default) {
      logger.warn(`User ${userId} attempted to edit global category: ${category.name}`);
      return res.status(403).json({
        success: false,
        message: 'Cannot edit global categories. These are system-wide categories that cannot be modified.',
        categoryName: category.name
      });
    }

    // Check if category name already exists (excluding current category)
    const nameConflict = await db.query(
      'SELECT id FROM categories WHERE name = $1 AND type = $2 AND id != $3',
      [name, type, categoryId]
    );

    if (nameConflict.rows.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Category with this name and type already exists'
      });
    }

    // Update the category
    const result = await db.query(
      `UPDATE categories 
       SET name = $1, type = $2, icon = $3, color = $4, updated_at = NOW()
       WHERE id = $5
       RETURNING *`,
      [name, type, icon || 'ellipsis-horizontal', color || '#A9A9A9', categoryId]
    );

    const updatedCategory = result.rows[0];

    logger.info(`Category ${categoryId} (${category.name}) updated successfully by user: ${userId}`);

    return res.json({
      success: true,
      message: 'Category updated successfully',
      data: updatedCategory
    });
  } catch (error) {
    logger.error('Error updating category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      message: 'Failed to update category',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
});

// DELETE /api/categories/:id - Delete category
router.delete('/:id', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    const categoryId = req.params.id;

    logger.info(`Attempting to delete category ${categoryId} by user: ${userId}`);

    const db = req.app.locals.db;

    // First, check if the category exists and get its details
    const categoryCheck = await db.query(
      'SELECT * FROM categories WHERE id = $1',
      [categoryId]
    );

    if (categoryCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Category not found'
      });
    }

    const category = categoryCheck.rows[0];

    // Check if this is a global category (is_default = true)
    if (category.is_default) {
      logger.warn(`User ${userId} attempted to delete global category: ${category.name}`);
      return res.status(403).json({
        success: false,
        message: 'Cannot delete global categories. These are system-wide categories available to all users.',
        categoryName: category.name
      });
    }

    // Check if category is being used by transactions
    const transactionCheck = await db.query(
      'SELECT COUNT(*) as count FROM transactions WHERE category_id = $1',
      [categoryId]
    );

    if (parseInt(transactionCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by transactions. Please reassign or delete the transactions first.'
      });
    }

    // Check if category is being used by budgets
    const budgetCheck = await db.query(
      'SELECT COUNT(*) as count FROM budgets WHERE category_id = $1',
      [categoryId]
    );

    if (parseInt(budgetCheck.rows[0].count) > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete category that is being used by budgets. Please delete or reassign the budgets first.'
      });
    }

    // Delete the category
    await db.query('DELETE FROM categories WHERE id = $1', [categoryId]);

    logger.info(`Category ${categoryId} (${category.name}) deleted successfully by user: ${userId}`);

    return res.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    logger.error('Error deleting category:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      message: 'Failed to delete category',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
});

// POST /api/categories/add-missing - Add missing default categories (one-time setup)
router.post('/add-missing', async (req: express.Request, res: express.Response) => {
  try {
    const userId = req.user?.id;
    logger.info(`Adding missing categories (triggered by user: ${userId})`);

    const db = req.app.locals.db;
    
    if (!db) {
      return res.status(500).json({
        success: false,
        message: 'Database connection not available'
      });
    }

    const newCategories = [
      // Expense categories
      { name: 'Rent', icon: 'home', color: '#FF7675', type: 'expense' },
      { name: 'Subscription', icon: 'card', color: '#74B9FF', type: 'expense' },
      { name: 'Gifts & Donations', icon: 'gift', color: '#FD79A8', type: 'expense' },
      { name: 'Gas/Fuel', icon: 'car-sport', color: '#FDCB6E', type: 'expense' },
      { name: 'EMI/Loan Payment', icon: 'wallet', color: '#E17055', type: 'expense' },
      // Income categories
      { name: 'Bonus', icon: 'trophy', color: '#A29BFE', type: 'income' },
      { name: 'Interest Income', icon: 'cash', color: '#6C5CE7', type: 'income' },
      { name: 'Part Time Income', icon: 'time', color: '#00B894', type: 'income' }
    ];

    let addedCount = 0;
    let skippedCount = 0;

    for (const category of newCategories) {
      // Check if category already exists
      const existing = await db.query(
        "SELECT id FROM categories WHERE name = $1 AND type = $2",
        [category.name, category.type]
      );

      if (existing.rows.length > 0) {
        logger.info(`Category "${category.name}" already exists, skipping...`);
        skippedCount++;
        continue;
      }

      // Insert the category
      await db.query(`
        INSERT INTO categories (id, user_id, name, icon, color, type, is_default, is_active, sort_order, created_at, updated_at) 
        VALUES (gen_random_uuid(), NULL, $1, $2, $3, $4, true, true, 999, NOW(), NOW())
        ON CONFLICT DO NOTHING
      `, [category.name, category.icon, category.color, category.type]);

      logger.info(`✅ Category "${category.name}" added successfully`);
      addedCount++;
    }

    return res.json({
      success: true,
      message: `Categories processed: ${addedCount} added, ${skippedCount} already existed`,
      data: {
        added: addedCount,
        skipped: skippedCount,
        total: addedCount + skippedCount
      }
    });
  } catch (error) {
    logger.error('Error adding missing categories:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return res.status(500).json({
      success: false,
      message: 'Failed to add missing categories',
      error: process.env.NODE_ENV === 'development' ? errorMessage : 'Internal server error'
    });
  }
});

export default router;
