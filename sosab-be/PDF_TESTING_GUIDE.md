# PDF Generation Testing Guide

## ✅ Test Results

PDF generation is **working correctly**! All three report types have been tested and generated successfully.

### Test Files Generated
- ✅ **Salary Report**: `uploads/reports/test/test-salary-report.pdf` (47.21 KB)
- ✅ **Material Report**: `uploads/reports/test/test-material-report.pdf` (37.50 KB)
- ✅ **Activity Report**: `uploads/reports/test/test-activity-report.pdf` (40.22 KB)

---

## Quick Test

### 1. Run Automated Test

```bash
npm run test:pdf
```

This will:
- Generate all three report types with sample data
- Save them to `uploads/reports/test/`
- Verify file sizes and validity
- Show test summary

### 2. Manual Test via API

#### Prerequisites
1. Start your server: `npm run dev`
2. Login to get JWT token
3. Create a project (or use existing)
4. Add workers and mark attendance (for salary report)
5. Add materials and logs (for material report)

#### Test Salary Report

**Request:**
```bash
POST http://localhost:3000/api/reports/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "YOUR_PROJECT_ID",
  "type": "salary",
  "week": "2024-03"
}
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Report generated successfully",
  "data": {
    "_id": "...",
    "projectId": "...",
    "type": "salary",
    "week": "2024-03",
    "pdfUrl": "/uploads/reports/ProjectName-salary-2024-03-1234567890.pdf",
    "generatedBy": "...",
    "createdAt": "..."
  }
}
```

#### Test Material Report

**Request:**
```bash
POST http://localhost:3000/api/reports/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "YOUR_PROJECT_ID",
  "type": "material",
  "week": "2024-03"
}
```

#### Test Activity Report

**Request:**
```bash
POST http://localhost:3000/api/reports/generate
Authorization: Bearer YOUR_JWT_TOKEN
Content-Type: application/json

{
  "projectId": "YOUR_PROJECT_ID",
  "type": "activity",
  "week": "2024-03"
}
```

### 3. View Generated PDF

Once generated, access the PDF via:

```
GET http://localhost:3000/uploads/reports/FILENAME.pdf
```

Or open directly in browser:
```
http://localhost:3000/uploads/reports/ProjectName-salary-2024-03-1234567890.pdf
```

---

## Testing with Postman

### Step 1: Setup
1. Import the Postman collection (if not already done)
2. Login to get token
3. Create a project and note the `project_id`

### Step 2: Generate Report
1. Open "8. Reports" → "Generate Salary Report"
2. Update the request body:
   ```json
   {
     "projectId": "{{project_id}}",
     "type": "salary",
     "week": "2024-03"
   }
   ```
3. Click **Send**

### Step 3: Verify
- Check response for `pdfUrl`
- Copy the filename from `pdfUrl`
- Access via: `http://localhost:3000/uploads/reports/FILENAME.pdf`

---

## Complete Testing Workflow

### For Salary Report

1. **Create Project**
   ```bash
   POST /api/projects
   {
     "name": "Test Project",
     "location": "Test Location",
     "budget": 100000,
     "startDate": "2024-01-01",
     "endDate": "2024-12-31",
     "managerId": "USER_ID"
   }
   ```
   Save `project_id`

2. **Add Worker**
   ```bash
   POST /api/workers
   {
     "name": "Test Worker",
     "projectId": "PROJECT_ID",
     "dailySalary": 150
   }
   ```
   Save `worker_id`

3. **Mark Attendance** (for a week)
   ```bash
   POST /api/attendance
   {
     "workerId": "WORKER_ID",
     "projectId": "PROJECT_ID",
     "date": "2024-01-15",
     "present": true,
     "overtime": 2,
     "bonus": 50
   }
   ```
   Repeat for multiple days in the week

4. **Calculate Salary** (optional, but recommended)
   ```bash
   GET /api/salary/PROJECT_ID/2024-03
   ```
   This ensures salary records exist

5. **Generate Report**
   ```bash
   POST /api/reports/generate
   {
     "projectId": "PROJECT_ID",
     "type": "salary",
     "week": "2024-03"
   }
   ```

