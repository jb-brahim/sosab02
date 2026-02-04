# SOSAB Backend Setup Guide

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

## Installation Steps

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   - Copy `.env.example` to `.env` (if it doesn't exist, create it)
   - **See [ENV_SETUP_GUIDE.md](./ENV_SETUP_GUIDE.md) for detailed step-by-step instructions**
   - Quick reference: [ENV_QUICK_REFERENCE.md](./ENV_QUICK_REFERENCE.md)
   - Minimum required:
     - `MONGODB_URI`: Your MongoDB connection string
     - `JWT_SECRET`: A strong secret key for JWT tokens (generate with: `node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"`)
     - `ADMIN_EMAIL` and `ADMIN_PASSWORD`: Default admin credentials
   - Optional:
     - `EMAIL_*`: Email configuration (for notifications)
     - `AWS_*` or `CLOUDINARY_*`: Cloud storage (for production PDF storage)

3. **Start MongoDB**
   - If using local MongoDB, ensure it's running
   - If using MongoDB Atlas, ensure your connection string is correct

4. **Run the Server**
   ```bash
   # Development mode (with nodemon)
   npm run dev

   # Production mode
   npm start
   ```

5. **Verify Installation**
   - Check health endpoint: `GET http://localhost:3000/api/health`
   - Should return: `{ "success": true, "message": "SOSAB Backend API is running" }`

## Default Admin Account

After first run, the system automatically creates a default admin user:
- **Email**: `admin@sosab.com` (or value from `ADMIN_EMAIL`)
- **Password**: `Admin123!` (or value from `ADMIN_PASSWORD`)

⚠️ **IMPORTANT**: Change the default password immediately after first login!

## API Testing

### Login Example
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sosab.com",
    "password": "Admin123!"
  }'
```

### Create User Example (requires admin token)
```bash
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "SecurePass123!",
    "role": "Project Manager"
  }'
```

## Weekly Reports

The system automatically generates weekly reports every Monday at 9 AM:
- Salary reports
- Material usage reports
- Activity reports

Reports are stored in `uploads/reports/` and notifications are sent to relevant users.

## Project Structure

```
sosab-backend/
├── config/          # Database and initialization configs
├── controllers/     # Route controllers
├── jobs/            # Cron jobs (weekly reports)
├── middleware/      # Auth, RBAC, audit logging
├── models/          # Mongoose schemas
├── routes/          # API routes
├── utils/           # Helper functions
├── uploads/         # Generated PDFs (created automatically)
├── server.js        # Main application file
└── package.json     # Dependencies
```

## Troubleshooting

### MongoDB Connection Issues
- Verify MongoDB is running
- Check connection string format
- Ensure network access (for Atlas)

### PDF Generation Issues
- Ensure Puppeteer dependencies are installed
- On Linux, may need: `sudo apt-get install -y chromium-browser`

### Email Not Sending
- Verify email credentials in `.env`
- For Gmail, use App Password (not regular password)
- Check firewall/network settings

## Security Notes

1. Never commit `.env` file to version control
2. Use strong JWT_SECRET in production
3. Change default admin credentials
4. Enable HTTPS in production
5. Regularly update dependencies

## Next Steps

1. Create additional users via Admin panel
2. Create projects
3. Add workers and materials
4. Start tracking attendance
5. Generate reports

