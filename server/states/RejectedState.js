const OrderState = require("./OrderState");

class RejectedState extends OrderState {
  setStatus(newState) {
    throw new Error("Rejected orders cannot change state");
  }
}

module.exports = RejectedState;


