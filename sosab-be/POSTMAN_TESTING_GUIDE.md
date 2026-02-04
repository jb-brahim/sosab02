# Postman Testing Guide for SOSAB Backend

Complete guide to test all features of the SOSAB Construction Management System using Postman.

## Table of Contents
1. [Setup](#setup)
2. [Testing Workflow](#testing-workflow)
3. [Feature Testing](#feature-testing)
4. [Troubleshooting](#troubleshooting)

---

## Setup

### 1. Import Collection

1. Open Postman
2. Click **Import** button (top left)
3. Select the file: `postman/SOSAB_Backend_Collection.json`
4. The collection will appear in your workspace

### 2. Configure Variables

The collection uses variables that are automatically set. You can also manually configure them:

1. Click on the collection name
2. Go to **Variables** tab
3. Update these values if needed:
   - `base_url`: `http://localhost:3000/api` (default)
   - `admin_email`: Your admin email (default: `admin@sosab.com`)
   - `admin_password`: Your admin password (default: `Admin123!`)

### 3. Start Your Server

```bash
npm run dev
```

Verify server is running:
- Health Check: `GET http://localhost:3000/api/health`

---

## Testing Workflow

### Recommended Testing Order

Follow this order for best results:

1. **Health Check** - Verify server is running
2. **Authentication** - Login to get JWT token
3. **Users & Roles** - Create users and roles
4. **Projects** - Create a project
5. **Workers** - Add workers to the project
6. **Attendance** - Mark worker attendance
7. **Materials** - Add materials and track usage
8. **Suppliers** - Manage suppliers
9. **Tasks** - Create and manage tasks
10. **Reports** - Generate reports
11. **Notifications** - Check notifications

---

## Feature Testing

### 1. Health Check

**Endpoint**: `GET /api/health`

**Steps**:
1. Open "0. Health Check" → "Health Check"
2. Click **Send**
3. Should return: `{ "success": true, "message": "SOSAB Backend API is running" }`

**Expected Result**: ✅ Server is running

---

### 2. Authentication

#### 2.1 Login

**Endpoint**: `POST /api/auth/login`

**Steps**:
1. Open "1. Authentication" → "Login"
2. Verify the body has your admin credentials
3. Click **Send**
4. **Important**: The token is automatically saved to `auth_token` variable

**Request Body**:
```json
{
    "email": "admin@sosab.com",
    "password": "Admin123!"
}
```

**Expected Result**: 
- Status: `200 OK`
- Response contains `token` and `user` object
- Token is saved automatically

**What to Check**:
- ✅ Token is received
- ✅ User object contains your user info
- ✅ Check Postman console to see "Token saved" message

#### 2.2 Logout

**Endpoint**: `POST /api/auth/logout`

**Steps**:
1. Open "1. Authentication" → "Logout"
2. Click **Send**

**Expected Result**: `{ "success": true, "message": "Logged out successfully" }`

---

### 3. Users & Roles

#### 3.1 Create User

**Endpoint**: `POST /api/users` (Admin only)

**Steps**:
1. Make sure you're logged in (token is set)
2. Open "2. Users & Roles" → "Users" → "Create User"
3. Modify the request body with your desired user data
4. Click **Send**
5. User ID is automatically saved

**Request Body Example**:
```json
{
    "name": "John Doe",
    "email": "john.doe@example.com",
    "password": "SecurePass123!",
    "role": "Project Manager",
    "assignedProjects": []
}
```

**Expected Result**: 
- Status: `201 Created`
- Returns user object (without password)
- User ID saved to `user_id` variable

**What to Check**:
- ✅ User is created successfully
- ✅ Password is hashed (not returned)
- ✅ Role is set correctly

#### 3.2 Get All Users

**Endpoint**: `GET /api/users` (Admin only)

**Steps**:
1. Open "2. Users & Roles" → "Users" → "Get All Users"
2. Click **Send**

**Expected Result**: Array of all users

**Query Parameters** (optional):
- `projectId`: Filter users by assigned project

#### 3.3 Update User

**Endpoint**: `PATCH /api/users/:id` (Admin only)

**Steps**:
1. Open "2. Users & Roles" → "Users" → "Update User"
2. Modify the body with fields to update
3. Click **Send**

**Request Body Example**:
```json
{
    "name": "John Doe Updated",
    "role": "Accountant"
}
```

#### 3.4 Delete User

**Endpoint**: `DELETE /api/users/:id` (Admin only)

**Note**: This soft-deletes (disables) the user, doesn't permanently delete.

---

### 4. Projects

#### 4.1 Create Project

**Endpoint**: `POST /api/projects` (Admin only)

**Steps**:
1. Open "3. Projects" → "Create Project"
2. Update the `managerId` in the body (use `{{user_id}}` from created user)
3. Click **Send**
4. Project ID is automatically saved

**Request Body Example**:
```json
{
    "name": "Downtown Office Building",
    "location": "123 Main St, City",
    "budget": 5000000,
    "startDate": "2024-01-15",
    "endDate": "2024-12-31",
    "managerId": "{{user_id}}"
}
```

**Expected Result**: 
- Status: `201 Created`
- Returns project object
- Project ID saved to `project_id` variable

**What to Check**:
- ✅ Project is created
- ✅ Manager is assigned
- ✅ Dates are valid (endDate > startDate)

#### 4.2 Get All Projects

**Endpoint**: `GET /api/projects`

**Note**: Non-admin users only see projects they manage.

#### 4.3 Update Project

**Endpoint**: `PATCH /api/projects/:id`

**Request Body Example**:
```json
{
    "progress": 25,
    "status": "Active"
}
```

---

### 5. Workers & Attendance

#### 5.1 Add Worker

**Endpoint**: `POST /api/workers`

**Steps**:
1. Open "4. Workers & Attendance" → "Workers" → "Add Worker"
2. Make sure `projectId` uses `{{project_id}}`
3. Click **Send**
4. Worker ID is automatically saved

**Request Body Example**:
```json
{
    "name": "Ahmed Hassan",
    "projectId": "{{project_id}}",
    "dailySalary": 150,
    "contact": {
        "phone": "+1234567890",
        "address": "Worker Address"
    }
}
```

**Expected Result**: Worker created with ID saved

#### 5.2 Mark Attendance

**Endpoint**: `POST /api/attendance`

**Steps**:
1. Open "4. Workers & Attendance" → "Attendance" → "Mark Attendance"
2. Update dates and worker/project IDs
3. Click **Send**

**Request Body Example**:
```json
{
    "workerId": "{{worker_id}}",
    "projectId": "{{project_id}}",
    "date": "2024-01-20",
    "present": true,
    "overtime": 2,
    "bonus": 50,
    "penalty": 0,
    "notes": "Good performance"
}
```

**What to Check**:
- ✅ Attendance is recorded
- ✅ Can update same day attendance
- ✅ Overtime, bonus, penalty are tracked

#### 5.3 Get Weekly Attendance

**Endpoint**: `GET /api/attendance/:projectId/:week`

**Week Format**: `YYYY-WW` (e.g., `2024-03` for week 3 of 2024)

**Steps**:
1. Open "4. Workers & Attendance" → "Attendance" → "Get Weekly Attendance"
2. Update the week parameter
3. Click **Send**

**Expected Result**: Array of attendance records for the week

#### 5.4 Get Weekly Salary

**Endpoint**: `GET /api/salary/:projectId/:week`

**Steps**:
1. First, mark attendance for multiple days
2. Open "4. Workers & Attendance" → "Salary" → "Get Weekly Salary"
3. Click **Send**

**Expected Result**: 
- Calculated salaries for all workers
- Breakdown: base salary, overtime, bonus, penalty
- Total salary for the project

**What to Check**:
- ✅ Salary is calculated correctly
- ✅ Overtime is included (1.5x rate)
- ✅ Bonus and penalty are applied

---

### 6. Materials

#### 6.1 Add Material

**Endpoint**: `POST /api/materials`

**Steps**:
1. Open "5. Materials" → "Add Material"
2. Update project ID
3. Click **Send**
4. Material ID is automatically saved

**Request Body Example**:
```json
{
    "name": "Cement",
    "unit": "bag",
    "price": 25.50,
    "projectId": "{{project_id}}",
    "stockQuantity": 100,
    "weight": 50,
    "category": "Construction Material"
}
```

**Available Units**: `kg`, `ton`, `m`, `m²`, `m³`, `piece`, `box`, `bag`, `liter`

#### 6.2 Add Material Log (IN)

**Endpoint**: `POST /api/materials/log`

**Request Body Example**:
```json
{
    "materialId": "{{material_id}}",
    "type": "IN",
    "quantity": 50,
    "date": "2024-01-20",
    "notes": "New shipment arrived"
}
```

**Expected Result**: 
- Material log created
- Stock quantity increased by 50

#### 6.3 Add Material Log (OUT)

**Request Body Example**:
```json
{
    "materialId": "{{material_id}}",
    "type": "OUT",
    "quantity": 20,
    "date": "2024-01-20",
    "workerId": "{{worker_id}}",
    "notes": "Used for foundation work"
}
```

**Expected Result**: 
- Material log created
- Stock quantity decreased by 20
- Error if insufficient stock

#### 6.4 Get Weekly Material Usage

**Endpoint**: `GET /api/materials/log/:projectId/:week`

**Expected Result**: 
- Summary of IN/OUT for each material
- Current stock balance
- Detailed logs

---

### 7. Suppliers

#### 7.1 Add Supplier

**Endpoint**: `POST /api/suppliers`

**Request Body Example**:
```json
{
    "name": "ABC Construction Supplies",
    "contact": {
        "email": "contact@abcsupplies.com",
        "phone": "+1234567890",
        "address": "123 Supplier St",
        "contactPerson": "John Supplier"
    },
    "rating": 4.5,
    "notes": "Reliable supplier"
}
```

#### 7.2 Get All Suppliers

**Endpoint**: `GET /api/suppliers`

**Expected Result**: List of all active suppliers

---

### 8. Tasks

#### 8.1 Create Task

**Endpoint**: `POST /api/tasks`

**Request Body Example**:
```json
{
    "projectId": "{{project_id}}",
    "name": "Foundation Work",
    "description": "Complete foundation preparation and pouring",
    "assignedWorkers": ["{{worker_id}}"],
    "startDate": "2024-01-15",
    "endDate": "2024-02-15",
    "priority": "High"
}
```

**Priority Options**: `Low`, `Medium`, `High`, `Critical`

#### 8.2 Update Task Progress

**Request Body Example**:
```json
{
    "progress": 50,
    "status": "In Progress"
}
```

**Status Options**: `Not Started`, `In Progress`, `Completed`, `On Hold`, `Cancelled`

---

### 9. Reports

#### 9.1 Generate Salary Report

**Endpoint**: `POST /api/reports/generate`

**Request Body**:
```json
{
    "projectId": "{{project_id}}",
    "type": "salary",
    "week": "2024-03"
}
```

**Expected Result**: 
- PDF report generated
- Stored in `uploads/reports/`
- Report record created in database

**What to Check**:
- ✅ PDF file is created
- ✅ Report contains salary breakdown
- ✅ Can access PDF via URL in response

#### 9.2 Generate Material Report

**Request Body**:
```json
{
    "projectId": "{{project_id}}",
    "type": "material",
    "week": "2024-03"
}
```

#### 9.3 Generate Activity Report

**Request Body**:
```json
{
    "projectId": "{{project_id}}",
    "type": "activity",
    "week": "2024-03"
}
```

#### 9.4 Get Reports

**Endpoint**: `GET /api/reports?projectId=:id&week=:week&type=:type`

**Query Parameters**:
- `projectId`: Required
- `week`: Optional
- `type`: Optional (`salary`, `material`, `activity`)

---

### 10. Notifications

#### 10.1 Get Notifications

**Endpoint**: `GET /api/notifications/:userId`

**Query Parameters**:
- `read`: `true` or `false` (optional)
- `limit`: Number of notifications (default: 50)

#### 10.2 Mark as Read

**Endpoint**: `PATCH /api/notifications/:id/read`

---

## Testing Scenarios

### Complete Workflow Test

Test a complete construction project workflow:

1. **Setup**:
   - Login as admin
   - Create a Project Manager user
   - Create a project

2. **Workers**:
   - Add 3-5 workers
   - Set different daily salaries

3. **Attendance**:
   - Mark attendance for a week
   - Include overtime, bonuses, penalties

4. **Materials**:
   - Add materials (cement, steel, etc.)
   - Log IN shipments
   - Log OUT usage

5. **Tasks**:
   - Create tasks
   - Assign workers
   - Update progress

6. **Reports**:
   - Generate salary report
   - Generate material report
   - Verify PDFs are created

7. **Verification**:
   - Check salary calculations
   - Verify material stock levels
   - Review reports

---

## Troubleshooting

### Common Issues

#### 1. "Not authorized" Error

**Problem**: Token missing or expired

**Solution**:
- Re-login to get a new token
- Check Authorization header is set
- Verify token format: `Bearer <token>`

#### 2. "User not found" Error

**Problem**: Using wrong ID

**Solution**:
- Check variables are set correctly
- Use "Get All Users" to find correct IDs
- Verify IDs in URL parameters

#### 3. "Project not found" Error

**Problem**: Project ID not set or wrong

**Solution**:
- Create project first
- Check `project_id` variable is set
- Verify project exists with "Get All Projects"

#### 4. Salary Calculation Returns Zero

**Problem**: No attendance records

**Solution**:
- Mark attendance first
- Ensure dates are within the week
- Check worker is assigned to project

#### 5. Material Stock Error

**Problem**: Insufficient stock

**Solution**:
- Add material IN logs first
- Check current stock quantity
- Verify quantity in OUT log doesn't exceed stock

#### 6. PDF Generation Fails

**Problem**: Puppeteer dependencies missing

**Solution**:
- Install Chromium: `npm install puppeteer`
- On Linux: `sudo apt-get install -y chromium-browser`
- Check disk space in uploads directory

---

## Tips

1. **Use Variables**: The collection automatically saves IDs to variables. Use `{{variable_name}}` in requests.

2. **Check Console**: Postman console shows saved variables and errors.

3. **Test in Order**: Follow the recommended order for dependencies.

4. **Verify Responses**: Always check response status and data structure.

5. **Save Examples**: Save example responses for reference.

6. **Use Environments**: Create different environments for dev/staging/prod.

---

## Quick Reference

### Status Codes

- `200 OK`: Success
- `201 Created`: Resource created
- `400 Bad Request`: Invalid input
- `401 Unauthorized`: Not authenticated
- `403 Forbidden`: Not authorized (wrong role)
- `404 Not Found`: Resource doesn't exist
- `500 Server Error`: Server issue

### Week Format

Use format: `YYYY-WW`
- Example: `2024-03` (week 3 of 2024)
- Current week: Use current year and week number

### Date Format

Use ISO format: `YYYY-MM-DD`
- Example: `2024-01-20`

---

## Next Steps

After testing:

1. **Review Audit Logs**: Check database for audit trail
2. **Test Role Permissions**: Test with different user roles
3. **Test Edge Cases**: Empty data, invalid inputs, etc.
4. **Performance Testing**: Test with large datasets
5. **Integration Testing**: Test complete workflows

For more information, see the main [README.md](./README.md) and [SETUP.md](./SETUP.md).

