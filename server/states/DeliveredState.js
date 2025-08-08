const OrderState = require("./OrderState");

class DeliveredState extends OrderState {
  setStatus(newState) {
    throw new Error("Delivered orders cannot change state");
  }
}

module.exports = DeliveredState;
