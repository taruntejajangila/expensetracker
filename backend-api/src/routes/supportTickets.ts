import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import { logger } from '../utils/logger';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../../uploads/tickets');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'ticket-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (extname && mimetype) {
      return cb(null, true);
    } else {
      cb(new Error('Only images (JPEG, PNG, GIF) and PDF files are allowed'));
    }
  }
});

// Create a new support ticket
router.post('/', authenticateToken, upload.array('attachments', 5), async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { subject, description, category, priority = 'medium' } = req.body;
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    // Validation
    if (!subject || !description || !category) {
      return res.status(400).json({
        success: false,
        message: 'Subject, description, and category are required'
      });
    }

    // Ensure ticket_number column exists
    try {
      await client.query(`
        ALTER TABLE support_tickets 
        ADD COLUMN IF NOT EXISTS ticket_number VARCHAR(20)
      `);
    } catch (error) {
      console.log('⚠️ Could not add ticket_number column:', (error as Error).message);
    }

    // Generate ticket number
    let ticketNumber: string;
    try {
      const ticketNumberResult = await client.query('SELECT generate_ticket_number() as ticket_number');
      ticketNumber = ticketNumberResult.rows[0].ticket_number;
    } catch (error) {
      // Fallback: generate simple ticket number if function doesn't exist
      console.log('⚠️ generate_ticket_number function not found, using fallback');
      const timestamp = Date.now();
      ticketNumber = `TK${timestamp.toString().slice(-6)}`;
    }

    // Create ticket
    const result = await client.query(
      `INSERT INTO support_tickets (user_id, ticket_number, subject, description, category, priority, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'open')
       RETURNING *`,
      [userId, ticketNumber, subject, description, category, priority]
    );

    const ticket = result.rows[0];

    // Save attachments if any
    if (files && files.length > 0) {
      for (const file of files) {
        const fileUrl = `/uploads/tickets/${file.filename}`;
        await client.query(
          `INSERT INTO ticket_attachments (ticket_id, file_name, file_path, file_type, file_size)
           VALUES ($1, $2, $3, $4, $5)`,
          [ticket.id, file.originalname, fileUrl, file.mimetype, file.size]
        );
      }
      console.log(`✅ ${files.length} attachment(s) saved for ticket ${ticketNumber}`);
    }

    console.log(`✅ Support ticket created: ${ticketNumber} by user ${userId}`);

    // Get user details for admin notification
    const userDetails = await client.query(
      'SELECT CONCAT(first_name, \' \', last_name) as name, email FROM users WHERE id = $1',
      [userId]
    );

    // Log admin notification (for now - can be enhanced with email/dashboard notifications)
    if (userDetails.rows.length > 0) {
      const user = userDetails.rows[0];
      logger.info(`🎫 NEW SUPPORT TICKET - Admin Notification:`, {
        ticketNumber: ticketNumber,
        ticketId: ticket.id,
        subject: subject,
        category: category,
        priority: priority,
        userName: user.name,
        userEmail: user.email,
        createdAt: new Date().toISOString()
      });
      
      // TODO: Send email notification to admin
      // TODO: Send Slack/Discord webhook notification
      // TODO: Add to admin dashboard notification center
    }

    return res.status(201).json({
      success: true,
      message: 'Support ticket created successfully',
      data: ticket
    });

  } catch (error) {
    console.error('Error creating support ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create support ticket',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Get all tickets for the authenticated user
router.get('/my-tickets', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const userId = (req as any).user.id;
    const { status } = req.query;

    let query = `
      SELECT 
        st.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = st.id) as message_count,
        (SELECT created_at FROM ticket_messages WHERE ticket_id = st.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.user_id = $1
    `;

    const queryParams: any[] = [userId];

    if (status) {
      query += ` AND st.status = $2`;
      queryParams.push(status);
    }

    query += ` ORDER BY st.created_at DESC`;

    const result = await client.query(query, queryParams);

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Get a specific ticket details
router.get('/:ticketId', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user.id;

    // Get ticket details
    const ticketResult = await client.query(
      `SELECT 
        st.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        CONCAT(admin.first_name, ' ', admin.last_name) as assigned_to_name
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      LEFT JOIN users admin ON st.assigned_to = admin.id
      WHERE st.id = $1 AND st.user_id = $2`,
      [ticketId, userId]
    );

    if (ticketResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    const ticket = ticketResult.rows[0];

    // Get messages for this ticket (from both user and admin messages)
    const messagesResult = await client.query(
      `      SELECT 
        tm.id,
        tm.ticket_id,
        tm.user_id,
        tm.message,
        tm.is_admin_reply,
        tm.created_at,
        tm.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        'user' as message_type
      FROM ticket_messages tm
      LEFT JOIN users u ON tm.user_id = u.id
      WHERE tm.ticket_id = $1
      
      UNION ALL
      
      SELECT 
        stm.id,
        stm.ticket_id,
        stm.user_id,
        stm.message,
        true as is_admin_reply,
        stm.created_at,
        stm.updated_at,
        CONCAT(au.first_name, ' ', au.last_name) as user_name,
        au.email as user_email,
        'admin' as message_type
      FROM support_ticket_messages stm
      LEFT JOIN users au ON stm.admin_id = au.id
      WHERE stm.ticket_id = $1
      
      ORDER BY created_at ASC`,
      [ticketId]
    );

    const messages = messagesResult.rows;

    // Get all attachments for this ticket
    const attachmentsResult = await client.query(
      `SELECT id, message_id, file_name, file_path, file_type, file_size, created_at
       FROM ticket_attachments
       WHERE ticket_id = $1
       ORDER BY created_at ASC`,
      [ticketId]
    );

    // Group attachments by message_id
    const attachmentsByMessage = attachmentsResult.rows.reduce((acc: any, att: any) => {
      if (att.message_id) {
        if (!acc[att.message_id]) acc[att.message_id] = [];
        acc[att.message_id].push(att);
      }
      return acc;
    }, {});

    // Attach message-specific attachments to each message
    messages.forEach((msg: any) => {
      msg.attachments = attachmentsByMessage[msg.id] || [];
    });

    ticket.messages = messages;

    // Get ticket-level attachments (no message_id) for the info card
    ticket.attachments = attachmentsResult.rows.filter((att: any) => !att.message_id);

    return res.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching ticket details:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch ticket details',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Add a message to a ticket
router.post('/:ticketId/messages', authenticateToken, upload.array('attachments', 3), async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const userId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Verify ticket belongs to user
    const ticketCheck = await client.query(
      'SELECT id FROM support_tickets WHERE id = $1 AND user_id = $2',
      [ticketId, userId]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    // Add message
    const result = await client.query(
      `INSERT INTO ticket_messages (ticket_id, user_id, message, is_admin_reply)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [ticketId, userId, message]
    );

    // Save message attachments if any
    if (files && files.length > 0) {
      const messageId = result.rows[0].id;
      for (const file of files) {
        const fileUrl = `/uploads/tickets/${file.filename}`;
        await client.query(
          `INSERT INTO ticket_attachments (ticket_id, message_id, file_name, file_path, file_type, file_size)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [ticketId, messageId, file.originalname, fileUrl, file.mimetype, file.size]
        );
      }
      console.log(`✅ ${files.length} attachment(s) added to message`);
    }

    // Update ticket updated_at
    await client.query(
      'UPDATE support_tickets SET updated_at = CURRENT_TIMESTAMP WHERE id = $1',
      [ticketId]
    );

    // Get ticket and user details for admin notification
    const ticketDetails = await client.query(
      `SELECT st.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
       FROM support_tickets st 
       JOIN users u ON st.user_id = u.id 
       WHERE st.id = $1`,
      [ticketId]
    );

    // Log admin notification for new user message
    if (ticketDetails.rows.length > 0) {
      const ticket = ticketDetails.rows[0];
      logger.info(`💬 NEW USER MESSAGE - Admin Notification:`, {
        ticketNumber: ticket.ticket_number,
        ticketId: ticketId,
        subject: ticket.subject,
        message: message.substring(0, 100),
        userName: ticket.user_name,
        userEmail: ticket.user_email,
        timestamp: new Date().toISOString()
      });
      
      // TODO: Send email notification to admin
      // TODO: Send Slack/Discord webhook notification
      // TODO: Update admin dashboard with unread count
    }

    return res.status(201).json({
      success: true,
      message: 'Message added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding message to ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add message',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Close a ticket (user can close their own ticket)
router.patch('/:ticketId/close', authenticateToken, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const userId = (req as any).user.id;

    const result = await client.query(
      `UPDATE support_tickets 
       SET status = 'closed', updated_at = CURRENT_TIMESTAMP
       WHERE id = $1 AND user_id = $2
       RETURNING *`,
      [ticketId, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    return res.json({
      success: true,
      message: 'Ticket closed successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error closing ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to close ticket',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

export default router;

