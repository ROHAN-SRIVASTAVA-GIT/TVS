const { Pool } = require('pg');
require('dotenv').config();

let pool;
if (process.env.DATABASE_URL) {
  pool = new Pool({ connectionString: process.env.DATABASE_URL });
} else {
  pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
}

const feeStructures = [
  { className: 'NUR', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
  { className: 'LKG', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
  { className: 'UKG', tuitionFee: 15000, transportFee: 5000, uniformFee: 2500, examFee: 1000, activityFee: 1500 },
  { className: 'I', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
  { className: 'II', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
  { className: 'III', tuitionFee: 18000, transportFee: 6000, uniformFee: 3000, examFee: 1200, activityFee: 1800 },
  { className: 'IV', tuitionFee: 20000, transportFee: 7000, uniformFee: 3500, examFee: 1500, activityFee: 2000 },
  { className: 'V', tuitionFee: 20000, transportFee: 7000, uniformFee: 3500, examFee: 1500, activityFee: 2000 },
  { className: 'VI', tuitionFee: 25000, transportFee: 8000, uniformFee: 4000, examFee: 2000, activityFee: 2500 },
  { className: 'VII', tuitionFee: 25000, transportFee: 8000, uniformFee: 4000, examFee: 2000, activityFee: 2500 },
  { className: 'VIII', tuitionFee: 28000, transportFee: 9000, uniformFee: 4500, examFee: 2500, activityFee: 3000 },
];

async function seedFeeStructures() {
  const academicYear = new Date().getFullYear().toString();
  
  try {
    for (const fee of feeStructures) {
      const totalFee = fee.tuitionFee + fee.transportFee + fee.uniformFee + fee.examFee + fee.activityFee;
      await pool.query(
        `INSERT INTO fee_structures (class_name, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee, academic_year, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT DO NOTHING`,
        [fee.className, fee.tuitionFee, fee.transportFee, fee.uniformFee, fee.examFee, fee.activityFee, totalFee, academicYear]
      );
      console.log(`✓ Fee structure added for Class ${fee.className}`);
    }
    console.log('\n✅ All fee structures seeded successfully!');
  } catch (err) {
    console.error('Error seeding fee structures:', err);
  } finally {
    await pool.end();
  }
}

seedFeeStructures();
