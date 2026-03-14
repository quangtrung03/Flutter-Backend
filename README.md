# MBNC Backend

Backend cho hệ thống MBNC (Coffee Shop), xây dựng bằng Node.js + Express + MongoDB, cung cấp API cho ứng dụng Flutter và trang quản trị.

## Công nghệ sử dụng

- Node.js + Express
- MongoDB + Mongoose
- Xác thực JWT
- Upload ảnh với Multer + Cloudinary
- Thanh toán MoMo, PayPal
- Gửi email thông báo với Nodemailer

## Cấu trúc thư mục

```text
MyBackend/
  server/
    controllers/   # Xử lý logic theo module (auth, admin, shop, common)
    routes/        # Định nghĩa API routes
    models/        # Mongoose models
    middleware/    # Middleware xác thực/kiểm tra dữ liệu
    helpers/       # Hàm hỗ trợ (thanh toán, upload, chatbot...)
    states/        # State pattern cho đơn hàng
    config/        # Dữ liệu cấu hình
    uploads/       # Tệp upload tạm
    server.js      # Entry point
```

## Điều kiện trước khi chạy

- Node.js 18 trở lên
- MongoDB (local hoặc cloud)

## Cài đặt và chạy local

```bash
cd server
npm install
npm run dev
```

Nếu chạy production:

```bash
npm start
```

Mặc định server chạy ở cổng `5000` (hoặc theo biến `PORT`).

## Biến môi trường

Tạo file `.env` trong thư mục `server/` và cấu hình tối thiểu:

```env
PORT=5000
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster>/<db>
JWT_SECRET=your_jwt_secret

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

EMAIL_USER=your_email
EMAIL_PASS=your_email_password

MOMO_PARTNER_CODE=MOMO
MOMO_ACCESS_KEY=your_momo_access_key
MOMO_SECRET_KEY=your_momo_secret_key

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

BASE_URL=http://localhost:5000
```

## Kiểm tra sức khỏe (Health Check)

- `GET /` → Thông tin tổng quan API
- `GET /api` → Kiểm tra trạng thái API

## Nhóm API chính

- `/api/auth` : Đăng ký, đăng nhập, xác thực, avatar
- `/api/admin/products` : Quản lý sản phẩm (admin)
- `/api/admin/orders` : Quản lý đơn hàng (admin)
- `/api/admin/users` : Quản lý người dùng (admin)
- `/api/admin/blog` : Quản lý bài viết (admin)
- `/api/admin/voucher` : Quản lý mã giảm giá (admin)
- `/api/shop/products` : Danh sách/chi tiết sản phẩm cho shop
- `/api/shop/cart` : Giỏ hàng
- `/api/shop/address` : Địa chỉ giao hàng
- `/api/shop/order` : Đặt hàng
- `/api/shop/search` : Tìm kiếm sản phẩm
- `/api/shop/review` : Đánh giá sản phẩm
- `/api/user` : Thông báo người dùng
- `/api/common/feature` : Banner/tính năng dùng chung
- `/api/common/payment` : Thanh toán MoMo
- `/api/common/payment/paypal` : Thanh toán PayPal
- `/api/common/supportChat` : Hỗ trợ chat
- `/api` : Gửi yêu cầu hỗ trợ (ticket)

## Ghi chú

- CORS đã được cấu hình cho localhost, 127.0.0.1 và các domain `.vercel.app`.
- Nếu deploy, hãy cập nhật `BASE_URL` và danh sách domain trong CORS cho phù hợp môi trường thật.
