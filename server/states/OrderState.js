class OrderState {
    constructor(order) {
      this.order = order;
    }
  
    setStatus(newState) {
      throw new Error("Method not implemented");
    }
  }
  
  module.exports =  OrderState;
  