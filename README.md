# HelpDesk Mini

A full-stack helpdesk application built with Node.js, Express, MongoDB, and React. This application provides a complete ticketing system with role-based access control, JWT authentication, and modern UI.

## Features

### Backend Features
- **JWT Authentication** with role-based access (user, agent, admin)
- **Comprehensive Ticket Management** with CRUD operations
- **Comment System** for ticket discussions
- **SLA Management** with 48-hour deadlines
- **Rate Limiting** (60 requests per minute per user)
- **Optimistic Locking** for concurrent updates
- **Idempotency** for ticket creation
- **Uniform Error Handling** with structured error responses
- **Pagination and Search** for tickets
- **CORS** enabled for frontend integration

### Frontend Features
- **React Router** for navigation
- **Role-based UI** with different permissions for users, agents, and admins
- **Responsive Design** with Tailwind CSS
- **Ticket List** with pagination and search
- **Ticket Details** with comment system
- **Create New Tickets** form
- **Authentication** (login/register)

## Tech Stack

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- bcryptjs (password hashing)
- jsonwebtoken (JWT authentication)
- Joi (validation)
- express-rate-limit (rate limiting)
- CORS

### Frontend
- React 18
- React Router DOM
- Axios (HTTP client)
- Tailwind CSS (styling)
- Heroicons (icons)
- Vite (build tool)

## Project Structure

```
hackathon_skillion/
├── package.json           # Backend dependencies
├── server.js             # Main backend application
├── .env                  # Environment variables
├── frontend/
│   ├── package.json      # Frontend dependencies
│   ├── vite.config.js    # Vite configuration
│   ├── tailwind.config.js # Tailwind configuration
│   ├── postcss.config.js # PostCSS configuration
│   ├── index.html        # HTML template
│   └── src/
│       ├── main.jsx      # React entry point
│       ├── App.jsx       # Main App component
│       ├── index.css     # Global styles
│       ├── components/
│       │   └── Layout.jsx # Layout component
│       ├── pages/
│       │   ├── Login.jsx      # Login page
│       │   ├── Register.jsx   # Registration page
│       │   ├── Tickets.jsx    # Tickets list
│       │   ├── NewTicket.jsx  # Create ticket form
│       │   └── TicketDetail.jsx # Ticket details
│       └── services/
│           └── api.js    # API service layer
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local instance or MongoDB Atlas)
- npm or yarn

### 1. Backend Setup

1. **Install backend dependencies:**
   ```bash
   cd hackathon_skillion
   npm install
   ```

2. **Set up MongoDB:**
   - For local MongoDB: Make sure MongoDB is running on `localhost:27017`
   - For MongoDB Atlas: Update the `MONGODB_URI` in `.env` file

3. **Configure environment variables:**
   ```bash
   # The .env file is already created with default values
   # Update if needed:
   MONGODB_URI=mongodb://localhost:27017/helpdesk_mini
   JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
   PORT=5000
   ```

4. **Start the backend server:**
   ```bash
   npm start
   # or for development with auto-restart:
   npm run dev
   ```

   The backend will be available at `http://localhost:5000`

### 2. Frontend Setup

1. **Install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```

   The frontend will be available at `http://localhost:3000`

### 3. Access the Application

1. Open your browser and go to `http://localhost:3000`
2. Register a new account or use the following test accounts (you'll need to register them):
   - Admin: `admin@example.com`
   - Agent: `agent@example.com` 
   - User: `user@example.com`

## API Documentation

### Authentication Endpoints

#### Register
```http
POST /auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "role": "user"  // optional: user, agent, admin
}
```

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}
```

### Ticket Endpoints

#### Create Ticket
```http
POST /api/tickets
Authorization: Bearer <token>
Idempotency-Key: unique-key-123  // optional
Content-Type: application/json

