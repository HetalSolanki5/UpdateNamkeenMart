import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const { PORT, MONGO_URI, JWT_SECRET, JWT_EXPIRES_IN, CLIENT_URL } = process.env;

// Define the variables that are strictly required
const requiredEnvVars = ['PORT', 'MONGO_URI', 'JWT_SECRET', 'JWT_EXPIRES_IN', 'CLIENT_URL'];

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
};
