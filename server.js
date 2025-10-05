// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Joi = require('joi');
// const helmet = require('helmet'); // TODO: Add security headers

const app = express();

// Configuration - moved these to make them easier to find
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production';
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/helpdesk_mini';

// Basic middleware setup
app.use(cors()); // TODO: Restrict origins in production
app.use(express.json({ limit: '10mb' })); // Generous limit for now

// Simple rate limiting - might need to adjust based on usage
const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // Should be enough for normal usage
  message: {
    error: {
      code: 'RATE_LIMIT',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

// Debug middleware - helps with troubleshooting
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  
  // Log request body but keep it safe
  if (req.body && Object.keys(req.body).length > 0) {
    const safeBody = { ...req.body };
    if (safeBody.password) safeBody.password = '[REDACTED]';
    console.log('Body:', safeBody);
  }
  next();
});

// Database connection - took a while to get the connection string right
mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ Connected to MongoDB successfully');
  // TODO: Add database health check endpoint
})
.catch(err => {
  console.error('❌ MongoDB connection error:', err);
  // Don't exit in development, but should in production
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
});

// ========================
// DATABASE MODELS
// ========================

// User model - pretty standard stuff
const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
    // TODO: Add email validation regex
  },
  password: {
    type: String,
    required: true,
    minlength: 6 // Should probably be 8, but 6 is fine for now
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['user', 'agent', 'admin'],
    default: 'user'
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

// Ticket Model
const ticketSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'closed'],
    default: 'open'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  slaDeadline: {
    type: Date,
    default: function() {
      return new Date(Date.now() + 48 * 60 * 60 * 1000); // 48 hours from now
    }
  }
}, {
  timestamps: true,
  versionKey: '__v'
});

// SLA deadline is set by default function in schema

const Ticket = mongoose.model('Ticket', ticketSchema);

// Comment Model
const commentSchema = new mongoose.Schema({
  ticketId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Ticket',
    required: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  }
}, {
  timestamps: true
});

const Comment = mongoose.model('Comment', commentSchema);

// ========================
// MIDDLEWARE FUNCTIONS
// ========================

// Error formatting middleware
const formatError = (code, message, field = null) => {
  const error = { code, message };
  if (field) error.field = field;
  return { error };
};

// JWT middleware - handles token verification
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json(formatError('UNAUTHORIZED', 'Access token is required'));
  }

  // Verify the JWT token
  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      console.log('JWT verification failed:', err.message); // Debug log
      return res.status(403).json(formatError('FORBIDDEN', 'Invalid or expired token'));
    }
    
    // Attach user info to request
    req.user = decoded;
    next();
  });
};

// Role-based authorization middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json(formatError('FORBIDDEN', 'Insufficient permissions'));
    }
    next();
  };
};

// Idempotency middleware (simple in-memory store, use Redis in production)
const idempotencyStore = new Map();
const checkIdempotency = (req, res, next) => {
  const key = req.headers['idempotency-key'];
  if (!key) {
    return next();
  }

  if (idempotencyStore.has(key)) {
    return res.json(idempotencyStore.get(key));
  }

  const originalSend = res.json;
  res.json = function(data) {
    if (res.statusCode >= 200 && res.statusCode < 300) {
      idempotencyStore.set(key, data);
      // Clean up old keys after 1 hour
      setTimeout(() => idempotencyStore.delete(key), 60 * 60 * 1000);
    }
    return originalSend.call(this, data);
  };

  next();
};

// ========================
// VALIDATION SCHEMAS
// ========================

const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().min(2).max(50).required(),
  role: Joi.string().valid('user', 'agent', 'admin').optional()
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

const ticketValidationSchema = Joi.object({
  title: Joi.string().max(200).required(),
  description: Joi.string().max(2000).required()
});

