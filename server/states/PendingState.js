const OrderState = require("./OrderState");

class PendingState extends OrderState {
  setStatus(newState) {
    if (newState === "inShipping") {
      this.order.setState(this.order.inShippingState);
    } else if (newState === "rejected") {
      this.order.setState(this.order.rejectedState);
    } else {
      throw new Error("Invalid status transition from Pending");
    }
  }
}

module.exports = PendingState;