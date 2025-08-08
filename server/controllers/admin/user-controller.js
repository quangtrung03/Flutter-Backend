const User = require('../../models/User');
const Order = require('../../models/Order');

// Lấy danh sách tất cả người dùng
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find();
        res.json({ success: true, data: users });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// 🔧 NEW: Lấy chi tiết một người dùng
exports.getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        console.log('📡 Getting user details for ID:', id);
        
        const user = await User.findById(id);
        
        if (!user) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy người dùng' 
            });
        }
        
        console.log('✅ User found:', user.userName);
        res.json({ 
            success: true, 
            user: user 
        });
    } catch (err) {
        console.error('❌ Error getting user details:', err);
        res.status(500).json({ 
            success: false, 
            message: err.message 
        });
    }
};

// Tạo người dùng mới
exports.createUser = async (req, res) => {
    const user = new User({
        id: req.body.id,
        userName: req.body.userName,
        email: req.body.email,
        password: req.body.password,
        role: req.body.role,
        avatar: req.body.avatar
    });

    try {
        const newUser = await user.save();
        res.status(201).json(newUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

// Cập nhật thông tin người dùng
exports.updateUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (user == null) {
            return res.status(404).json({ message: 'Cannot find user' });
        }

        if (req.body.userName != null) {
            user.userName = req.body.userName;
        }
        if (req.body.email != null) {
            user.email = req.body.email;
        }
        if (req.body.password != null) {
            user.password = req.body.password;
        }
        if (req.body.role != null) {
            user.role = req.body.role;
        }
        if (req.body.avatar != null) {
            user.avatar = req.body.avatar;
        }

        const updatedUser = await user.save();
        res.json(updatedUser);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        const orders = await Order.find({ userId: id });

        if (orders.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Cannot delete a user with existing orders.",
            });
        }

        await User.findByIdAndDelete(id);

        res.status(200).json({
            success: true,
            message: "User deleted successfully.",
        });
    } catch (e) {
        console.log(e);
        res.status(500).json({
            success: false,
            message: "Some error occurred!",
        });
    }
};