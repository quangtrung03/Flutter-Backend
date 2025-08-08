// helpers/momo.js
const crypto = require('crypto');
const https = require('https');

const partnerCode = 'MOMO';
const accessKey = 'F8BBA842ECF85';
const secretKey = 'K951B6PE1waDMi640xX08PD3vg6EkVlz';
const ipnUrl = 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b';
const requestType = "payWithMethod";

const momoPaymentLogic = ({ amount, orderInfo, redirectUrl }) => {
  return new Promise((resolve, reject) => {
    const orderId = partnerCode + new Date().getTime();
    const requestId = orderId;
    const extraData = '';
    const autoCapture = true;
    const lang = 'vi';

    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

    const signature = crypto.createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    const requestBody = JSON.stringify({
      partnerCode,
      partnerName: "Test",
      storeId: "MomoTestStore",
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      lang,
      requestType,
      autoCapture,
      extraData,
      signature
    });

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

    const req = https.request(options, (resMomo) => {
      let data = '';
      resMomo.on('data', (chunk) => data += chunk);
      resMomo.on('end', () => {
        try {
          const response = JSON.parse(data);
          if (response?.payUrl) {
            resolve({ payUrl: response.payUrl });
          } else {
            reject(response);
          }
        } catch (err) {
          reject(err);
        }
      });
    });

    req.on('error', (err) => reject(err));
    req.write(requestBody);
    req.end();
  });
};

module.exports = { momoPaymentLogic };
