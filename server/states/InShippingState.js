const OrderState = require("./OrderState");

class InShippingState extends OrderState {
  setStatus(newState) {
    if (newState === "delivered") {
      this.order.setState(this.order.deliveredState);
    } else {
      throw new Error("Invalid status transition from In Shipping");
    }
  }
}

module.exports = InShippingState;
