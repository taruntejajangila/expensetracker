import express from 'express';
import { body, validationResult } from 'express-validator';
import { authenticateToken } from '../middleware/auth';
import AnalyticsService from '../services/analyticsService';
import { logger } from '../utils/logger';

const router = express.Router();
const analyticsService = AnalyticsService.getInstance();

// Apply authentication middleware to all routes
router.use(authenticateToken);

// GET /api/analytics/summary - Get comprehensive analytics summary
router.get('/summary', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Fetching analytics summary for user: ${userId}`);
    
    const summary = await analyticsService.getAnalyticsSummary(userId);
    
    logger.info(`Analytics summary fetched successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: summary,
      message: 'Analytics summary retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching analytics summary:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics summary',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/trends - Get spending trends
router.get('/trends', [
  body('months').optional().isInt({ min: 1, max: 24 }).withMessage('Months must be between 1 and 24')
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const months = parseInt(req.query.months as string) || 6;
    
    logger.info(`Fetching spending trends for user: ${userId}, months: ${months}`);
    
    const trends = await analyticsService.getSpendingTrends(userId, months);
    
    logger.info(`Spending trends fetched successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: trends,
      message: 'Spending trends retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching spending trends:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch spending trends',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/category-insights - Get category insights
router.get('/category-insights', [
  body('months').optional().isInt({ min: 1, max: 12 }).withMessage('Months must be between 1 and 12')
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

    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    const months = parseInt(req.query.months as string) || 3;
    
    logger.info(`Fetching category insights for user: ${userId}, months: ${months}`);
    
    const insights = await analyticsService.getCategoryInsights(userId, months);
    
    logger.info(`Category insights fetched successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: insights,
      message: 'Category insights retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching category insights:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch category insights',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/health-score - Get financial health score
router.get('/health-score', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Calculating financial health score for user: ${userId}`);
    
    const healthScore = await analyticsService.getFinancialHealthScore(userId);
    
    logger.info(`Financial health score calculated successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: healthScore,
      message: 'Financial health score calculated successfully'
    });
  } catch (error) {
    logger.error('Error calculating financial health score:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to calculate financial health score',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/prediction - Get spending prediction
router.get('/prediction', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Generating spending prediction for user: ${userId}`);
    
    const prediction = await analyticsService.getSpendingPrediction(userId);
    
    logger.info(`Spending prediction generated successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: prediction,
      message: 'Spending prediction generated successfully'
    });
  } catch (error) {
    logger.error('Error generating spending prediction:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to generate spending prediction',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// GET /api/analytics/overview - Get quick overview (lightweight)
router.get('/overview', async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: 'User not authenticated' });
    }

    logger.info(`Fetching analytics overview for user: ${userId}`);
    
    // Get only essential data for quick overview
    const [healthScore, prediction] = await Promise.all([
      analyticsService.getFinancialHealthScore(userId),
      analyticsService.getSpendingPrediction(userId)
    ]);
    
    const overview = {
      healthScore: healthScore.overallScore,
      grade: healthScore.grade,
      nextMonthPrediction: prediction.nextMonthPrediction,
      confidence: prediction.confidence,
      topRecommendation: healthScore.recommendations[0] || 'Keep up the good work!'
    };
    
    logger.info(`Analytics overview fetched successfully for user: ${userId}`);
    
    return res.json({
      success: true,
      data: overview,
      message: 'Analytics overview retrieved successfully'
    });
  } catch (error) {
    logger.error('Error fetching analytics overview:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
