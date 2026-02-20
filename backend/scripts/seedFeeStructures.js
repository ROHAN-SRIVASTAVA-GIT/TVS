const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

const feeStructures = [
  { class: 'NUR', tuition_fee: 15000, transport_fee: 5000, uniform_fee: 2500, exam_fee: 1000, activity_fee: 1500, total_fee: 25000 },
  { class: 'LKG', tuition_fee: 15000, transport_fee: 5000, uniform_fee: 2500, exam_fee: 1000, activity_fee: 1500, total_fee: 25000 },
  { class: 'UKG', tuition_fee: 15000, transport_fee: 5000, uniform_fee: 2500, exam_fee: 1000, activity_fee: 1500, total_fee: 25000 },
  { class: 'I', tuition_fee: 18000, transport_fee: 6000, uniform_fee: 3000, exam_fee: 1200, activity_fee: 1800, total_fee: 30000 },
  { class: 'II', tuition_fee: 18000, transport_fee: 6000, uniform_fee: 3000, exam_fee: 1200, activity_fee: 1800, total_fee: 30000 },
  { class: 'III', tuition_fee: 18000, transport_fee: 6000, uniform_fee: 3000, exam_fee: 1200, activity_fee: 1800, total_fee: 30000 },
  { class: 'IV', tuition_fee: 20000, transport_fee: 7000, uniform_fee: 3500, exam_fee: 1500, activity_fee: 2000, total_fee: 34000 },
  { class: 'V', tuition_fee: 20000, transport_fee: 7000, uniform_fee: 3500, exam_fee: 1500, activity_fee: 2000, total_fee: 34000 },
  { class: 'VI', tuition_fee: 25000, transport_fee: 8000, uniform_fee: 4000, exam_fee: 2000, activity_fee: 2500, total_fee: 41500 },
  { class: 'VII', tuition_fee: 25000, transport_fee: 8000, uniform_fee: 4000, exam_fee: 2000, activity_fee: 2500, total_fee: 41500 },
  { class: 'VIII', tuition_fee: 28000, transport_fee: 9000, uniform_fee: 4500, exam_fee: 2500, activity_fee: 3000, total_fee: 47000 },
];

async function seedFeeStructures() {
  const academicYear = new Date().getFullYear().toString();
  
  try {
    for (const fee of feeStructures) {
      await pool.query(
        `INSERT INTO fee_structures (class, tuition_fee, transport_fee, uniform_fee, exam_fee, activity_fee, total_fee, academic_year, is_active)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, true)
         ON CONFLICT (class) DO UPDATE SET
           tuition_fee = $2,
           transport_fee = $3,
           uniform_fee = $4,
           exam_fee = $5,
           activity_fee = $6,
           total_fee = $7,
           academic_year = $8`,
        [fee.class, fee.tuition_fee, fee.transport_fee, fee.uniform_fee, fee.exam_fee, fee.activity_fee, fee.total_fee, academicYear]
      );
      console.log(`✓ Fee structure added for Class ${fee.class}`);
    }
    console.log('\n✅ All fee structures seeded successfully!');
  } catch (err) {
    console.error('Error seeding fee structures:', err);
  } finally {
    await pool.end();
  }
}

seedFeeStructures();
