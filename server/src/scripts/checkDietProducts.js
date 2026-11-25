import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function checkProductRanges() {
  await mongoose.connect(process.env.MONGO_URI);
  const total = await Product.countDocuments();
  const dietCount = await Product.countDocuments({ productRange: 'diet' });
  const regularCount = await Product.countDocuments({ productRange: 'regular' });
  const otherCount = await Product.countDocuments({ productRange: { $nin: ['diet', 'regular'] } });
  
  const allProducts = await Product.find({}, '_id productName productRange isActive').sort({ productName: 1 }).lean();

  console.log(JSON.stringify({
    total,
    dietCount,
    regularCount,
    otherCount,
    allProducts
  }, null, 2));

  process.exit(0);
}

checkProductRanges().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
