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
    // Check if table exists first
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_settings'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      // Table doesn't exist yet, return default values
      logger.warn('app_settings table does not exist yet, returning default values');
      return res.json({
        success: true,
        data: {
          email: 'support@mypaisa.com',
          phone: '+91 98765 43210',
          hours: 'Mon-Fri 9AM-6PM',
          legalEmail: 'legal@mypaisa.com',
          privacyEmail: 'privacy@mypaisa.com',
          showEmail: true,
          showPhone: true,
          showHours: true
        }
      });
    }

    const result = await client.query(`
      SELECT setting_key, setting_value 
      FROM app_settings 
      WHERE setting_key IN ('contact_email', 'contact_phone', 'contact_hours', 'legal_email', 'privacy_email', 'contact_email_visible', 'contact_phone_visible', 'contact_hours_visible')
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
        privacyEmail: contactInfo.privacy_email || 'privacy@mypaisa.com',
        showEmail: contactInfo.contact_email_visible !== 'false',
        showPhone: contactInfo.contact_phone_visible !== 'false',
        showHours: contactInfo.contact_hours_visible !== 'false'
      }
    });
  } catch (error) {
    logger.error('Error fetching contact information:', error);
    // Return default values on error
    return res.json({
      success: true,
      data: {
        email: 'support@mypaisa.com',
        phone: '+91 98765 43210',
        hours: 'Mon-Fri 9AM-6PM',
        legalEmail: 'legal@mypaisa.com',
        privacyEmail: 'privacy@mypaisa.com',
        showEmail: true,
        showPhone: true,
        showHours: true
      }
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
    // Check if table exists first
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'app_settings'
      )
    `);

    if (!tableCheck.rows[0].exists) {
      return res.status(503).json({
        success: false,
        message: 'app_settings table does not exist yet. Please wait for the migration to complete or contact system administrator.'
      });
    }

    const { email, phone, hours, legalEmail, privacyEmail, showEmail, showPhone, showHours } = req.body;

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

    // Update visibility flags
    if (showEmail !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_email_visible', $1, 'boolean', 'Show email in mobile app', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [showEmail ? 'true' : 'false']
        )
      );
    }

    if (showPhone !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_phone_visible', $1, 'boolean', 'Show phone in mobile app', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [showPhone ? 'true' : 'false']
        )
      );
    }

    if (showHours !== undefined) {
      updates.push(
        client.query(
          `INSERT INTO app_settings (setting_key, setting_value, setting_type, description, updated_at)
           VALUES ('contact_hours_visible', $1, 'boolean', 'Show hours in mobile app', NOW())
           ON CONFLICT (setting_key) DO UPDATE SET setting_value = $1, updated_at = NOW()`,
          [showHours ? 'true' : 'false']
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
      WHERE setting_key IN ('contact_email', 'contact_phone', 'contact_hours', 'legal_email', 'privacy_email', 'contact_email_visible', 'contact_phone_visible', 'contact_hours_visible')
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
        privacyEmail: contactInfo.privacy_email || privacyEmail,
        showEmail: contactInfo.contact_email_visible !== 'false',
        showPhone: contactInfo.contact_phone_visible !== 'false',
        showHours: contactInfo.contact_hours_visible !== 'false'
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

