const express = require('express');
const router = express.Router();
const multer = require('multer'); // <-- NEW: File upload middleware
const auth = require('../middlewares/auth');
const Chat = require('../models/chat');
const { // <-- NEW: Import AI utilities
    uploadFileToGemini,
    deleteFileFromGemini,
    callGeminiApi,
    generateTitle
} = require('../utils/ai');

// Configure multer to store file buffers in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- Helper function to prepare Mongoose history for Gemini ---
const formatHistoryForGemini = (messages) => {
    return messages.map(msg => {
        const cleanMsg = msg.toObject ? msg.toObject() : msg;

        // 1. FILTER out any parts that are NOT simple text (like file parts)
        const textParts = cleanMsg.parts
            .filter(part => part.text && part.text.length > 0)
            .map(part => ({ text: part.text }));

        // 2. Ensure the historical message has at least one part
        if (textParts.length === 0) {
            // If a historical message was ONLY a file, we skip it or replace it
            // For now, let's substitute it with a placeholder if the role is 'user'
            if (cleanMsg.role === 'user') {
                return { role: 'user', parts: [{ text: '[User sent a file]' }] };
            }
            // Model messages should always have text, but if not, skip them
            return null;
        }

        // 3. Return the clean message object
        return {
            role: cleanMsg.role,
            parts: textParts
        };
    }).filter(msg => msg !== null); // Remove any messages that were filtered out
};

/**
 * @route   POST /api/v1/chats/new
 * @desc    Create a new chat session for the logged-in user
 * @access  Private
 */
router.post('/new', auth, async (req, res) => {
    try {
        // Create a new chat document in the database
        const newChat = new Chat({
            user: req.user.id,
            title: req.body.title || 'New Chat',
        });
        await newChat.save();
        res.json(newChat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/v1/chats/all
 * @desc    Get all chat sessions for the logged-in user
 * @access  Private
 */
router.get('/all', auth, async (req, res) => {
    try {
        // Find all chats belonging to the user, ordered by most recent
        const chats = await Chat.find({ user: req.user.id }).select('title createdAt _id').sort({ createdAt: -1 });
        res.json(chats);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/v1/chats/:chatId
 * @desc    Get a specific chat session and its history
 * @access  Private
 */
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({ msg: 'Chat not found' });
        }
        res.json(chat);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   POST /api/v1/chats/:chatId/title
 * @desc    Manually rename chat or request AI auto-rename
 * @access  Private
 */
router.post('/:chatId/title', auth, async (req, res) => {
    const { newTitle } = req.body || {};
    try {
        let chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        if (newTitle) { // Manual Rename
            chat.title = newTitle;
        } else { // Auto-Rename (AI Logic)
            if (chat.messages.length < 2) {
                return res.status(400).json({ msg: 'Need conversation context for auto-rename.' });
            }
            const historyForContext = chat.messages.slice(0, 2);
            const prompt = `Based on the following first exchange, generate a concise, descriptive title (under 8 words) for this conversation thread. Only respond with the title text and nothing else. Conversation: ${JSON.stringify(historyForContext)}`;

            chat.title = await generateTitle(prompt); // <-- USING UTILITY FUNCTION
        }

        await chat.save();
        res.json({ title: chat.title });

    } catch (err) {
        console.error('Title Rename Error:', err.message);
        res.status(500).send({ msg: 'Failed to rename chat.' });
    }
});

// ==========================================================
// 2. MESSAGE ROUTE (MODIFIED FOR FILE UPLOAD)
// ==========================================================

/**
 * @route   POST /api/v1/chats/:chatId/message
 * @desc    Send a message (with optional file) and get an AI response
 * @access  Private
 */
router.post('/:chatId/message', auth, upload.single('file'), async (req, res) => {
    const { message } = req.body;
    const file = req.file; // File buffer provided by multer

    let uploadedFile = null; // To track the file uploaded to Gemini for cleanup

    try {
        let chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        // --- 1. File Upload to Gemini API ---
        if (file) {
            uploadedFile = await uploadFileToGemini(file.buffer, file.mimetype);
        }

        // --- 2. Construct User Message Parts ---
        const contentParts = [];



        // b. Add the text message (must be last if there's a file)
        contentParts.push({ text: message });

        // a. CORRECTLY format and add the file reference if one was uploaded
        if (uploadedFile) {
            contentParts.push({
                fileData: {
                    mimeType: uploadedFile.mimeType, // Get mimeType from the uploaded file object
                    fileUri: uploadedFile.name      // Use 'name' property (the URI)
                }
            });
        }

        // --- 3. Prepare History and Send to Gemini ---
        const geminiHistory = formatHistoryForGemini(chat.messages);

        const aiTextResponse = await callGeminiApi(geminiHistory, contentParts); // <-- USING UTILITY FUNCTION

        // --- 4. Database Updates and Cleanup ---

        // Add the user message (we store only text in DB, not the file buffer/reference)
        chat.messages.push({ role: 'user', parts: [{ text: message }] });

        // Add the AI response
        chat.messages.push({ role: 'model', parts: [{ text: aiTextResponse }] });
        await chat.save();

        // Delete the temporary file from the Gemini API
        if (uploadedFile) {
            await deleteFileFromGemini(uploadedFile.name); // Use .name for the URI/file name
        }

        res.json(chat.messages);

    } catch (err) {
        console.error('Message Processing Error:', err.message);
        // Ensure cleanup even on server error
        if (uploadedFile) {
            await deleteFileFromGemini(uploadedFile.name);
        }
        res.status(500).send('Server Error during message processing');
    }
});

/**
 * @route   DELETE /api/v1/chats/:chatId
 * @desc    Delete a specific chat session
 * @access  Private
 */
router.delete('/:chatId', auth, async (req, res) => {
    try {
        // Find and delete the chat, ensuring it belongs to the user
        const chat = await Chat.findOneAndDelete({ _id: req.params.chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({ msg: 'Chat not found' });
        }
        res.json({ msg: 'Chat deleted' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;