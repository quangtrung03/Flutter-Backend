const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const bodyParser = require("body-parser"); 
const path = require('path');
require('dotenv').config();

const avatarRouter = require('./routes/auth/avatar-route.js');
const authRouter = require("./routes/auth/auth-route.js")

const adminProductsRouter = require('./routes/admin/products-routes.js');
const adminOrderRouter = require("./routes/admin/order-routes.js"); 
const adminUserRouter = require("./routes/admin/user-routes.js"); 
const adminBlogRouter = require("./routes/admin/blog-routes.js");
const adminVoucherRouter = require("./routes/admin/voucher-route.js"); // ✅ Đang dùng path /api/admin/voucher

const shopProductsRouter = require("./routes/shop/products-route.js");
const shopCartRouter = require("./routes/shop/cart-routes.js");
const shopAddressRouter = require("./routes/shop/address-routes.js");
const shopOrderRouter = require("./routes/shop/order-routes.js");
const shopSearchRouter = require("./routes/shop/search-routes.js");
const shopReviewRouter = require("./routes/shop/review-routes.js");

const userNotificationRouter = require("./routes/user/notification-route.js");

const commonFeatureRouter = require("./routes/common/feature-routes.js");
const momoPaymentRouter = require('./routes/common/momoPayment-routes.js');
const supportRequestRouter = require('./routes/common/supportRequest-routes.js');
const supportChatRouter = require('./routes/common/supportChat-route.js');

mongoose
  .connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
  })
  
  .then(() => console.log("MongoDB connected"))
  .catch((error) => console.log(error));

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      // Allow all localhost origins and production
      if (origin.startsWith('http://localhost:') || 
          origin.startsWith('http://127.0.0.1:') ||
          origin === 'https://mobilenc.onrender.com') {
        return callback(null, true);
      }
      
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ["GET", "POST", "DELETE", "PUT", "PATCH", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("."))


app.use('/api', avatarRouter)
app.use("/api/auth", authRouter)
// app.use('/api/auth', avatarRouter); 

app.use('/api/admin/products',adminProductsRouter)
app.use("/api/admin/orders", adminOrderRouter);
app.use("/api/admin/users", adminUserRouter);
app.use("/api/admin/blog", adminBlogRouter); // ✅ Đang dùng path /api/admin/blog
app.use("/api/admin/voucher", adminVoucherRouter); // ✅ Đang dùng path /api/admin/voucher

app.use("/api/shop/products", shopProductsRouter);
app.use("/api/shop/cart", shopCartRouter);
app.use("/api/shop/address", shopAddressRouter);
app.use("/api/shop/order", shopOrderRouter);
app.use("/api/shop/search", shopSearchRouter);
app.use("/api/shop/review", shopReviewRouter);

app.use("/api/user", userNotificationRouter); // Route notification với authentication

app.use("/api/common/feature", commonFeatureRouter);
app.use('/api/common/payment', momoPaymentRouter);
app.use('/api/common/payment/paypal', require('./routes/common/paypalPayment-routes'));
app.use('/api', supportRequestRouter);
app.use('/api/common/supportChat', supportChatRouter);

app.listen(PORT, () => console.log(`Server is now running on port ${PORT}`));
