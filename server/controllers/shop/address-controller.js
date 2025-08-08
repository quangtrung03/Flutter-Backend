const Address = require("../../models/Address");

const addAddress = async (req, res) => {
  try {
    const { userId, streetAddress, ward, district, city, phone, notes } = req.body;

    if (!userId || !streetAddress || !ward || !district || !city || !phone) {
      return res.status(400).json({
        success: false,
        message: "Invalid data provided!",
      });
    }

    const newAddress = new Address({
      userId,
      streetAddress,
      ward,
      district,
      city,
      phone,
      notes
    });

    await newAddress.save();

    res.status(201).json({
      success: true,
      data: newAddress,
    });
  } catch (e) {
    console.error("Error adding address:", e);
    res.status(500).json({
      success: false,
      message: "Server error while adding address",
    });
  }
};

const fetchAllAddress = async (req, res) => {
  try {
    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({
        success: false,
        message: "User ID is required!",
      });
    }

    const addressList = await Address.find({ userId });

    res.status(200).json({
      success: true,
      data: addressList,
    });
  } catch (e) {
    console.error("Error fetching addresses:", e);
    res.status(500).json({
      success: false,
      message: "Server error while fetching addresses",
    });
  }
};

const editAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    const { streetAddress, ward, district, city, phone, notes } = req.body;

    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Address ID are required!",
      });
    }

    const updatedAddress = await Address.findOneAndUpdate(
      { _id: addressId, userId },
      { streetAddress, ward, district, city, phone, notes },
      { new: true }
    );

    if (!updatedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      data: updatedAddress,
    });
  } catch (e) {
    console.error("Error updating address:", e);
    res.status(500).json({
      success: false,
      message: "Server error while updating address",
    });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const { userId, addressId } = req.params;
    if (!userId || !addressId) {
      return res.status(400).json({
        success: false,
        message: "User ID and Address ID are required!",
      });
    }

    const deletedAddress = await Address.findOneAndDelete({ _id: addressId, userId });

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Address deleted successfully",
    });
  } catch (e) {
    console.error("Error deleting address:", e);
    res.status(500).json({
      success: false,
      message: "Server error while deleting address",
    });
  }
};

module.exports = { addAddress, editAddress, fetchAllAddress, deleteAddress };
