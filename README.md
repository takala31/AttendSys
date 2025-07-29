# AttendSys - Employee Attendance Tracking System

A comprehensive web-based employee attendance tracking application built with Node.js, Express, SQLite, and modern JavaScript.

## 🚀 Features

### Core Functionality
- **🔐 User Authentication**: Secure login system with JWT tokens and bcrypt password hashing
- **⏰ Attendance Tracking**: Real-time clock in/out functionality with automatic time calculation
- **📅 Calendar View**: Interactive calendar displaying attendance status and company holidays
- **🏖️ Leave Management**: Complete leave request, approval, and tracking system
- **👥 User Management**: Comprehensive admin panel for managing employees (Admin only)
- **📊 Reports & Analytics**: Advanced reporting with PDF/Excel export capabilities (Admin only)
- **🎨 Modern UI**: Responsive design with professional interface and smooth animations

### Advanced Features
- **📈 Dashboard Analytics**: Real-time statistics and insights
- **🔍 Advanced Filtering**: Filter reports by date range, employee, department
- **📱 Mobile Responsive**: Works seamlessly on all device sizes
- **🔒 Role-based Access**: Different permissions for employees and administrators
- **⚡ Real-time Updates**: Live data refresh and notifications
- **📋 Multiple Report Types**: Attendance, Employee, Leave, Summary, and Timesheet reports

## 🗄️ Database Schema

### Tables
- **Users**: Employee information, authentication, and role management
- **Attendance**: Daily check-in/out records with time tracking
- **Calendar**: Company holidays and special events
- **Leaves**: Leave requests with approval workflow

### User Roles
- **👤 Employee**: Personal attendance view, leave requests, check in/out
- **👑 Admin**: Full system access including user management, reports, and analytics

## 📦 Installation

> **⚠️ Important:** This is a Node.js web application that requires a server to run. GitHub only hosts the source code - to use the application, you need to run it locally or deploy it to a hosting service.

### Prerequisites
- Node.js (v14 or higher)
- npm (comes with Node.js)

### Quick Start

1. **Clone the repository**
   ```bash
   git clone [your-repo-url]
   cd AttendSys
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp .env.example .env
   # Edit .env file with your configuration
   ```

4. **Start the application**
   ```bash
   npm start
   ```

5. **Access the application**
   - Open your browser and navigate to: `http://localhost:3000`

## Demo Credentials

### Administrator Account
- **Username**: `admin`
- **Password**: `admin123`

### Employee Account
- **Username**: `jdoe`
- **Password**: `employee123`

## Project Structure

```
KT_Portal/
├── config/
│   └── database.js          # Database configuration and schema
├── middleware/
│   └── auth.js              # Authentication middleware
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── users.js             # User management routes
│   ├── attendance.js        # Attendance tracking routes
│   ├── calendar.js          # Calendar management routes
│   └── leaves.js            # Leave management routes
├── public/
│   ├── css/
│   │   ├── login.css        # Login page styles
│   │   └── dashboard.css    # Dashboard styles
│   ├── js/
│   │   ├── login.js         # Login functionality
│   │   └── dashboard.js     # Dashboard functionality
│   ├── login.html           # Login page
│   └── dashboard.html       # Main dashboard
├── database/
│   └── attendance.db        # SQLite database (auto-generated)
├── server.js                # Main server file
├── package.json             # Node.js dependencies
└── .env                     # Environment variables
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user info
- `POST /api/auth/change-password` - Change password

### Attendance
- `POST /api/attendance/checkin` - Clock in
- `POST /api/attendance/checkout` - Clock out
- `GET /api/attendance` - Get attendance records
- `GET /api/attendance/today` - Get today's status

### Leaves
- `GET /api/leaves` - Get leave requests
- `POST /api/leaves` - Create leave request
- `PUT /api/leaves/:id` - Update leave request
- `DELETE /api/leaves/:id` - Delete leave request
- `PUT /api/leaves/:id/status` - Approve/reject leave (Admin)

### Users (Admin only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create new user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Calendar
- `GET /api/calendar` - Get calendar events
- `POST /api/calendar` - Create calendar event (Admin)
- `PUT /api/calendar/:id` - Update calendar event (Admin)
- `DELETE /api/calendar/:id` - Delete calendar event (Admin)

## Configuration

### Environment Variables
Edit `.env` file to configure:
- `PORT`: Server port (default: 3000)
- `JWT_SECRET`: JWT token secret key
- `SESSION_SECRET`: Session secret key
- `DB_PATH`: Database file path

### Database
The application uses SQLite database which is automatically created on first run. The database includes sample data:
- Admin user (admin/admin123)
- Sample employee (jdoe/employee123)
- Sample holidays

## Features in Detail

### Dashboard
- Real-time clock display
- Quick check-in/out buttons
- Attendance statistics
- Recent activity feed

### Attendance Tracking
- Automatic time calculation
- Monthly attendance summary
- Filterable attendance records
- Admin can edit attendance records

### Leave Management
- Multiple leave types (sick, vacation, personal, etc.)
- Leave balance tracking
- Approval workflow for managers
- Leave calendar integration

### Calendar View
- Monthly calendar display
- Color-coded attendance status
- Holiday management
- Working day configuration

### Security Features
- Password hashing with bcrypt
- JWT token authentication
- Session management
- Rate limiting on login attempts
- Input validation and sanitization

## Browser Support
- Chrome (recommended)
- Firefox
- Safari
- Edge

## Mobile Responsive
The application is fully responsive and works on mobile devices.

## 🚀 Deployment

### Local Development
```bash
npm run dev  # If you have nodemon installed
# or
npm start
```

### Production Deployment

#### Environment Variables for Production
```bash
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_secure_session_secret
JWT_SECRET=your_secure_jwt_secret
DB_PATH=./database/attendance.db
```

#### Deploy to Heroku
1. Create a Heroku app
2. Set environment variables in Heroku dashboard
3. Deploy via Git:
   ```bash
   git add .
   git commit -m "Deploy AttendSys"
   git push heroku main
   ```

#### Deploy to Digital Ocean/VPS
1. Clone repository on server
2. Install dependencies: `npm install --production`
3. Set environment variables
4. Use PM2 for process management:
   ```bash
   npm install -g pm2
   pm2 start server.js --name "attendsys"
   ```

#### Deploy to Railway/Render
1. Connect your GitHub repository
2. Set environment variables
3. Deploy automatically on push

## 🔒 Security Considerations

- Change default admin password immediately
- Use strong, unique secrets for JWT and session
- Enable HTTPS in production
- Regular database backups
- Update dependencies regularly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support, please open an issue on GitHub or contact the development team.

---
**AttendSys** - Professional Employee Attendance Tracking System

## Development

### Running in Development Mode
```bash
npm install -g nodemon
npm run dev
```

### Adding New Features
1. Create new routes in the `routes/` directory
2. Add database schema changes in `config/database.js`
3. Update frontend JavaScript in `public/js/`
4. Add styling in `public/css/`

## License
ISC License

## Support
For technical support or questions, please contact the development team.

---

**KT Portal** - Making attendance tracking simple and efficient.
