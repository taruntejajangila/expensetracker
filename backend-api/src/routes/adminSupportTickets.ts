import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import pool from '../config/database';
import notificationService from '../services/notificationService';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure multer for file uploads (same as supportTickets)
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

const router = Router();

// Middleware to check if user is admin
const isAdmin = (req: Request, res: Response, next: any): void => {
  const user = (req as any).user;
  if (user.role !== 'admin' && user.role !== 'super_admin') {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.'
    });
    return;
  }
  next();
};

// Get all support tickets (admin only)
router.get('/', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { status, priority, page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    let query = `
      SELECT 
        st.*,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        (SELECT COUNT(*) FROM ticket_messages WHERE ticket_id = st.id) as message_count,
        (SELECT created_at FROM ticket_messages WHERE ticket_id = st.id ORDER BY created_at DESC LIMIT 1) as last_message_at
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE 1=1
    `;

    const queryParams: any[] = [];
    let paramCounter = 1;

    if (status) {
      query += ` AND st.status = $${paramCounter}`;
      queryParams.push(status);
      paramCounter++;
    }

    if (priority) {
      query += ` AND st.priority = $${paramCounter}`;
      queryParams.push(priority);
      paramCounter++;
    }

    // Get total count
    const countResult = await client.query(
      `SELECT COUNT(*) FROM (${query}) as count_query`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Add pagination
    query += ` ORDER BY 
      CASE st.status 
        WHEN 'open' THEN 1 
        WHEN 'in_progress' THEN 2 
        WHEN 'resolved' THEN 3 
        WHEN 'closed' THEN 4 
      END,
      st.created_at DESC
      LIMIT $${paramCounter} OFFSET $${paramCounter + 1}`;
    
    queryParams.push(Number(limit), offset);

    const result = await client.query(query, queryParams);

    // Get statistics
    const statsResult = await client.query(`
      SELECT 
        status,
        COUNT(*) as count
      FROM support_tickets
      GROUP BY status
    `);

    const stats = {
      total: totalCount,
      byStatus: statsResult.rows.reduce((acc: any, row: any) => {
        acc[row.status] = parseInt(row.count);
        return acc;
      }, {})
    };

    return res.json({
      success: true,
      data: result.rows,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: totalCount,
        totalPages: Math.ceil(totalCount / Number(limit))
      },
      stats
    });

  } catch (error) {
    console.error('Error fetching admin tickets:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tickets',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Get ticket details (admin only)
router.get('/:ticketId', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;

    // Get ticket details
    const ticketResult = await client.query(
      `SELECT 
        st.id,
        st.user_id,
        st.ticket_number,
        st.subject,
        st.description,
        st.status,
        st.priority,
        st.category,
        st.created_at,
        st.updated_at,
        CONCAT(u.first_name, ' ', u.last_name) as user_name,
        u.email as user_email,
        u.phone as user_phone
      FROM support_tickets st
      LEFT JOIN users u ON st.user_id = u.id
      WHERE st.id = $1`,
      [ticketId]
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
      `SELECT 
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
        stm.admin_id as user_id,
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

// Update ticket status (admin only)
router.patch('/:ticketId/status', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { status } = req.body;

    if (!status || !['open', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid status'
      });
    }

    const resolvedAt = status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'resolved_at';

    const result = await client.query(
      `UPDATE support_tickets 
       SET status = $1, 
           resolved_at = ${status === 'resolved' ? 'CURRENT_TIMESTAMP' : 'resolved_at'},
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [status, ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    return res.json({
      success: true,
      message: 'Ticket status updated successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update ticket status',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Assign ticket to admin (admin only)
router.patch('/:ticketId/assign', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { adminId } = req.body;
    const currentAdminId = (req as any).user.id;

    // If no adminId provided, assign to self
    const assignTo = adminId || currentAdminId;

    const result = await client.query(
      `UPDATE support_tickets 
       SET assigned_to = $1, updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [assignTo, ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    return res.json({
      success: true,
      message: 'Ticket assigned successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error assigning ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to assign ticket',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Add admin reply to ticket
router.post('/:ticketId/reply', authenticateToken, isAdmin, upload.array('attachments', 3), async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { message } = req.body;
    const adminId = (req as any).user.id;
    const files = req.files as Express.Multer.File[];

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required'
      });
    }

    // Validate ticket ID format (UUID)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(ticketId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid ticket ID format'
      });
    }

    // Check if ticket exists
    const ticketCheck = await client.query(
      'SELECT id FROM support_tickets WHERE id = $1',
      [ticketId]
    );

    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Support ticket not found'
      });
    }

    // Validate that admin user exists in database
    const adminCheck = await client.query(
      'SELECT id FROM users WHERE id = $1',
      [adminId]
    );

    if (adminCheck.rows.length === 0) {
      console.error(`❌ Admin user not found in database: ${adminId}`);
      return res.status(400).json({
        success: false,
        message: 'Admin user not found. Please log in again.'
      });
    }

    // Add message (admin replies go to support_ticket_messages table)
    const result = await client.query(
      `INSERT INTO support_ticket_messages (ticket_id, admin_id, message)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [ticketId, adminId, message]
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
      console.log(`✅ ${files.length} attachment(s) added to admin reply`);
    }

    // Update ticket updated_at and status if needed
    await client.query(
      `UPDATE support_tickets 
       SET updated_at = CURRENT_TIMESTAMP,
           status = CASE WHEN status = 'open' THEN 'in_progress' ELSE status END
       WHERE id = $1`,
      [ticketId]
    );

    // Get ticket details for logging
    const ticketDetails = await client.query(
      `SELECT st.*, CONCAT(u.first_name, ' ', u.last_name) as user_name, u.email as user_email 
       FROM support_tickets st 
       JOIN users u ON st.user_id = u.id 
       WHERE st.id = $1`,
      [ticketId]
    );

    // Log admin reply for tracking
    if (ticketDetails.rows.length > 0) {
      const ticket = ticketDetails.rows[0];
      console.log(`✅ Admin reply added to ticket ${ticket.ticket_number} for user ${ticket.user_email}`);
    }

    return res.status(201).json({
      success: true,
      message: 'Reply added successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error adding reply to ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to add reply',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

// Update ticket resolution (admin only)
router.patch('/:ticketId/resolution', authenticateToken, isAdmin, async (req: Request, res: Response) => {
  const client = await pool.connect();
  
  try {
    const { ticketId } = req.params;
    const { resolution } = req.body;

    if (!resolution) {
      return res.status(400).json({
        success: false,
        message: 'Resolution is required'
      });
    }

    const result = await client.query(
      `UPDATE support_tickets 
       SET resolution = $1, 
           status = 'resolved',
           resolved_at = CURRENT_TIMESTAMP,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = $2
       RETURNING *`,
      [resolution, ticketId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found'
      });
    }

    return res.json({
      success: true,
      message: 'Ticket resolved successfully',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error resolving ticket:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to resolve ticket',
      error: (error as Error).message
    });
  } finally {
    client.release();
  }
});

export default router;