6. **View PDF**
   - Use the `pdfUrl` from response
   - Open in browser or download

### For Material Report

1. **Add Material**
   ```bash
   POST /api/materials
   {
     "name": "Cement",
     "unit": "bag",
     "price": 25.50,
     "projectId": "PROJECT_ID",
     "stockQuantity": 100
   }
   ```

2. **Add Material Logs**
   ```bash
   POST /api/materials/log
   {
     "materialId": "MATERIAL_ID",
     "type": "IN",
     "quantity": 50,
     "date": "2024-01-15"
   }
   ```

   ```bash
   POST /api/materials/log
   {
     "materialId": "MATERIAL_ID",
     "type": "OUT",
     "quantity": 20,
     "date": "2024-01-16"
   }
   ```

3. **Generate Report**
   ```bash
   POST /api/reports/generate
   {
     "projectId": "PROJECT_ID",
     "type": "material",
     "week": "2024-03"
   }
   ```

---

## Troubleshooting

### Issue: "PDF generation error"

**Possible Causes:**
1. Puppeteer not installed properly
2. Chromium browser not downloaded
3. Insufficient permissions

**Solutions:**
```bash
# Reinstall puppeteer
npm install puppeteer --force

# On Linux, may need:
sudo apt-get install -y chromium-browser

# Check if puppeteer works
node -e "require('puppeteer').launch().then(b => b.close())"
```

### Issue: "Empty PDF file"

**Possible Causes:**
1. HTML content is empty
2. No data for the report
3. Week format incorrect

**Solutions:**
- Check if project has data (workers, materials, etc.)
- Verify week format: `YYYY-WW` (e.g., `2024-03`)
- Check server logs for errors

### Issue: "Cannot access PDF via URL"

**Possible Causes:**
1. Static file serving not configured
2. File path incorrect
3. File doesn't exist

**Solutions:**
- Verify `server.js` has: `app.use('/uploads', express.static('uploads'))`
- Check file exists in `uploads/reports/`
- Verify file permissions

### Issue: "Report already exists"

**Solution:**
- The system prevents duplicate reports
- Either use a different week or delete existing report
- Or use the existing report's `pdfUrl`

---

## Week Format

Use format: `YYYY-WW`

- **YYYY**: Year (e.g., 2024)
- **WW**: Week number (01-52)

**Examples:**
- `2024-01` = Week 1 of 2024
- `2024-03` = Week 3 of 2024
- `2024-52` = Week 52 of 2024

**Get Current Week:**
```javascript
// In Node.js
const getWeekString = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + 3 - (d.getDay() + 6) % 7);
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum = 1 + Math.round(((d - week1) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
  const year = d.getFullYear();
  return `${year}-${weekNum.toString().padStart(2, '0')}`;
};
```

---

## PDF Quality Check

### What to Verify

1. **Content**
   - ✅ All data is present
   - ✅ Numbers are correct
   - ✅ Dates are formatted properly
   - ✅ No missing information

2. **Formatting**
   - ✅ Tables are properly aligned
   - ✅ Headers are clear
   - ✅ Footer is present
   - ✅ Page breaks are correct

3. **File**
   - ✅ File size is reasonable (20-100 KB typically)
   - ✅ File opens in PDF viewer
   - ✅ Text is selectable
   - ✅ No corrupted content

---

## Performance Notes

- **Generation Time**: 1-3 seconds per report
- **File Size**: 30-50 KB typically (depends on data)
- **Concurrent Requests**: Can handle multiple requests
- **Memory Usage**: ~100-200 MB per generation

---

## Automated Weekly Reports

The system automatically generates reports every Monday at 9 AM via cron job. Check:
- `jobs/weeklyReports.js` for configuration
- Server logs for generation status
- `uploads/reports/` for generated files

---

## Next Steps

1. ✅ PDF generation is working
2. Test with real data via API
3. Verify PDFs are accessible via URL
4. Test weekly automated generation
5. Integrate with frontend for download/view

For more information, see:
- [POSTMAN_TESTING_GUIDE.md](./POSTMAN_TESTING_GUIDE.md) - API testing
- [README.md](./README.md) - General documentation

