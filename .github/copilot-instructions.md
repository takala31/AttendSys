<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# KT Portal - Attendance Tracking System

This is a Node.js web application for employee attendance tracking built with Express.js, SQLite, and vanilla JavaScript.

## Architecture Guidelines

### Backend (Node.js/Express)
- Use Express.js for the web server
- SQLite database with proper schema design
- JWT authentication for API security
- RESTful API design patterns
- Middleware for authentication and authorization
- Error handling and input validation

### Frontend (Vanilla JavaScript)
- Responsive design with CSS Grid and Flexbox
- Modern JavaScript (ES6+) features
- Fetch API for backend communication
- Local storage for token management
- Progressive enhancement approach

### Database Design
- Users table for employee information
- Attendance logs for check-in/out records
- Calendar table for holidays and events
- Leaves table for leave requests and approvals

### Security Best Practices
- Password hashing with bcrypt
- JWT token authentication
- Session management
- Rate limiting
- Input sanitization
- CORS configuration

### Code Style Guidelines
- Use async/await for asynchronous operations
- Proper error handling with try-catch blocks
- Consistent naming conventions (camelCase for JavaScript, snake_case for database)
- Modular code organization
- Comprehensive comments for complex logic

### API Design
- RESTful endpoints with proper HTTP methods
- Consistent JSON response format
- Proper status codes
- Authentication middleware for protected routes
- Role-based access control

### Frontend Best Practices
- Mobile-first responsive design
- Accessibility considerations
- Fast loading and smooth animations
- User feedback through notifications
- Local data caching where appropriate
