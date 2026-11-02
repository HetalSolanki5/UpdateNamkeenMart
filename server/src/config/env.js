import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET } = process.env;

// Define the variables that are strictly required.
// RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are needed for real payment integration (Phase 5D-A).
// The server will refuse to start if either is missing, preventing silent payment failures.
const requiredEnvVars = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_EXPIRES_IN',
  'CLIENT_URL',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
];

// Check for missing variables
for (const envVar of requiredEnvVars) {
  if (!process.env[envVar]) {
    console.error(`Error: Missing required environment variable ${envVar}`);
    process.exit(1);
  }
}

// Export the validated environment variables
export const env = {
  PORT: PORT || 5000,
  MONGO_URI,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  CLIENT_URL,
  // Razorpay credentials for payment gateway integration.
  // RAZORPAY_KEY_ID is the public key (safe to share with frontend).
  // RAZORPAY_KEY_SECRET must NEVER be sent to the frontend — it stays on the server only.
  RAZORPAY_KEY_ID,
  RAZORPAY_KEY_SECRET,
};
