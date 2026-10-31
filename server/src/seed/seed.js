// DEVELOPMENT SEED DATA - for testing only

import mongoose from 'mongoose';
import { connectDB } from '../config/db.js';
import { env } from '../config/env.js';
import { User, Category, Product, Variant, Stock } from '../models/index.js';

const seedDatabase = async () => {
  try {
    // Connect to database
    await connectDB();
    console.log('Clearing old data...');

    // Clear old data
    await User.deleteMany({});
    await Category.deleteMany({});
    await Product.deleteMany({});
    await Variant.deleteMany({});
    await Stock.deleteMany({});

    console.log('Inserting categories...');
    const categoryNames = [
      'Namkeen', 'Sev', 'Gathiya', 'Bhujia', 'Mixture', 'Chivda', 
      'Dal & Pulses', 'Peanuts', 'Farali', 'Sweets', 'Bakery', 'Gift Combos'
    ];

    // Insert categories
    const categoryDocs = await Category.insertMany(
      categoryNames.map(name => ({ categoryName: name }))
    );

    const sevCategory = categoryDocs.find(c => c.categoryName === 'Sev');
    const mixtureCategory = categoryDocs.find(c => c.categoryName === 'Mixture');

    console.log('Inserting products...');
    const productsToCreate = [
      {
        categoryId: sevCategory._id,
        productName: 'Plain Sev',
        description: 'Classic plain sev, crispy and delicious.',
        ingredients: 'Gram flour, salt, edible oil',
        productImages: ['/images/plain-sev.jpg']
      },
      {
        categoryId: sevCategory._id,
        productName: 'Ratlami Sev',
        description: 'Spicy and thick ratlami sev.',
        ingredients: 'Gram flour, spices, clove, edible oil',
        productImages: ['/images/ratlami-sev.jpg']
      },
      {
        categoryId: mixtureCategory._id,
        productName: 'Mixture Namkeen',
        description: 'A perfect blend of sweet, spicy, and tangy flavors.',
        ingredients: 'Peanuts, gram flour, spices, lentils, edible oil',
        productImages: ['/images/mixture-namkeen.jpg']
      }
    ];

    const createdProducts = await Product.insertMany(productsToCreate);

    console.log('Inserting variants and stock...');
    const variantSizes = [
      { weight: 200, unit: 'g', suffix: '200', price: 50 },
      { weight: 500, unit: 'g', suffix: '500', price: 120 },
      { weight: 1, unit: 'kg', suffix: '1KG', price: 230 }
    ];

    for (const product of createdProducts) {
      // Create a short sku prefix from the product name
      let skuPrefix = product.productName.toUpperCase().replace(/\s+/g, '-').substring(0, 10);
      
      for (const size of variantSizes) {
        const wholesalePrice = Math.floor(size.price * 0.8); // 20% less
        const sku = `${skuPrefix}-${size.suffix}`;
        
        const variant = await Variant.create({
          productId: product._id,
          weight: size.weight,
          unit: size.unit,
          displayName: `${product.productName} - ${size.weight}${size.unit}`,
          sellingPrice: size.price,
          wholesalePrice: wholesalePrice,
          sku: sku
        });

        // Create stock for each variant
        await Stock.create({
          variantId: variant._id,
          availableQuantity: 50,
          lowStockThreshold: 10
        });
      }
    }

    console.log('Inserting users...');
    // Use User.create so the pre-save hook runs for password hashing
    await User.create([
      {
        name: 'Admin User',
        email: 'admin@rameshwar.com',
        phone: '9876543210',
        password: 'Admin@123',
        role: 'admin'
      },
      {
        name: 'Customer User',
        email: 'customer@rameshwar.com',
        phone: '9876543211',
        password: 'Customer@123',
        role: 'customer'
      },
      {
        name: 'Wholesale User',
        email: 'wholesaler@rameshwar.com',
        phone: '9876543212',
        password: 'Wholesale@123',
        role: 'wholesaler',
        wholesalerStatus: 'approved'
      }
    ]);

    console.log('Seed completed');
    mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

seedDatabase();
