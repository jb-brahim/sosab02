require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { generatePDF, generateSalaryReportHTML, generateMaterialReportHTML, generateActivityReportHTML } = require('../utils/pdfGenerator');

// Test PDF generation with sample data
async function testPDFGeneration() {
  console.log('🧪 Testing PDF Generation...\n');

  const outputDir = path.join(__dirname, '../uploads/reports/test');
  await fs.mkdir(outputDir, { recursive: true });

  // Test 1: Salary Report
  console.log('1. Testing Salary Report PDF...');
  try {
    const salaryData = {
      project: {
        name: 'Test Project',
        location: 'Test Location'
      },
      week: '2024-03',
      workers: [
        {
          name: 'Ahmed Hassan',
          daysWorked: 5,
          baseSalary: 750,
          overtime: 150,
          bonus: 50,
          penalty: 0,
          total: 950
        },
        {
          name: 'John Smith',
          daysWorked: 6,
          baseSalary: 1050,
          overtime: 225,
          bonus: 100,
          penalty: 25,
          total: 1350
        }
      ],
      totalSalary: 2300
    };

    const salaryHTML = generateSalaryReportHTML(salaryData);
    const salaryPath = path.join(outputDir, 'test-salary-report.pdf');

    await generatePDF(salaryHTML, salaryPath);

    // Check if file exists
    const stats = await fs.stat(salaryPath);
    console.log(`   ✅ Salary report generated successfully!`);
    console.log(`   📄 File: ${salaryPath}`);
    console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error(`   ❌ Error generating salary report:`, error.message);
    console.error(`   ${error.stack}\n`);
  }

  // Test 2: Material Report
  console.log('2. Testing Material Report PDF...');
  try {
    const materialData = {
      project: {
        name: 'Test Project',
        location: 'Test Location'
      },
      week: '2024-03',
      materials: [
        {
          name: 'Cement',
          unit: 'bag',
          in: 100,
          out: 50,
          balance: 50
        },
        {
          name: 'Steel Bars',
          unit: 'ton',
          in: 10,
          out: 5,
          balance: 5
        }
      ],
      movements: [
        { name: 'Cement', date: new Date(), type: 'IN', quantity: 100, deliveredBy: 'Supplier A', notes: 'Initial stock' },
        { name: 'Cement', date: new Date(), type: 'OUT', quantity: 50, notes: 'Used for foundation' },
        { name: 'Steel Bars', date: new Date(), type: 'IN', quantity: 10, deliveredBy: 'Supplier B', notes: 'Urgent delivery' },
        { name: 'Steel Bars', date: new Date(), type: 'OUT', quantity: 5, notes: 'Column work' }
      ]
    };

    const materialHTML = generateMaterialReportHTML(materialData);
    const materialPath = path.join(outputDir, 'test-material-report.pdf');

    await generatePDF(materialHTML, materialPath);

    const stats = await fs.stat(materialPath);
    console.log(`   ✅ Material report generated successfully!`);
    console.log(`   📄 File: ${materialPath}`);
    console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error(`   ❌ Error generating material report:`, error.message);
    console.error(`   ${error.stack}\n`);
  }

  // Test 3: Activity Report
  console.log('3. Testing Activity Report PDF...');
  try {
    const activityData = {
      project: {
        name: 'Test Project',
        location: 'Test Location',
        progress: 45
      },
      week: '2024-03',
      activities: [
        {
          title: 'Project Progress',
          description: 'Project progress: 45%',
          date: new Date().toLocaleDateString()
        },
        {
          title: 'Materials',
          description: 'Material logs updated - 15 entries',
          date: new Date().toLocaleDateString()
        },
        {
          title: 'Attendance',
          description: 'Worker attendance marked - 25 records',
          date: new Date().toLocaleDateString()
        },
        {
          title: 'Tasks',
          description: '3 tasks completed this week',
          date: new Date().toLocaleDateString()
        }
      ]
    };

    const activityHTML = generateActivityReportHTML(activityData);
    const activityPath = path.join(outputDir, 'test-activity-report.pdf');

    await generatePDF(activityHTML, activityPath);

    const stats = await fs.stat(activityPath);
    console.log(`   ✅ Activity report generated successfully!`);
    console.log(`   📄 File: ${activityPath}`);
    console.log(`   📊 Size: ${(stats.size / 1024).toFixed(2)} KB\n`);
  } catch (error) {
    console.error(`   ❌ Error generating activity report:`, error.message);
    console.error(`   ${error.stack}\n`);
  }

  // Summary
  console.log('📋 Test Summary:');
  console.log('   All test PDFs are saved in: uploads/reports/test/');
  console.log('   You can open these files to verify they are properly formatted.\n');

  // Check if files are readable
  console.log('🔍 Verifying PDF files...');
  const testFiles = [
    'test-salary-report.pdf',
    'test-material-report.pdf',
    'test-activity-report.pdf'
  ];

  for (const file of testFiles) {
    const filePath = path.join(outputDir, file);
    try {
      const stats = await fs.stat(filePath);
      if (stats.size > 0) {
        console.log(`   ✅ ${file} - Valid (${(stats.size / 1024).toFixed(2)} KB)`);
      } else {
        console.log(`   ⚠️  ${file} - Empty file!`);
      }
    } catch (error) {
      console.log(`   ❌ ${file} - Not found or error: ${error.message}`);
    }
  }

  console.log('\n✨ PDF Generation Test Complete!');
  console.log('\n💡 Next Steps:');
  console.log('   1. Open the generated PDFs in uploads/reports/test/');
  console.log('   2. Verify formatting and content');
  console.log('   3. Test via API endpoint: POST /api/reports/generate');
  console.log('   4. Check if PDFs are accessible via: GET /uploads/reports/...\n');
}

// Run test
testPDFGeneration().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

