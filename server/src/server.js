import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import app from './app.js';

const startServer = async () => {
  // Establish database connection
  await connectDB();

  // Start the Express server
  app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });
};

startServer();
