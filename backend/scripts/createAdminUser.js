const { db } = require('../config/db');
const { hashPassword } = require('../utils/helpers');
const logger = require('../config/logger');

const createAdminUser = async () => {
  try {
    // Check if admin already exists
    const checkQuery = `SELECT id FROM users WHERE role = 'admin' LIMIT 1`;
    const checkResult = await db.query(checkQuery);

    if (checkResult.rows.length > 0) {
      logger.info('Admin user already exists');
      return;
    }

    // Admin credentials
    const adminEmail = 'admin@topviewpublicschool.edu.in';
    const adminPassword = await hashPassword('Admin@123');
    const adminFirstName = 'Administrator';
    const adminLastName = 'TVPS';
    const adminPhone = '9999999999';

    const query = `
      INSERT INTO users (email, password, first_name, last_name, phone, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING id, email, role
    `;

    const result = await db.query(query, [
      adminEmail,
      adminPassword,
      adminFirstName,
      adminLastName,
      adminPhone,
      'admin',
      'active'
    ]);

    logger.info(`Admin user created successfully: ${adminEmail}`);
    console.log('\n========================================');
    console.log('   ADMIN ACCOUNT CREATED');
    console.log('========================================');
    console.log(`   Email: ${adminEmail}`);
    console.log('   Password: Admin@123');
    console.log('   Role: Admin');
    console.log('========================================\n');

  } catch (error) {
    logger.error('Error creating admin user:', error);
  }
};

module.exports = createAdminUser;
