import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const uri = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/namkeenmart';

const categoryUpdates = [
  { name: 'Namkeen', img: '/images/categories/namkeen.jpg' },
  { name: 'Sev', img: '/images/categories/sev.jpg' },
  { name: 'Gathiya', img: '/images/categories/gathiya.jpg' },
  { name: 'Bhujia', img: '/images/categories/bhujia.jpg' },
  { name: 'Mixture', img: '/images/categories/mixture.jpg' },
  { name: 'Chivda', img: '/images/categories/chivda.jpg' },
  { name: 'Dal & Pulses', img: '/images/categories/dal-pulses.jpg' },
  { name: 'Peanuts', img: '/images/categories/peanuts.jpg' },
  { name: 'Farali', img: '/images/categories/farali.jpg' },
  { name: 'Sweets', img: '/images/categories/sweets.jpg' },
  { name: 'Bakery', img: '/images/categories/bakery.jpg' },
  { name: 'Gift Combos', img: '/images/categories/gift-combos.jpg' }
];

const productCatalog = [
  {
    categoryName: 'Gathiya',
    productName: 'Bhavnagari Gathiya',
    description: 'Crispy, soft, and lightly spiced Gujarati Bhavnagari gathiya.',
    ingredients: 'Gram flour, carom seeds (ajwain), black pepper, edible oil',
    image: '/images/products/gathiya.jpg',
    weight: 500,
    price: 130,
    wholesalePrice: 95,
    qty: 120
  },
  {
    categoryName: 'Chivda',
    productName: 'Poha Chivda Special',
    description: 'Crunchy roasted flattened rice (poha) chivda with peanuts and dry fruits.',
    ingredients: 'Poha, peanuts, roasted gram, curry leaves, turmeric, edible oil',
    image: '/images/products/chivda.jpg',
    weight: 400,
    price: 110,
    wholesalePrice: 80,
    qty: 85
  },
  {
    categoryName: 'Dal & Pulses',
    productName: 'Spicy Masala Chana Dal',
    description: 'Crispy fried Bengal gram seasoned with tangy and spicy Indian spices.',
    ingredients: 'Chana dal, red chilli, chaat masala, edible oil, salt',
    image: '/images/products/dal-pulses.jpg',
    weight: 400,
    price: 100,
    wholesalePrice: 75,
    qty: 110
  },
  {
    categoryName: 'Peanuts',
    productName: 'Salted & Spiced Peanuts (Sing)',
    description: 'Classic roasted peanuts seasoned with authentic spices.',
    ingredients: 'Peanuts, iodised salt, edible vegetable oil',
    image: '/images/products/peanuts.jpg',
    weight: 500,
    price: 120,
    wholesalePrice: 90,
    qty: 130
  },
  {
    categoryName: 'Farali',
    productName: 'Farali Chevdo (Upvas Special)',
    description: 'Traditional fasting snack made from potato sticks, peanuts, and rock salt.',
    ingredients: 'Potato, peanuts, sendha namak (rock salt), sugar, edible oil',
    image: '/images/products/farali.jpg',
    weight: 350,
    price: 115,
    wholesalePrice: 85,
    qty: 70
  },
  {
    categoryName: 'Sweets',
    productName: 'Royal Gujarati Mohanthal & Peda',
    description: 'Traditional Gujarati sweet made with rich ghee and gram flour.',
    ingredients: 'Besan, pure desi ghee, sugar, cardamom, saffron, almonds',
    image: '/images/products/sweets.jpg',
    weight: 500,
    price: 250,
    wholesalePrice: 200,
    qty: 60
  },
  {
    categoryName: 'Gift Combos',
    productName: 'Rameshwar Festive Gift Hamper',
    description: 'Festive gift combo pack containing assorted namkeens, sweets, and sev.',
    ingredients: 'Assorted namkeens, sweets, dry fruits',
    image: '/images/products/gift-combos.jpg',
    weight: 1000,
    price: 499,
    wholesalePrice: 390,
    qty: 50
  },
  {
    categoryName: 'Namkeen',
    productName: 'Special Gujarati Farsan Mix',
    description: 'Traditional crunchy mixed farsan perfect for tea time.',
    ingredients: 'Gram flour, peanuts, sev, boondi, spices, edible oil',
    image: '/images/products/namkeen.jpg',
    weight: 500,
    price: 125,
    wholesalePrice: 95,
    qty: 140
  }
];

async function run() {
  await mongoose.connect(uri);
  const db = mongoose.connection.db;

  // 1. Update all Category Images
  console.log('--- Updating Categories ---');
  for (const c of categoryUpdates) {
    const res = await db.collection('categories').updateOne(
      { categoryName: c.name },
      { $set: { image: c.img } }
    );
    console.log(`Category [${c.name}]: updated = ${res.modifiedCount}`);
  }

  // 2. Also ensure Plain Sev, Ratlami Sev, Mixture Namkeen have correct product images
  await db.collection('products').updateMany(
    { productName: { $regex: /plain\s*sev/i } },
    { $set: { productImages: ['/images/products/plain-sev.png'] } }
  );

  await db.collection('products').updateMany(
    { productName: { $regex: /ratlami\s*sev/i } },
    { $set: { productImages: ['/images/products/ratlami-sev.jpg'] } }
  );

  await db.collection('products').updateMany(
    { productName: { $regex: /mixture\s*namkeen/i } },
    { $set: { productImages: ['/images/products/mixture-namkeen.jpg'] } }
  );

  // 3. For each missing catalog item, create/update product, variant, and stock
  console.log('--- Populating/Updating Products ---');
  for (const item of productCatalog) {
    const cat = await db.collection('categories').findOne({ categoryName: item.categoryName });
    if (!cat) continue;

    const existing = await db.collection('products').findOne({
      $or: [
        { productName: item.productName },
        { productName: { $regex: new RegExp(item.categoryName, 'i') } },
        { categoryId: cat._id }
      ]
    });

    if (existing) {
      // Update image
      await db.collection('products').updateOne(
        { _id: existing._id },
        { $set: { productImages: [item.image] } }
      );
      console.log(`Updated image for existing product: ${existing.productName}`);
    } else {
      // Insert new product
      const pDoc = {
        categoryId: cat._id,
        productName: item.productName,
        description: item.description,
        ingredients: item.ingredients,
        productImages: [item.image],
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const pRes = await db.collection('products').insertOne(pDoc);

      const vDoc = {
        productId: pRes.insertedId,
        weight: item.weight,
        unit: 'g',
        displayName: `${item.weight}g Pack`,
        sellingPrice: item.price,
        wholesalePrice: item.wholesalePrice,
        sku: `${item.categoryName.toUpperCase().replace(/[^A-Z]/g, '')}-${item.weight}G-001`,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const vRes = await db.collection('variants').insertOne(vDoc);

      await db.collection('stocks').insertOne({
        variantId: vRes.insertedId,
        availableQuantity: item.qty,
        reservedQuantity: 0,
        lowStockThreshold: 15,
        createdAt: new Date(),
        updatedAt: new Date()
      });
      console.log(`Created new product: ${item.productName}`);
    }
  }

  const allProducts = await db.collection('products').find({}).toArray();
  console.log(`Total Products in Database: ${allProducts.length}`);
  allProducts.forEach((p) => {
    console.log(`- ${p.productName} -> ${p.productImages ? p.productImages[0] : 'No image'}`);
  });

  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});

