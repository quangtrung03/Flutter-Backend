const Voucher = require("../../models/Voucher");

// ✅ Lấy tất cả voucher
const getAllVouchers = async (req, res) => {
  try {
    const vouchers = await Voucher.find();
    res.status(200).json({ success: true, data: vouchers });
  } catch (err) {
    res.status(500).json({ success: false, message: "Lỗi server" });
  }
};

// ✅ Tạo mới voucher
const createVoucher = async (req, res) => {
  try {
    const voucher = new Voucher(req.body);
    await voucher.save();
    res.status(201).json({ success: true, data: voucher });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ✅ Cập nhật voucher
const updateVoucher = async (req, res) => {
  try {
    const voucher = await Voucher.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.status(200).json({ success: true, data: voucher });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// ✅ Xoá voucher
const deleteVoucher = async (req, res) => {
  try {
    await Voucher.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Đã xoá voucher" });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// GET /api/voucher/available
const getAvailableVouchers = async (req, res) => {
  const now = new Date();
  const vouchers = await Voucher.find({
    isActive: true,
    $or: [
      { expiredAt: { $exists: false } },
      { expiredAt: { $gt: now } },
    ],
  });

  res.status(200).json({ success: true, data: vouchers });
};


module.exports = {
  getAllVouchers,
  createVoucher,
  updateVoucher,
  deleteVoucher,
  getAvailableVouchers
};
