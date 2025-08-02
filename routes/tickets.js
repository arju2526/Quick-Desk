const express = require('express');
const { body, validationResult } = require('express-validator');
const Ticket = require('../models/Ticket');
const Category = require('../models/Category');
const { protect, authorize, canAccessTicket } = require('../middleware/auth');
const { upload, handleUploadError } = require('../middleware/upload');

const router = express.Router();

// @route   POST /api/tickets
// @desc    Create a new ticket
// @access  Private
router.post('/', protect, upload.array('attachments', 5), handleUploadError, [
  body('subject').trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('category').isMongoId().withMessage('Valid category ID is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, description, category, priority, tags } = req.body;

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists || !categoryExists.isActive) {
      return res.status(400).json({ message: 'Invalid category' });
    }

    // Prepare attachments
    const attachments = req.files ? req.files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size,
      uploadedBy: req.user._id
    })) : [];

    const ticket = await Ticket.create({
      subject,
      description,
      category,
      priority: priority || 'medium',
      createdBy: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      attachments
    });

    const populatedTicket = await Ticket.findById(ticket._id)
      .populate('category', 'name color')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.status(201).json(populatedTicket);
  } catch (error) {
    console.error('Create ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tickets
// @desc    Get all tickets with filtering and pagination
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      status,
      priority,
      category,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      assignedTo,
      createdBy
    } = req.query;

    const query = {};

    // Role-based filtering
    if (req.user.role === 'user') {
      query.createdBy = req.user._id;
    } else if (req.user.role === 'agent') {
      if (assignedTo === 'me') {
        query.assignedTo = req.user._id;
      }
    }

    // Apply filters
    if (status) query.status = status;
    if (priority) query.priority = priority;
    if (category) query.category = category;
    if (createdBy) query.createdBy = createdBy;

    // Search functionality
    if (search) {
      query.$or = [
        { subject: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const tickets = await Ticket.find(query)
      .populate('category', 'name color')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .sort(sortOptions)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Ticket.countDocuments(query);

    res.json({
      tickets,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/tickets/:id
// @desc    Get single ticket
// @access  Private
router.get('/:id', protect, canAccessTicket, async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id)
      .populate('category', 'name color')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email')
      .populate('comments.author', 'name email avatar')
      .populate('upvotes', 'name')
      .populate('downvotes', 'name');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    res.json(ticket);
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/tickets/:id
// @desc    Update ticket
// @access  Private
router.put('/:id', protect, canAccessTicket, [
  body('subject').optional().trim().isLength({ min: 5, max: 200 }).withMessage('Subject must be between 5 and 200 characters'),
  body('description').optional().trim().isLength({ min: 10 }).withMessage('Description must be at least 10 characters'),
  body('status').optional().isIn(['open', 'in-progress', 'resolved', 'closed']).withMessage('Invalid status'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority level'),
  body('assignedTo').optional().isMongoId().withMessage('Valid user ID is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { subject, description, status, priority, assignedTo, category } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only allow updates based on user role
    const isOwner = ticket.createdBy.toString() === req.user._id.toString();
    const isAssigned = ticket.assignedTo && ticket.assignedTo.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAgent = req.user.role === 'agent';

    // Users can only update their own tickets (subject, description)
    if (req.user.role === 'user' && !isOwner) {
      return res.status(403).json({ message: 'Not authorized to update this ticket' });
    }

    // Agents and admins can update status, priority, assignment
    if (isAgent || isAdmin || isAssigned) {
      if (status) ticket.status = status;
      if (priority) ticket.priority = priority;
      if (assignedTo) ticket.assignedTo = assignedTo;
    }

    // Anyone can update basic info if they have access
    if (subject) ticket.subject = subject;
    if (description) ticket.description = description;
    if (category) ticket.category = category;

    const updatedTicket = await ticket.save();

    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('category', 'name color')
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    res.json(populatedTicket);
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets/:id/comments
// @desc    Add comment to ticket
// @access  Private
router.post('/:id/comments', protect, canAccessTicket, [
  body('content').trim().isLength({ min: 1 }).withMessage('Comment content is required'),
  body('isInternal').optional().isBoolean().withMessage('isInternal must be a boolean')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { content, isInternal = false } = req.body;
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Only agents and admins can add internal comments
    if (isInternal && !['agent', 'admin'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Not authorized to add internal comments' });
    }

    ticket.comments.push({
      content,
      author: req.user._id,
      isInternal
    });

    await ticket.save();

    const updatedTicket = await Ticket.findById(ticket._id)
      .populate('comments.author', 'name email avatar');

    res.json(updatedTicket.comments[updatedTicket.comments.length - 1]);
  } catch (error) {
    console.error('Add comment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/tickets/:id/vote
// @desc    Vote on ticket (upvote/downvote)
// @access  Private
router.post('/:id/vote', protect, async (req, res) => {
  try {
    const { voteType } = req.body; // 'upvote' or 'downvote'
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const userId = req.user._id.toString();
    const upvoteIndex = ticket.upvotes.findIndex(id => id.toString() === userId);
    const downvoteIndex = ticket.downvotes.findIndex(id => id.toString() === userId);

    if (voteType === 'upvote') {
      if (upvoteIndex > -1) {
        // Remove upvote
        ticket.upvotes.splice(upvoteIndex, 1);
      } else {
        // Add upvote, remove downvote if exists
        ticket.upvotes.push(req.user._id);
        if (downvoteIndex > -1) {
          ticket.downvotes.splice(downvoteIndex, 1);
        }
      }
    } else if (voteType === 'downvote') {
      if (downvoteIndex > -1) {
        // Remove downvote
        ticket.downvotes.splice(downvoteIndex, 1);
      } else {
        // Add downvote, remove upvote if exists
        ticket.downvotes.push(req.user._id);
        if (upvoteIndex > -1) {
          ticket.upvotes.splice(upvoteIndex, 1);
        }
      }
    } else {
      return res.status(400).json({ message: 'Invalid vote type' });
    }

    await ticket.save();

    res.json({
      upvotes: ticket.upvotes.length,
      downvotes: ticket.downvotes.length,
      voteCount: ticket.voteCount
    });
  } catch (error) {
    console.error('Vote error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/tickets/:id
// @desc    Delete ticket (admin only)
// @access  Private
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    await ticket.remove();
    res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 