# QuickDesk - Help Desk Solution

A full-stack MERN (MongoDB, Express.js, React.js, Node.js) help desk application that allows users to create and manage support tickets efficiently.

## Features

### For End Users
- User registration and authentication
- Create tickets with subject, description, category, and attachments
- View and track ticket status
- Search and filter tickets
- Add comments to tickets
- Upvote/downvote tickets
- Email notifications

### For Support Agents
- View assigned tickets
- Update ticket status and priority
- Add internal comments
- Assign tickets to other agents
- Manage ticket categories

### For Administrators
- User management (create, update, deactivate users)
- Category management
- Dashboard with statistics
- Role-based access control

## Tech Stack

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **MongoDB** - Database
- **Mongoose** - ODM
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **multer** - File uploads
- **nodemailer** - Email notifications
- **express-validator** - Input validation
- **helmet** - Security headers
- **cors** - Cross-origin resource sharing

### Frontend
- **React.js** - UI library
- **React Router** - Client-side routing
- **React Query** - Data fetching and caching
- **React Hook Form** - Form handling
- **Tailwind CSS** - Styling
- **Heroicons** - Icons
- **React Hot Toast** - Notifications
- **date-fns** - Date formatting

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or cloud)
- npm or yarn

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd QuickDesk
   ```

2. **Install backend dependencies**
   ```bash
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd client
   npm install
   cd ..
   ```

4. **Environment Setup**
   
   Create a `config.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/quickdesk
   JWT_SECRET=your_jwt_secret_key_here_change_in_production
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_email_password
   EMAIL_SERVICE=gmail
   PORT=5000
   NODE_ENV=development
   ```

5. **Start MongoDB**
   
   Make sure MongoDB is running on your system or use MongoDB Atlas.

6. **Run the application**

   **Development mode (both frontend and backend):**
   ```bash
   npm run dev
   ```

   **Or run separately:**
   
   Backend only:
   ```bash
   npm run server
   ```
   
   Frontend only:
   ```bash
   npm run client
   ```

7. **Access the application**
   
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile
- `PUT /api/auth/profile` - Update user profile
- `PUT /api/auth/password` - Update password

### Tickets
- `GET /api/tickets` - Get all tickets (with filtering)
- `POST /api/tickets` - Create new ticket
- `GET /api/tickets/:id` - Get single ticket
- `PUT /api/tickets/:id` - Update ticket
- `POST /api/tickets/:id/comments` - Add comment
- `POST /api/tickets/:id/vote` - Vote on ticket
- `DELETE /api/tickets/:id` - Delete ticket (admin only)

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category (admin only)
- `PUT /api/categories/:id` - Update category (admin only)
- `DELETE /api/categories/:id` - Delete category (admin only)

### Users
- `GET /api/users` - Get all users (admin only)
- `GET /api/users/agents` - Get all agents
- `PUT /api/users/:id` - Update user (admin only)
- `DELETE /api/users/:id` - Delete user (admin only)

## User Roles

1. **User** - Can create tickets, view their own tickets, add comments
2. **Agent** - Can view all tickets, update status, assign tickets, add internal comments
3. **Admin** - Full access to all features including user and category management

## File Structure

```
QuickDesk/
├── client/                 # React frontend
│   ├── public/
│   ├── src/
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── pages/         # Page components
│   │   ├── utils/         # Utility functions
│   │   └── index.css      # Global styles
│   └── package.json
├── models/                # Mongoose models
├── routes/                # API routes
├── middleware/            # Custom middleware
├── uploads/              # File uploads directory
├── server.js             # Express server
├── package.json
└── README.md
```

## Security Features

- JWT authentication
- Password hashing with bcrypt
- Input validation and sanitization
- Rate limiting
- Security headers with helmet
- CORS protection
- File upload restrictions

## Performance Features

- Database indexing
- React Query for caching
- Pagination
- Lazy loading
- Optimized queries

## Deployment

### Backend Deployment (Heroku)
1. Create a Heroku app
2. Set environment variables
3. Deploy using Git or Heroku CLI

### Frontend Deployment (Netlify/Vercel)
1. Build the React app: `npm run build`
2. Deploy the `build` folder

### Database
- Use MongoDB Atlas for cloud database
- Set up proper indexes for performance

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For support, please create an issue in the repository or contact the development team.

---

**QuickDesk** - Streamlining communication between users and support teams without unnecessary complexity. 
