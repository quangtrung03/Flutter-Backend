const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    userName: {
        type: String,
        required: true,
        unique: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: 'user'
    },
    avatar: {
        type: String,
        default: null
    },
    addresses: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Address"
    }],
    notificationSettings: {
        type: Object,
        default: {
            newOrder: true,
            orderStatusUpdate: true,
            orderDelivered: true,
            orderCancelled: true,
            promotions: false,
            newProduct: false,
        }
    }
});

module.exports = mongoose.model("User", UserSchema);