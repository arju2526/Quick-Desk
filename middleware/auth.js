const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Protect routes - require authentication
const protect = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user from token
    const user = await User.findById(decoded.id).select('-password');
    
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    if (!user.isActive) {
      return res.status(401).json({ message: 'Account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(401).json({ message: 'Not authorized to access this route' });
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized to access this route' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `User role ${req.user.role} is not authorized to access this route` 
      });
    }

    next();
  };
};

// Check if user can access ticket (owner, assigned agent, or admin)
const canAccessTicket = async (req, res, next) => {
  try {
    const ticket = await require('../models/Ticket').findById(req.params.id)
      .populate('createdBy', 'name email')
      .populate('assignedTo', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    const isOwner = ticket.createdBy._id.toString() === req.user._id.toString();
    const isAssigned = ticket.assignedTo && ticket.assignedTo._id.toString() === req.user._id.toString();
    const isAdmin = req.user.role === 'admin';
    const isAgent = req.user.role === 'agent';

    if (isOwner || isAssigned || isAdmin || isAgent) {
      req.ticket = ticket;
      next();
    } else {
      return res.status(403).json({ message: 'Not authorized to access this ticket' });
    }
  } catch (error) {
    console.error('Ticket access middleware error:', error);
    return res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  protect,
  authorize,
  canAccessTicket
}; 