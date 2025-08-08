// test momo bằng thẻ ngân hàng 
// NGUYEN VAN A
// 9704 0000 0000 0018
// 03/07
// OTP

const crypto = require('crypto');
const https = require('https');
const Order = require('../../models/Order');
const Product = require('../../models/Product');
const Cart = require('../../models/Cart'); // Ensure Cart is imported

const partnerCode = 'MOMO'; // Partner Code của bạn
const accessKey = 'F8BBA842ECF85'; // Access Key của bạn
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz'; // Secret Key của bạn
const redirectUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'; // URL chuyển hướng sau khi thanh toán
const ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b'; // URL để nhận thông báo thanh toán
const requestType = "payWithMethod";

// Hàm thanh toán MoMo
const momoPayment = async (req, res) => {
    const { amount, orderInfo, redirectUrl } = req.body;
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';

    // Tạo chuỗi ký HMAC SHA256
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto.createHmac('sha256', secretKey)
        .update(rawSignature)
        .digest('hex');

    // Tạo đối tượng JSON gửi đến MoMo
    const requestBody = JSON.stringify({
        partnerCode,
        partnerName: "Test",
        storeId: "MomoTestStore",
        requestId,
        amount,
        orderId,
        orderInfo,
        redirectUrl, // Sử dụng redirectUrl từ yêu cầu
        ipnUrl,
        lang,
        requestType,
        autoCapture,
        extraData,
        signature
    });

    // Tạo đối tượng HTTPS
    const options = {
        hostname: 'test-payment.momo.vn',
        port: 443,
        path: '/v2/gateway/api/create',
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody)
        }
    };

    // Gửi yêu cầu và nhận phản hồi
    const reqMomo = https.request(options, (resMomo) => {
        resMomo.setEncoding('utf8');
        let body = '';

        resMomo.on('data', (chunk) => {
            body += chunk;
        });

        resMomo.on('end', () => {
            const response = JSON.parse(body);
            if (response && response.payUrl) {
                console.log("response resMomo: 80",response)
                res.json({ payUrl: response.payUrl }); // Trả về URL thanh toán MoMo
            } else {
                res.status(500).json({ error: 'Thanh toán thất bại' });
            }
        });
    });

    reqMomo.on('error', (e) => {
        console.error(`Problem with request: ${e.message}`);
        res.status(500).json({ error: 'Thanh toán thất bại' });
    });

    // Ghi dữ liệu vào body yêu cầu
    reqMomo.write(requestBody);
    reqMomo.end();
};

const handleMomoCallback = async (req, res) => {
    const { orderId, paymentId, payerId } = req.body; // Lấy thông tin từ callback

    console.log("Received callback for orderId:", orderId);

    // Cập nhật trạng thái đơn hàng
    let order = await Order.findById(orderId);
    if (!order) {
        console.error("Order not found for orderId:", orderId);
        return res.status(404).json({ success: false, message: "Order not found!" });
    }

    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentId;
    order.payerId = payerId;

    // Cập nhật số lượng tồn kho và xóa sản phẩm
    for (let item of order.cartItems) {
        let product = await Product.findById(item.productId);
        if (product) {
            product.totalStock -= item.quantity; // Giảm số lượng tồn kho
            await product.save(); // Lưu thay đổi
        }
    }

    // Xóa giỏ hàng sau khi thanh toán thành công
    await Cart.findByIdAndDelete(order.cartId); // Xóa giỏ hàng

    await order.save();
    res.redirect("http://localhost:5173/shop/payment-success"); // Chuyển hướng đến trang thành công
};

module.exports = { momoPayment, handleMomoCallback };