const ticketUpdateValidationSchema = Joi.object({
  title: Joi.string().max(200).optional(),
  description: Joi.string().max(2000).optional(),
  status: Joi.string().valid('open', 'in_progress', 'closed').optional(),
  assignedTo: Joi.string().optional().allow(null, ''),
  __v: Joi.number().optional()  // Allow __v for optimistic locking
});

const commentValidationSchema = Joi.object({
  text: Joi.string().max(1000).required()
});

// ========================
// AUTHENTICATION ROUTES
// ========================

// Register
app.post('/auth/register', async (req, res) => {
  try {
    const { error } = registerSchema.validate(req.body);
    if (error) {
      const field = error.details[0].path[0];
      return res.status(400).json(formatError('FIELD_VALIDATION', error.details[0].message, field));
    }

    const { email, password, name, role = 'user' } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(formatError('USER_EXISTS', 'User with this email already exists', 'email'));
    }

    const user = new User({ email, password, name, role });
    await user.save();

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { error } = loginSchema.validate(req.body);
    if (error) {
      const field = error.details[0].path[0];
      return res.status(400).json(formatError('FIELD_VALIDATION', error.details[0].message, field));
    }

    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json(formatError('INVALID_CREDENTIALS', 'Invalid email or password'));
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// ========================
// TICKET ROUTES
// ========================

// Create ticket
app.post('/api/tickets', authenticateToken, checkIdempotency, async (req, res) => {
  try {
    const { error } = ticketValidationSchema.validate(req.body);
    if (error) {
      const field = error.details[0].path[0];
      return res.status(400).json(formatError('FIELD_VALIDATION', error.details[0].message, field));
    }

    const { title, description } = req.body;

    const ticket = new Ticket({
      title,
      description,
      createdBy: req.user.userId
    });

    await ticket.save();
    await ticket.populate('createdBy', 'name email');

    res.status(201).json({
      message: 'Ticket created successfully',
      ticket
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// Get tickets with pagination and search
app.get('/api/tickets', authenticateToken, async (req, res) => {
  try {
    const limit = Math.min(parseInt(req.query.limit) || 10, 100);
    const offset = parseInt(req.query.offset) || 0;
    const search = req.query.q || '';

    console.log(`User ${req.user.email} (${req.user.role}) requesting tickets`);
    
    let query = {};
    
    // Build search query - Enhanced to search in comments as well
    let searchPipeline = [];
    if (search) {
      // For complex search including comments, we'll use aggregation
      searchPipeline = [
        {
          $lookup: {
            from: 'comments',
            localField: '_id',
            foreignField: 'ticketId',
            as: 'comments'
          }
        },
        {
          $match: {
            $or: [
              { title: { $regex: search, $options: 'i' } },
              { description: { $regex: search, $options: 'i' } },
              { 'comments.text': { $regex: search, $options: 'i' } }
            ]
          }
        }
      ];
    }

    let tickets, total;

    if (search && searchPipeline.length > 0) {
      // Use aggregation for search including comments
      let pipeline = [...searchPipeline];
      
      // Add role-based filtering
      let roleMatch = {};
      if (req.user.role === 'user') {
        roleMatch.createdBy = new mongoose.Types.ObjectId(req.user.userId);
      } else if (req.user.role === 'agent') {
        // Agents see all tickets (like admins) to manage helpdesk effectively
        // No additional filtering needed
      }
      
      if (Object.keys(roleMatch).length > 0) {
        pipeline.push({ $match: roleMatch });
      }
      
      // Add sorting, skip, limit
      pipeline.push(
        { $sort: { createdAt: -1 } },
        { $skip: offset },
        { $limit: limit }
      );
      
      // Add population
      pipeline.push(
        {
          $lookup: {
            from: 'users',
            localField: 'createdBy',
            foreignField: '_id',
            as: 'createdBy'
          }
        },
        { $unwind: '$createdBy' },
        {
          $lookup: {
            from: 'users',
            localField: 'assignedTo',
            foreignField: '_id',
            as: 'assignedTo'
          }
        },
        {
          $addFields: {
            assignedTo: { $arrayElemAt: ['$assignedTo', 0] }
          }
        },
        {
          $project: {
            comments: 0, // Remove comments from output to avoid bloating
            'createdBy.password': 0,
            'assignedTo.password': 0
          }
        }
      );
      
      tickets = await Ticket.aggregate(pipeline);
      
      // Get total count for pagination (without skip/limit)
      let countPipeline = [...searchPipeline];
      if (Object.keys(roleMatch).length > 0) {
        countPipeline.push({ $match: roleMatch });
      }
      countPipeline.push({ $count: 'total' });
      const countResult = await Ticket.aggregate(countPipeline);
      total = countResult[0]?.total || 0;
      
    } else {
      // Use regular find for non-search queries
      // Role-based filtering
      if (req.user.role === 'user') {
        query.createdBy = req.user.userId;
      } else if (req.user.role === 'agent') {
        // Agents see all tickets (like admins) to manage helpdesk effectively
        // No additional filtering needed
      }
      // Admins see all tickets (no additional filtering)

      tickets = await Ticket.find(query)
        .populate('createdBy', 'name email')
        .populate('assignedTo', 'name email')
        .sort({ createdAt: -1 })
        .skip(offset)
        .limit(limit);

      total = await Ticket.countDocuments(query);
    }

    res.json({
      tickets,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// Get single ticket
app.get('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json(formatError('NOT_FOUND', 'Ticket not found'));
    }

    // Check access permissions
    if (req.user.role === 'user' && ticket.createdBy._id.toString() !== req.user.userId) {
      return res.status(403).json(formatError('FORBIDDEN', 'Access denied'));
    }

    res.json({ ticket });
  } catch (error) {
    console.error('Get ticket error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json(formatError('INVALID_ID', 'Invalid ticket ID'));
    }
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// Update ticket (with optimistic locking)
app.patch('/api/tickets/:id', authenticateToken, async (req, res) => {
  try {
    const { error } = ticketUpdateValidationSchema.validate(req.body);
    if (error) {
      const field = error.details[0].path[0];
      return res.status(400).json(formatError('FIELD_VALIDATION', error.details[0].message, field));
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json(formatError('NOT_FOUND', 'Ticket not found'));
    }

    // Check optimistic locking
    if (req.body.__v !== undefined && ticket.__v !== req.body.__v) {
      return res.status(409).json(formatError('CONFLICT', 'Ticket has been modified by another user'));
    }

    // Permission checks
    const canUpdate = 
      req.user.role === 'admin' ||
      (req.user.role === 'agent' && (ticket.assignedTo?.toString() === req.user.userId || !ticket.assignedTo)) ||
      (req.user.role === 'user' && ticket.createdBy.toString() === req.user.userId);

    if (!canUpdate) {
      return res.status(403).json(formatError('FORBIDDEN', 'Access denied'));
    }

    // Role-specific update restrictions
    const updates = { ...req.body };
    delete updates.__v; // Remove version key from updates

    if (req.user.role === 'user') {
      // Users can only update title and description of their own tickets
      const allowedFields = ['title', 'description'];
      Object.keys(updates).forEach(key => {
        if (!allowedFields.includes(key)) {
          delete updates[key];
        }
      });
    }

    // Validate assignedTo if being updated
    if (updates.assignedTo !== undefined) {
      if (req.user.role !== 'admin') {
        return res.status(403).json(formatError('FORBIDDEN', 'Only admins can assign tickets'));
      }
      
      if (updates.assignedTo && updates.assignedTo !== '') {
        const assignee = await User.findById(updates.assignedTo);
        if (!assignee || !['agent', 'admin'].includes(assignee.role)) {
          return res.status(400).json(formatError('INVALID_ASSIGNEE', 'Assignee must be an agent or admin'));
        }
      } else {
        updates.assignedTo = null;
      }
    }

    const updatedTicket = await Ticket.findByIdAndUpdate(
      req.params.id,
      { 
        $inc: { __v: 1 },
        $set: updates
      },
      { new: true }
    ).populate('createdBy', 'name email').populate('assignedTo', 'name email');

    res.json({
      message: 'Ticket updated successfully',
      ticket: updatedTicket
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json(formatError('INVALID_ID', 'Invalid ticket ID'));
    }
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// ========================
// USER ROUTES
// ========================

// Get users (for assignment dropdown) - Admin/Agent only
app.get('/api/users', authenticateToken, requireRole(['admin', 'agent']), async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ['agent', 'admin'] } }, // Only agents and admins can be assigned
      'name email role'
    ).sort({ name: 1 });

    res.json({ users });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// ========================
// COMMENT ROUTES
// ========================

// Add comment to ticket
app.post('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { error } = commentValidationSchema.validate(req.body);
    if (error) {
      const field = error.details[0].path[0];
      return res.status(400).json(formatError('FIELD_VALIDATION', error.details[0].message, field));
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json(formatError('NOT_FOUND', 'Ticket not found'));
    }

    // Check access permissions
    const canComment = 
      req.user.role === 'admin' ||
      req.user.role === 'agent' ||
      ticket.createdBy.toString() === req.user.userId;

    if (!canComment) {
      return res.status(403).json(formatError('FORBIDDEN', 'Access denied'));
    }

    const { text } = req.body;

    const comment = new Comment({
      ticketId: req.params.id,
      author: req.user.userId,
      text
    });

    await comment.save();
    await comment.populate('author', 'name email');

    res.status(201).json({
      message: 'Comment added successfully',
      comment
    });
  } catch (error) {
    console.error('Add comment error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json(formatError('INVALID_ID', 'Invalid ticket ID'));
    }
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// Get comments for ticket
app.get('/api/tickets/:id/comments', authenticateToken, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json(formatError('NOT_FOUND', 'Ticket not found'));
    }

    // Check access permissions
    const canView = 
      req.user.role === 'admin' ||
      req.user.role === 'agent' ||
      ticket.createdBy.toString() === req.user.userId;

    if (!canView) {
      return res.status(403).json(formatError('FORBIDDEN', 'Access denied'));
    }

    const comments = await Comment.find({ ticketId: req.params.id })
      .populate('author', 'name email')
      .sort({ createdAt: 1 });

    res.json({ comments });
  } catch (error) {
    console.error('Get comments error:', error);
    if (error.name === 'CastError') {
      return res.status(400).json(formatError('INVALID_ID', 'Invalid ticket ID'));
    }
    res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
  }
});

// ========================
// ROOT AND HEALTH ROUTES
// ========================

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'HelpDesk Mini Backend API is running!',
    version: '1.0.0',
    status: 'OK',
    timestamp: new Date().toISOString(),
    endpoints: {
      auth: {
        register: 'POST /auth/register',
        login: 'POST /auth/login'
      },
      tickets: {
        list: 'GET /api/tickets',
        create: 'POST /api/tickets', 
        details: 'GET /api/tickets/:id',
        update: 'PATCH /api/tickets/:id',
        addComment: 'POST /api/tickets/:id/comments',
        getComments: 'GET /api/tickets/:id/comments'
      },
      users: {
        list: 'GET /api/users'
      },
      system: {
        health: 'GET /health'
      }
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// ========================
// ERROR HANDLING
// ========================

// 404 handler
app.use('*', (req, res) => {
  console.log(`Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json(formatError('NOT_FOUND', `Route ${req.method} ${req.originalUrl} not found`));
});

// Global error handler
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json(formatError('INTERNAL_ERROR', 'Internal server error'));
});

// ========================
// START SERVER
// ========================

app.listen(PORT, () => {
  console.log(`HelpDesk Mini server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;