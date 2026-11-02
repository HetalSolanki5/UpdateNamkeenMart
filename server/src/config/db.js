import mongoose from 'mongoose';
import { env } from './env.js';

export const connectDB = async () => {
  try {
    // Connect to MongoDB using the URI from environment variables
    await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB connected');
  } catch (error) {
    // Log the error and exit the process if connection fails
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};
