const cloudinary = require('cloudinary').v2;
const multer = require('multer')

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true // Force HTTPS URLs
})

const storage = new multer.memoryStorage();

async function imageUploadUtil(file) {
    const result = await cloudinary.uploader.upload(file, {
      resource_type: "auto",
      secure: true  // Force HTTPS URL
    });
  
    return result;
}

// Utility function to ensure HTTPS URLs
function ensureHttpsUrl(url) {
    if (typeof url === 'string' && url.startsWith('http://')) {
        return url.replace('http://', 'https://');
    }
    return url;
}

const upload = multer({storage})
 module.exports  = {upload, imageUploadUtil, ensureHttpsUrl}
