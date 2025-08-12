require('dotenv').config();
const mongoose = require("mongoose");
const Product = require("./models/Product");

// Kết nối database
mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("MongoDB connected successfully");
}).catch((error) => {
    console.log("MongoDB connection failed:", error);
});

// Function để chuyển HTTP sang HTTPS
function ensureHttpsUrl(url) {
    if (typeof url === 'string' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
}

// Update tất cả products với HTTPS URLs
async function updateProductImages() {
    try {
        console.log("Starting to update product images to HTTPS...");
        
        const products = await Product.find({});
        console.log(`Found ${products.length} products to update`);
        
        let updatedCount = 0;
        
        for (const product of products) {
            const originalUrl = product.image;
            const httpsUrl = ensureHttpsUrl(product.image);
            
            if (originalUrl !== httpsUrl) {
                await Product.findByIdAndUpdate(product._id, { image: httpsUrl });
                console.log(`Updated product ${product._id}: ${originalUrl} -> ${httpsUrl}`);
                updatedCount++;
            }
        }
        
        console.log(`Successfully updated ${updatedCount} product images to HTTPS`);
        process.exit(0);
        
    } catch (error) {
        console.error("Error updating product images:", error);
        process.exit(1);
    }
}

// Chạy script
updateProductImages();
