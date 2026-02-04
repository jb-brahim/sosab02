# SOSAB Construction Management System - Backend

A comprehensive Node.js + Express backend for construction project management with role-based access control, automated reporting, and real-time tracking.

## Features

- 🔐 JWT-based authentication with role-based access control
- 👥 Multi-role user management (Admin, Project Manager, Accountant, Warehouse Manager, CEO)
- 📊 Project, worker, and material tracking
- 💰 Automated salary calculation and payroll management
- 📦 Material inventory management with IN/OUT logs
- 📄 Automated weekly PDF report generation
- 📧 Email notifications
- 📝 Audit logging for all critical actions
- 🔄 Offline-first support for mobile app sync

## Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Create `.env` file in the root directory. See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for detailed setup instructions, or use this quick reference:
```env
# Server Configuration
PORT=3000
NODE_ENV=development

# MongoDB
MONGODB_URI=mongodb://localhost:27017/sosab
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/sosab

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRE=7d

# Email Configuration (for notifications)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=noreply@sosab.com

# Admin Default Credentials (change after first login)
ADMIN_EMAIL=admin@sosab.com
ADMIN_PASSWORD=Admin123!
```

4. Update `.env` with your MongoDB connection string and other configurations

5. Start the server:
```bash
npm run dev  # Development mode with nodemon
# or
npm start    # Production mode
```

## Default Admin Account

After first run, use these credentials (change immediately):
- Email: `admin@sosab.com`
- Password: `Admin123!`

## API Documentation

The API follows RESTful conventions. All endpoints require authentication except `/auth/login`.

### Base URL
```
http://localhost:3000/api
```

### Authentication
- `POST /api/auth/login` - Login and get JWT token
- `POST /api/auth/logout` - Logout (invalidate token)

### Users & Roles
- `POST /api/users` - Create user (Admin only)
- `GET /api/users` - List users (Admin only)
- `PATCH /api/users/:id` - Edit user
- `DELETE /api/users/:id` - Disable/delete user
- `POST /api/roles` - Create role
- `GET /api/roles` - List roles
- `PATCH /api/roles/:id` - Edit role permissions

### Projects
- `POST /api/projects` - Create project (Admin)
- `GET /api/projects` - List projects
- `PATCH /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Remove project

### Workers & Attendance
- `POST /api/workers` - Add worker
- `GET /api/workers/:projectId` - List workers per project
- `POST /api/attendance` - Mark attendance
- `GET /api/attendance/:projectId/:week` - Get weekly attendance
- `GET /api/salary/:projectId/:week` - Get calculated weekly salary

### Materials
- `POST /api/materials` - Add material
- `GET /api/materials/:projectId` - List project materials
- `POST /api/materials/log` - Add IN/OUT log
- `GET /api/materials/log/:projectId/:week` - Weekly material usage

### Suppliers
- `POST /api/suppliers` - Add supplier
- `GET /api/suppliers` - List suppliers
- `PATCH /api/suppliers/:id` - Edit supplier
- `DELETE /api/suppliers/:id` - Remove supplier

### Tasks
- `POST /api/tasks` - Create task
- `GET /api/tasks/:projectId` - List tasks
- `PATCH /api/tasks/:id` - Update progress

### Reports
- `POST /api/reports/generate` - Generate report (salary/material/activity)
- `GET /api/reports?projectId=:id&week=:week&type=:type` - Get reports (query parameters)

### Notifications
- `GET /api/notifications/:userId` - List notifications
- `PATCH /api/notifications/:id/read` - Mark as read

## Role Permissions

- **Admin**: Full control over all features
- **Project Manager**: Manage workers, materials, tasks, generate reports
- **Accountant**: Access salary reports, approve payroll, download PDFs
- **Warehouse Manager**: Manage stock, add material arrivals
- **CEO/Director**: Read-only analytics and reports

## Weekly Automation

The system automatically generates weekly reports every Monday at 9 AM:
- Salary reports
- Material usage reports
- Activity reports

Reports are emailed to Admin, Project Manager, and Accountant.

## Database Models

- User, Role, Project, Worker, Attendance, Salary
- Material, MaterialLog, Supplier
- Report, Task, Notification

## Security

- JWT token-based authentication
- bcrypt password hashing
- Role-based access control (RBAC)
- Audit logging for all critical actions
- Helmet.js for HTTP headers security

## License

ISC

