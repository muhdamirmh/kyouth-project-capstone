const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true, // Ensures no two users share the same email
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
},
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);