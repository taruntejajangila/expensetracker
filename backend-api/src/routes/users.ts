import express from 'express';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// GET /api/users/profile - Get user profile
router.get('/profile', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      id: req.user?.id || 'mock-id',
      name: 'Mock User',
      email: req.user?.email || 'mock@example.com'
    }
  });
});

export default router;
