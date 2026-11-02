import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);

// Keep your existing category, product, order,
// admin and other route registrations here.

export default app;