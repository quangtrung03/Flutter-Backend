require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('./models/Product');

const checkUrls = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('MongoDB connected successfully');

    // Find products with HTTP URLs
    const httpProducts = await Product.find({
      $or: [
        { image: { $regex: '^http://res.cloudinary.com' } },
        { 'images.image': { $regex: '^http://res.cloudinary.com' } },
      ]
    }).limit(5);

    console.log('Products with HTTP URLs:', httpProducts.length);
    
    if (httpProducts.length > 0) {
      console.log('Sample HTTP products:');
      httpProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Main image: ${product.image}`);
        if (product.images && product.images.length > 0) {
          console.log(`   Gallery images: ${product.images.map(img => img.image).join(', ')}`);
        }
        console.log('');
      });
    }

    // Find products with HTTPS URLs
    const httpsProducts = await Product.find({
      $or: [
        { image: { $regex: '^https://res.cloudinary.com' } },
        { 'images.image': { $regex: '^https://res.cloudinary.com' } },
      ]
    }).limit(5);

    console.log('Products with HTTPS URLs:', httpsProducts.length);
    
    if (httpsProducts.length > 0) {
      console.log('Sample HTTPS products:');
      httpsProducts.forEach((product, index) => {
        console.log(`${index + 1}. ${product.name}`);
        console.log(`   Main image: ${product.image}`);
        if (product.images && product.images.length > 0) {
          console.log(`   Gallery images: ${product.images.map(img => img.image).join(', ')}`);
        }
        console.log('');
      });
    }

    // Check all products
    const allProducts = await Product.countDocuments();
    console.log(`Total products in database: ${allProducts}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
};

checkUrls();
