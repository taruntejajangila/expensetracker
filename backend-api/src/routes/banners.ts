import express from 'express';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

const router = express.Router();

// GET /api/banners/public - Public endpoint for mobile app to fetch active banners
router.get('/public', async (req, res) => {
  try {
    const pool = getPool();
    
    const bannersQuery = `
      SELECT 
        id,
        title,
        subtitle,
        description,
        image_url,
        target_url,
        background_color,
        text_color,
        icon,
        sort_order
      FROM active_banners
      ORDER BY sort_order ASC, created_at DESC
    `;

    const result = await pool.query(bannersQuery);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching public banners:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch banners'
    });
  }
});

// POST /api/banners/analytics - Track banner interactions (public endpoint)
router.post('/analytics', async (req, res) => {
  try {
    const { banner_id, action_type, device_info, location_info } = req.body;

    if (!banner_id || !action_type) {
      return res.status(400).json({
        success: false,
        message: 'Banner ID and action type are required'
      });
    }

    const pool = getPool();

    const insertQuery = `
      INSERT INTO banner_analytics (banner_id, user_id, action_type, device_info, location_info)
      VALUES ($1, $2, $3, $4, $5)
    `;

    await pool.query(insertQuery, [
      banner_id,
      req.user?.id || null, // Optional user ID for logged-in users
      action_type,
      JSON.stringify(device_info || {}),
      JSON.stringify(location_info || {})
    ]);

    // Return minimal response for analytics
    return res.status(200).json({ success: true });
  } catch (error) {
    logger.error('Error recording banner analytics:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to record analytics'
    });
  }
});

export default router;
