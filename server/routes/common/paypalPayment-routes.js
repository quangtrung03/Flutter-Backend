const express = require("express");
const paypal = require("../../helpers/paypal");
const { paypalCurrencyMiddleware, formatCurrency } = require("../../helpers/currency-converter");

const router = express.Router();

// Create PayPal payment
router.post("/create", paypalCurrencyMiddleware, async (req, res) => {
  try {
    const { amount, currency = "USD", description, orderId } = req.body;

    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid amount"
      });
    }

    // Tạo description chi tiết hơn
    let paymentDescription = description || "Coffee Shop Payment";
    if (orderId) {
      paymentDescription = `Order #${orderId} - ${paymentDescription}`;
    }

    const create_payment_json = {
      intent: "sale",
      payer: {
        payment_method: "paypal",
      },
      redirect_urls: {
        // 🔧 FIX: Sử dụng dynamic URL từ AppConfig.baseUrl
        return_url: `${process.env.BASE_URL || 'http://10.0.2.2:5000'}/api/common/payment/paypal/success?orderId=${orderId || ''}`,
        cancel_url: `${process.env.BASE_URL || 'http://10.0.2.2:5000'}/api/common/payment/paypal/cancel?orderId=${orderId || ''}`,
      },
      transactions: [
        {
          amount: {
            currency: currency,
            total: amount.toString(),
          },
          description: paymentDescription,
        },
      ],
    };

    paypal.payment.create(create_payment_json, (error, payment) => {
      if (error) {
        console.error("❌ PayPal create payment error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create PayPal payment",
          error: error.message
        });
      }

      const approvalUrl = payment.links.find((link) => link.rel === "approval_url")?.href;

      if (!approvalUrl) {
        return res.status(500).json({
          success: false,
          message: "No approval URL found in PayPal response"
        });
      }

      res.status(200).json({
        success: true,
        approvalUrl: approvalUrl,
        paymentId: payment.id,
        orderId: orderId || null,
        originalAmount: req.body.originalAmount || amount,
        originalCurrency: req.body.originalCurrency || currency,
        convertedAmount: amount,
        convertedCurrency: currency
      });
    });
  } catch (error) {
    console.error("❌ PayPal create error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating PayPal payment",
      error: error.message
    });
  }
});

// Capture/Execute PayPal payment
router.post("/capture", async (req, res) => {
  try {
    const { paymentId, payerId } = req.body;

    if (!paymentId || !payerId) {
      return res.status(400).json({
        success: false,
        message: "Payment ID and Payer ID are required"
      });
    }

    const execute_payment_json = {
      payer_id: payerId,
    };

    paypal.payment.execute(paymentId, execute_payment_json, (error, payment) => {
      if (error) {
        console.error("❌ PayPal execute payment error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to execute PayPal payment",
          error: error.message
        });
      }

      if (payment.state === "approved") {
        res.status(200).json({
          success: true,
          message: "Payment executed successfully",
          payment: payment
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Payment not approved",
          state: payment.state
        });
      }
    });
  } catch (error) {
    console.error("❌ PayPal capture error:", error);
    res.status(500).json({
      success: false,
      message: "Server error capturing PayPal payment",
      error: error.message
    });
  }
});

// Get payment details
router.get("/details/:paymentId", async (req, res) => {
  try {
    const { paymentId } = req.params;

    paypal.payment.get(paymentId, (error, payment) => {
      if (error) {
        console.error("❌ PayPal get payment error:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to get PayPal payment details",
          error: error.message
        });
      }

      res.status(200).json({
        success: true,
        payment: payment
      });
    });
  } catch (error) {
    console.error("❌ PayPal details error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting PayPal payment details",
      error: error.message
    });
  }
});

// Handle PayPal success redirect (for web callback)
router.get("/success", (req, res) => {
  const { paymentId, PayerID, token, orderId } = req.query;
  
  console.log("✅ PayPal success callback received:");
  console.log("  - PaymentId:", paymentId);
  console.log("  - PayerID:", PayerID);
  console.log("  - Token:", token);
  console.log("  - OrderId:", orderId);

  // Return a simple HTML page that closes the webview and sends data back
  const successData = {
    success: true,
    paymentId,
    PayerID,
    token,
    orderId: orderId || null
  };

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PayPal Payment Success</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 20px;
          background: #f8f9fa;
        }
        .container {
          max-width: 400px;
          margin: 50px auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .success {
          color: #28a745;
          font-size: 24px;
          margin-bottom: 20px;
        }
        .loading {
          color: #007bff;
          font-size: 16px;
        }
        .data {
          background: #f8f9fa;
          padding: 10px;
          margin: 20px 0;
          border-radius: 5px;
          font-family: monospace;
          font-size: 12px;
          text-align: left;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success">✅ Thanh toán thành công!</div>
        <div class="loading">Đang xử lý đơn hàng...</div>
        <div class="data">${JSON.stringify(successData, null, 2)}</div>
        <p>Cửa sổ sẽ tự động đóng trong giây lát.</p>
      </div>
      <script>
        // Send message to parent window (for mobile WebView)
        if (window.parent) {
          window.parent.postMessage(${JSON.stringify(successData)}, '*');
        }
        
        // For Flutter emulator - redirect to custom scheme
        setTimeout(() => {
          const params = new URLSearchParams(${JSON.stringify(successData)});
          window.location.href = 'mobilenc://payment/success?' + params.toString();
        }, 2000);
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Handle PayPal cancel redirect
router.get("/cancel", (req, res) => {
  console.log("❌ PayPal payment cancelled");
  
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>PayPal Payment Cancelled</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          text-align: center; 
          padding: 20px;
          background: #f8f9fa;
        }
        .container {
          max-width: 400px;
          margin: 50px auto;
          background: white;
          padding: 30px;
          border-radius: 10px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .cancel {
          color: #dc3545;
          font-size: 24px;
          margin-bottom: 20px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="cancel">❌ Thanh toán đã bị hủy</div>
        <p>Bạn đã hủy giao dịch PayPal.</p>
        <p>Cửa sổ sẽ tự động đóng trong giây lát.</p>
      </div>
      <script>
        setTimeout(() => {
          window.location.href = 'mobilenc://payment/cancel';
        }, 1000);
      </script>
    </body>
    </html>
  `;
  
  res.send(html);
});

// Update order after successful PayPal payment
router.post("/update-order", async (req, res) => {
  try {
    const { orderId, paymentId, payerId } = req.body;

    if (!orderId || !paymentId || !payerId) {
      return res.status(400).json({
        success: false,
        message: "Order ID, Payment ID and Payer ID are required"
      });
    }

    // Import Order model (make sure this path is correct)
    const Order = require("../../models/Order");

    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        paymentStatus: "paid",
        orderStatus: "confirmed", // Auto confirm PayPal orders
        paymentId: paymentId,
        payerId: payerId,
        updatedAt: new Date()
      },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({
        success: false,
        message: "Order not found"
      });
    }

    console.log(`✅ Order ${orderId} updated after PayPal payment`);

    res.status(200).json({
      success: true,
      message: "Order updated successfully",
      order: updatedOrder
    });

  } catch (error) {
    console.error("❌ Error updating order after PayPal payment:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating order",
      error: error.message
    });
  }
});

module.exports = router;