{
  "title": "Login Issue",
  "description": "Cannot login to the application"
}
```

#### Get Tickets (with pagination and search)
```http
GET /api/tickets?limit=10&offset=0&q=search-term
Authorization: Bearer <token>
```

#### Get Single Ticket
```http
GET /api/tickets/:id
Authorization: Bearer <token>
```

#### Update Ticket (with optimistic locking)
```http
PATCH /api/tickets/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "__v": 0,  // version for optimistic locking
  "status": "in_progress",
  "assignedTo": "userId"
}
```

#### Add Comment
```http
POST /api/tickets/:id/comments
Authorization: Bearer <token>
Content-Type: application/json

{
  "text": "This is a comment"
}
```

#### Get Comments
```http
GET /api/tickets/:id/comments
Authorization: Bearer <token>
```

## Role-Based Permissions

### User Role
- Create tickets
- View own tickets
- Add comments to own tickets
- Update title/description of own tickets

### Agent Role
- View all unassigned tickets and tickets assigned to them
- Update ticket status
- Add comments to any ticket
- Cannot assign tickets to other agents

### Admin Role
- Full access to all tickets
- Assign tickets to agents
- Update any ticket
- Add comments to any ticket

## Key Features Explained

### 1. SLA Management
- Each ticket automatically gets a 48-hour SLA deadline from creation
- SLA breach is visually indicated in the UI
- SLA deadline is shown in ticket details

### 2. Rate Limiting
- 60 requests per minute per IP address
- Returns structured error response when limit exceeded

### 3. Optimistic Locking
- Uses MongoDB's `__v` (version) field
- Prevents concurrent update conflicts
- Returns 409 Conflict status when version mismatch occurs

### 4. Idempotency
- Ticket creation supports `Idempotency-Key` header
- Prevents duplicate ticket creation
- Key expires after 1 hour

### 5. Error Handling
- Uniform error response format:
  ```json
  {
    "error": {
      "code": "ERROR_CODE",
      "message": "Human readable message",
      "field": "fieldName"  // optional
    }
  }
  ```

## Development Notes

### Backend Development
- Uses ES6+ features with CommonJS modules
- Mongoose for MongoDB ODM
- Comprehensive input validation with Joi
- JWT tokens expire in 7 days
- Passwords hashed with bcrypt (12 rounds)

### Frontend Development
- Modern React with hooks
- Tailwind CSS for styling
- Axios interceptors for automatic token handling
- React Router for navigation
- Responsive design for mobile and desktop

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Rate limiting protection
- Input validation and sanitization
- CORS configuration
- SQL injection prevention (using Mongoose)

## Production Deployment

### Backend Deployment
1. Set strong JWT_SECRET in production
2. Use MongoDB Atlas or properly secured MongoDB instance
3. Configure proper CORS origins
4. Use Redis for rate limiting and idempotency store
5. Add proper logging and monitoring
6. Use HTTPS

### Frontend Deployment
1. Build the production bundle: `npm run build`
2. Serve static files with a web server (nginx, Apache)
3. Update API base URL for production
4. Configure proper error tracking

## Testing

The application includes comprehensive error handling and validation. For testing:

1. **Authentication Testing:**
   - Register users with different roles
   - Test login/logout functionality
   - Verify JWT token expiration

2. **Ticket Management Testing:**
   - Create tickets as different user roles
   - Test pagination and search
   - Verify role-based permissions
   - Test optimistic locking with concurrent updates

3. **Comment System Testing:**
   - Add comments to tickets
   - Verify comment ordering and display
   - Test character limits

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error:**
   - Ensure MongoDB is running
   - Check connection string in `.env`
   - Verify network connectivity

2. **CORS Errors:**
   - Frontend proxy is configured in `vite.config.js`
   - Ensure backend CORS is properly configured

3. **Authentication Issues:**
   - Check JWT_SECRET configuration
   - Verify token expiration
   - Clear browser localStorage if needed

4. **Rate Limiting:**
   - Wait 1 minute if rate limit exceeded
   - Consider using different IP for testing

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License.