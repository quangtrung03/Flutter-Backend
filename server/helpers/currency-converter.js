/**
 * Currency Conversion Helper
 * Xử lý chuyển đổi tiền tệ VND <-> USD cho PayPal
 */

// Tỷ giá cố định (trong thực tế nên dùng API real-time)
const EXCHANGE_RATES = {
  VND_TO_USD: 0.00004, // 1 VND = 0.00004 USD (tỷ giá xấp xỉ 25,000)
  USD_TO_VND: 25000    // 1 USD = 25,000 VND
};

/**
 * Chuyển đổi VND sang USD
 * @param {number} vndAmount - Số tiền VND
 * @returns {string} - Số tiền USD (2 decimal places)
 */
function convertVNDToUSD(vndAmount) {
  if (!vndAmount || isNaN(vndAmount) || vndAmount <= 0) {
    throw new Error('Invalid VND amount');
  }
  
  const usdAmount = vndAmount * EXCHANGE_RATES.VND_TO_USD;
  return usdAmount.toFixed(2);
}

/**
 * Chuyển đổi USD sang VND
 * @param {number} usdAmount - Số tiền USD
 * @returns {number} - Số tiền VND
 */
function convertUSDToVND(usdAmount) {
  if (!usdAmount || isNaN(usdAmount) || usdAmount <= 0) {
    throw new Error('Invalid USD amount');
  }
  
  return Math.round(usdAmount * EXCHANGE_RATES.USD_TO_VND);
}

/**
 * Validate currency code
 * @param {string} currency - Currency code
 * @returns {boolean}
 */
function isValidCurrency(currency) {
  const validCurrencies = ['USD', 'VND'];
  return validCurrencies.includes(currency?.toUpperCase());
}

/**
 * Format currency amount
 * @param {number} amount - Amount
 * @param {string} currency - Currency code
 * @returns {string} - Formatted amount
 */
function formatCurrency(amount, currency) {
  if (!amount || isNaN(amount)) return '0';
  
  switch (currency?.toUpperCase()) {
    case 'USD':
      return `$${parseFloat(amount).toFixed(2)}`;
    case 'VND':
      return `${parseInt(amount).toLocaleString('vi-VN')}₫`;
    default:
      return amount.toString();
  }
}

/**
 * Middleware xử lý conversion cho PayPal
 */
const paypalCurrencyMiddleware = (req, res, next) => {
  try {
    if (req.body.amount && req.body.currency) {
      const { amount, currency } = req.body;
      
      // Nếu currency là VND, convert sang USD
      if (currency.toUpperCase() === 'VND') {
        req.body.originalAmount = amount;
        req.body.originalCurrency = currency;
        req.body.amount = convertVNDToUSD(amount);
        req.body.currency = 'USD';
        
        console.log(`💱 Currency conversion: ${formatCurrency(req.body.originalAmount, 'VND')} → ${formatCurrency(req.body.amount, 'USD')}`);
      }
    }
    
    next();
  } catch (error) {
    return res.status(400).json({
      success: false,
      message: 'Currency conversion error',
      error: error.message
    });
  }
};

module.exports = {
  convertVNDToUSD,
  convertUSDToVND,
  isValidCurrency,
  formatCurrency,
  paypalCurrencyMiddleware,
  EXCHANGE_RATES
};
