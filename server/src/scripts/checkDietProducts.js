import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import Product from '../models/Product.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const products = await Product.find({}, 'productName productRange isListed');
  console.log(`Total products: ${products.length}`);
  products.forEach(p => console.log(`- ${p.productName} | range: ${p.productRange} | isListed: ${p.isListed}`));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
