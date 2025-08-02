const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  content: {
    type: String,
    required: [true, 'Comment content is required'],
    trim: true
  },
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isInternal: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const ticketSchema = new mongoose.Schema({
  subject: {
    type: String,
    required: [true, 'Ticket subject is required'],
    trim: true,
    maxlength: [200, 'Subject cannot be more than 200 characters']
  },
  description: {
    type: String,
    required: [true, 'Ticket description is required'],
    trim: true
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: [true, 'Category is required']
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed'],
    default: 'open'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  attachments: [{
    filename: String,
    originalName: String,
    path: String,
    size: Number,
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  comments: [commentSchema],
  upvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downvotes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  tags: [{
    type: String,
    trim: true
  }],
  isUrgent: {
    type: Boolean,
    default: false
  },
  dueDate: {
    type: Date
  },
  resolvedAt: {
    type: Date
  },
  closedAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better query performance
ticketSchema.index({ status: 1, priority: 1 });
ticketSchema.index({ createdBy: 1 });
ticketSchema.index({ assignedTo: 1 });
ticketSchema.index({ category: 1 });
ticketSchema.index({ createdAt: -1 });
ticketSchema.index({ updatedAt: -1 });

// Virtual for vote count
ticketSchema.virtual('voteCount').get(function() {
  return this.upvotes.length - this.downvotes.length;
});

// Virtual for comment count
ticketSchema.virtual('commentCount').get(function() {
  return this.comments.length;
});

// Ensure virtuals are serialized
ticketSchema.set('toJSON', { virtuals: true });
ticketSchema.set('toObject', { virtuals: true });

// Update resolvedAt when status changes to resolved
ticketSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (this.status === 'resolved' && !this.resolvedAt) {
      this.resolvedAt = new Date();
    } else if (this.status === 'closed' && !this.closedAt) {
      this.closedAt = new Date();
    }
  }
  next();
});

module.exports = mongoose.model('Ticket', ticketSchema); 