const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: './config.env' });

// Import models
const User = require('./models/User');
const Category = require('./models/Category');

const setupDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/quickdesk', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Category.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 12);
    const admin = await User.create({
      name: 'Admin User',
      email: 'admin@quickdesk.com',
      password: adminPassword,
      role: 'admin',
    });
    console.log('Created admin user:', admin.email);

    // Create agent user
    const agentPassword = await bcrypt.hash('agent123', 12);
    const agent = await User.create({
      name: 'Support Agent',
      email: 'agent@quickdesk.com',
      password: agentPassword,
      role: 'agent',
    });
    console.log('Created agent user:', agent.email);

    // Create regular user
    const userPassword = await bcrypt.hash('user123', 12);
    const user = await User.create({
      name: 'Regular User',
      email: 'user@quickdesk.com',
      password: userPassword,
      role: 'user',
    });
    console.log('Created regular user:', user.email);

    // Create default categories
    const categories = [
      {
        name: 'Technical Support',
        description: 'Technical issues and troubleshooting',
        color: '#3B82F6',
        createdBy: admin._id,
      },
      {
        name: 'Feature Request',
        description: 'New feature suggestions and requests',
        color: '#10B981',
        createdBy: admin._id,
      },
      {
        name: 'Bug Report',
        description: 'Software bugs and issues',
        color: '#EF4444',
        createdBy: admin._id,
      },
      {
        name: 'General Inquiry',
        description: 'General questions and inquiries',
        color: '#F59E0B',
        createdBy: admin._id,
      },
      {
        name: 'Account Issues',
        description: 'Account-related problems',
        color: '#8B5CF6',
        createdBy: admin._id,
      },
    ];

    for (const category of categories) {
      await Category.create(category);
      console.log('Created category:', category.name);
    }

    console.log('\n✅ Setup completed successfully!');
    console.log('\nDefault users:');
    console.log('Admin: admin@quickdesk.com / admin123');
    console.log('Agent: agent@quickdesk.com / agent123');
    console.log('User: user@quickdesk.com / user123');
    console.log('\nYou can now start the application with: npm run dev');

  } catch (error) {
    console.error('Setup failed:', error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

setupDatabase(); 