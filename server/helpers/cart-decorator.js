// ✅ File: server/helpers/decorators/cart-discount.js

class Cart {
  constructor(items) {
    this.items = items;
  }

  getTotal() {
    return this.items.reduce((sum, item) => {
      const price = item.salePrice > 0 ? item.salePrice : item.price;
      return sum + price * item.quantity;
    }, 0);
  }
}

class BaseDecorator {
  constructor(cart) {
    this.cart = cart;
  }

  getTotal() {
    return this.cart.getTotal();
  }
}

class PercentVoucherDecorator extends BaseDecorator {
  constructor(cart, percentage, maxDiscount) {
    super(cart);
    this.percentage = percentage;
    this.maxDiscount = maxDiscount;
  }

  getTotal() {
    const total = super.getTotal();
    const discount = Math.min((total * this.percentage) / 100, this.maxDiscount);
    return Math.max(0, total - discount);
  }
}

class FixedVoucherDecorator extends BaseDecorator {
  constructor(cart, fixedAmount) {
    super(cart);
    this.fixedAmount = fixedAmount;
  }

  getTotal() {
    const total = super.getTotal();
    return Math.max(0, total - this.fixedAmount);
  }
}

module.exports = {
  Cart,
  PercentVoucherDecorator,
  FixedVoucherDecorator,
};