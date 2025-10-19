import express from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';

const router = express.Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    
    const result = await pool.query(
      `SELECT 
        id, 
        name, 
        email, 
        first_name, 
        last_name, 
        phone, 
        avatar_url, 
        date_of_birth, 
        currency, 
        language, 
        timezone, 
        is_verified, 
        created_at, 
        updated_at 
      FROM users 
      WHERE id = $1`,
      [userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: (error as Error).message
    });
  }
});

// PUT /api/users/profile - Update user profile
router.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = (req as any).user.id;
    const { name, first_name, last_name, phone, avatar_url, date_of_birth, currency, language, timezone } = req.body;

    // Build dynamic update query
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (first_name !== undefined) {
      updateFields.push(`first_name = $${paramIndex++}`);
      values.push(first_name);
    }
    if (last_name !== undefined) {
      updateFields.push(`last_name = $${paramIndex++}`);
      values.push(last_name);
    }
    if (phone !== undefined) {
      updateFields.push(`phone = $${paramIndex++}`);
      values.push(phone);
    }
    if (avatar_url !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex++}`);
      values.push(avatar_url);
    }
    if (date_of_birth !== undefined) {
      updateFields.push(`date_of_birth = $${paramIndex++}`);
      values.push(date_of_birth);
    }
    if (currency !== undefined) {
      updateFields.push(`currency = $${paramIndex++}`);
      values.push(currency);
    }
    if (language !== undefined) {
      updateFields.push(`language = $${paramIndex++}`);
      values.push(language);
    }
    if (timezone !== undefined) {
      updateFields.push(`timezone = $${paramIndex++}`);
      values.push(timezone);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields to update'
      });
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`);
    
    // Add user ID as the last parameter
    values.push(userId);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, name, email, first_name, last_name, phone, avatar_url, date_of_birth, currency, language, timezone, is_verified, created_at, updated_at
    `;

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    return res.json({
      success: true,
      message: 'Profile updated successfully',
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error updating user profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user profile',
      error: (error as Error).message
    });
  }
});

export default router;
