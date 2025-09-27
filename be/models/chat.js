const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
    // The user who owns this chat
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', // Reference to the User model
        required: true,
    },
    // The title of the conversation (e.g., "AI Chat about React")
    title: {
        type: String,
        required: true,
        default: 'New Chat',
    },
    // An array of message objects to store the conversation history
    messages: [
        {
            role: {
                type: String, // 'user' or 'model'
                enum: ['user', 'model'],
                required: true,
            },
            parts: [
                {
                    text: {
                        type: String,
                        required: true,
                    },
                    // NEW: Add a file field to store reference to uploaded content
                    file: {
                        type: {
                            type: String, // e.g., 'image/jpeg', 'application/pdf'
                        },
                        url: {
                            type: String, // The URL where the file is stored (e.g., S3 URL, or local path for now)
                        },
                    },
                },
            ],
            timestamp: {
                type: Date,
                default: Date.now,
            },
        },
    ],
},
    { timestamps: true }
);

module.exports = mongoose.model('Chat', ChatSchema);