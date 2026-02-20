const { StandardCheckoutClient, Env, MetaInfo } = require('phonepe-pg-sdk-node');
require('dotenv').config();

const CLIENT_ID = process.env.PHONEPE_CLIENT_ID || 'M23Y40Q4NT1KS_2602191640';
const CLIENT_SECRET = process.env.PHONEPE_CLIENT_SECRET || 'YzY4YzQ5ZGQtMjY5ZS00YTJjLThiN2ItYmYyNGU5ZmExYjBk';
const CLIENT_VERSION = process.env.PHONEPE_CLIENT_VERSION || '2';
const ENVIRONMENT = process.env.PHONEPE_ENV === 'PRODUCTION' ? Env.PRODUCTION : Env.SANDBOX;

console.log('=== PhonePe Config ===');
console.log('Client ID:', CLIENT_ID);
console.log('Client Secret:', CLIENT_SECRET ? 'Set' : 'NOT SET');
console.log('Client Version:', CLIENT_VERSION);
console.log('Environment:', ENVIRONMENT === Env.PRODUCTION ? 'PRODUCTION' : 'SANDBOX');
console.log('=====================');

let phonepeClient = null;

const getPhonePeClient = () => {
  if (!phonepeClient) {
    phonepeClient = StandardCheckoutClient.getInstance(
      CLIENT_ID,
      CLIENT_SECRET,
      parseInt(CLIENT_VERSION),
      ENVIRONMENT
    );
    console.log('PhonePe client initialized successfully');
  }
  return phonepeClient;
};

module.exports = {
  getPhonePeClient,
  Env,
  MetaInfo,
  CLIENT_ID,
  CLIENT_SECRET,
  CLIENT_VERSION,
  ENVIRONMENT
};
