import { Router, Request, Response } from 'express';
import { authenticateToken, requireAdmin } from '../middleware/auth';
import { getPool } from '../config/database';
import { logger } from '../utils/logger';

const router = Router();

// GET /api/app-settings/contact - Get contact information (public endpoint)
router.get('/contact', async (req: Request, res: Response) => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT setting_key, setting_value 
      FROM app_settings 
      WHERE setting_key IN ('contact_email', 'contact_phone', 'contact_hours', 'legal_email', 'privacy_email')
    `);

    // Convert rows to object
    const contactInfo: any = {};
    result.rows.forEach((row: any) => {
      contactInfo[row.setting_key] = row.setting_value;
    });

    // Return with default values if not found
    return res.json({
      success: true,
      data: {
        email: contactInfo.contact_email || 'support@mypaisa.com',
        phone: contactInfo.contact_phone || '+91 98765 43210',
        hours: contactInfo.contact_hours || 'Mon-Fri 9AM-6PM',
        legalEmail: contactInfo.legal_email || 'legal@mypaisa.com',
        privacyEmail: contactInfo.privacy_email || 'privacy@mypaisa.com'
      }
    });
  } catch (error) {
    logger.error('Error fetching contact information:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch contact information',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// GET /api/app-settings - Get all app settings (admin only)
router.get('/', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const result = await client.query(`
      SELECT setting_key, setting_value, setting_type, description, updated_at
      FROM app_settings
      ORDER BY setting_key
    `);

    return res.json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    logger.error('Error fetching app settings:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch app settings',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// PUT /api/app-settings/contact - Update contact information (admin only)
router.put('/contact', authenticateToken, requireAdmin, async (req: Request, res: Response) => {
  const pool = getPool();
  const client = await pool.connect();
  
  try {
    const { email, phone, hours, legalEmail, privacyEmail } = req.body;

    // Update each setting
    const updates: Promise<any>[] = [];

    if (email !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_email', $1, 'text', 'Support email address', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [email]
        )
      );
    }

    if (phone !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_phone', $1, 'text', 'Support phone number', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [phone]
        )
      );
    }

    if (hours !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_hours', $1, 'text', 'Support hours', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [hours]
        )
      );
    }

    if (legalEmail !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('legal_email', $1, 'text', 'Legal inquiries email', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [legalEmail]
        )
      );
    }

    if (privacyEmail !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('privacy_email', $1, 'text', 'Privacy inquiries email', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [privacyEmail]
        )
      );
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No fields provided to update'
      });
    }

    await Promise.all(updates);

    // Fetch updated settings
    const result = await client.query(`
      SELECT setting_key, setting_value 
      FROM app_settings 
      WHERE setting_key IN ('contact_email', 'contact_phone', 'contact_hours', 'legal_email', 'privacy_email')
    `);

    const contactInfo: any = {};
    result.rows.forEach((row: any) => {
      contactInfo[row.setting_key] = row.setting_value;
    });

    logger.info('Contact information updated by admin');

    return res.json({
      success: true,
      message: 'Contact information updated successfully',
      data: {
        email: contactInfo.contact_email || email,
        phone: contactInfo.contact_phone || phone,
        hours: contactInfo.contact_hours || hours,
        legalEmail: contactInfo.legal_email || legalEmail,
        privacyEmail: contactInfo.privacy_email || privacyEmail
      }
    });
  } catch (error) {
    logger.error('Error updating contact information:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update contact information',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

export default router;

