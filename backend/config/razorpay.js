const Razorpay = require('razorpay');
require('dotenv').config();

console.log('=== Razorpay Config ===');
console.log('Key ID:', process.env.RAZORPAY_KEY_ID ? 'Set' : 'NOT SET');
console.log('Key Secret:', process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'NOT SET');
console.log('========================');

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

module.exports = razorpay;
