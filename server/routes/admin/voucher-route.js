const express = require("express");
const {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getAvailableVouchers,
} = require("../../controllers/admin/voucher-controller");

const router = express.Router();

router.get("/", getAllVouchers);              // GET all
router.post("/", createVoucher);              // POST new
router.put("/:id", updateVoucher);            // PUT update
router.delete("/:id", deleteVoucher);  
router.get("/available", getAvailableVouchers); // GET available

module.exports = router;
