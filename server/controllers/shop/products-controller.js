const Product = require("../../models/Product.js");
const { ensureHttpsUrl } = require("../../helpers/cloudinary.js");

// 📌 Định nghĩa các phương thức sắp xếp sản phẩm
const sortingStrategies = {
  "price-lowtohigh": { price: 1 }, 
  "price-hightolow": { price: -1 },
  "title-atoz": { title: 1 },
  "title-ztoa": { title: -1 },
};

// 📦 Lấy danh sách sản phẩm theo bộ lọc & sắp xếp
const getFilteredProducts = async (req, res) => {
  try {
    const { category = [], sortBy = "price-lowtohigh", discount } = req.query;

    let filters = {};

    // ✅ Lọc theo danh mục
    if (category.length) {
      filters.category = { $in: category.split(",") };
    }

    // ✅ Lọc sản phẩm khuyến mãi nếu có query ?discount=true
    if (discount === "true") {
      filters.salePrice = { $gt: 0 };
    }

    const sort = sortingStrategies[sortBy] || sortingStrategies["price-lowtohigh"];

    const products = await Product.find(filters).sort(sort);
    
    // Ensure all image URLs are HTTPS
    const secureProducts = products.map(product => ({
      ...product.toObject(),
      image: ensureHttpsUrl(product.image)
    }));
    
    res.status(200).json({ success: true, data: secureProducts });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy sản phẩm" });
  }
};


// 🔍 Lấy thông tin chi tiết sản phẩm
const getProductDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Sản phẩm không tồn tại!" });
    }

    // Ensure image URL is HTTPS
    const secureProduct = {
      ...product.toObject(),
      image: ensureHttpsUrl(product.image)
    };

    res.status(200).json({ success: true, data: secureProduct });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Lỗi khi lấy chi tiết sản phẩm" });
  }
};


module.exports = { getFilteredProducts, getProductDetails };
