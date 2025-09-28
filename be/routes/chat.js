const express = require('express');
const router = express.Router();
const multer = require('multer'); // <-- NEW: File upload middleware
const logger = require('../utils/logger');
const auth = require('../middlewares/auth');
const Chat = require('../models/chat');
const { // <-- NEW: Import AI utilities
    uploadFileToGemini,
    deleteFileFromGemini,
    callGeminiApi,
    generateTitle,
    formatHistoryForGemini
} = require('../utils/ai');

// Configure multer to store file buffers in memory
const upload = multer({ storage: multer.memoryStorage() });

// --- Global Tags Definition (Using working format) ---
/**
 * @swagger
 * tags:
 *  name: Chats
 *  description: AI Chat Session and Message Management
 */

/**
 * @route   POST /api/v1/chats/new
 * @desc    Create a new chat session for the logged-in user
 * @access  Private
 */

/**
 * @swagger
 * /chats/new:
 *  post:
 *   summary: Create a new chat session
 *   tags:
 *    - Chats
 *   security:
 *    - AuthToken: []
 *   requestBody:
 *    required: false
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       properties:
 *        title:
 *         type: string
 *         description: Optional initial title for the chat.
 *   responses:
 *    200:
 *     description: New chat session created successfully
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        description: The returned value is the full Chat schema (as follows the Chat model).
 *    500:
 *     description: Server Error
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
        logger.error(`/new:`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

/**
 * @route   GET /api/v1/chats/all
 * @desc    Get all chat sessions for the logged-in user
 * @access  Private
 */

/**
 * @swagger
 * /chats/all:
 *  get:
 *   summary: Get all chat sessions
 *   tags: [Chats]
 *   security:
 *   - AuthToken: []
 *   responses:
 *    200:
 *     description: A list of chat titles and IDs
 *     content:
 *      application/json:
 *       schema:
 *        type: array
 *        items:
 *         type: object
 *         description: The returned value is multiple objects of the full Chat schema (as follows the Chat model).
 *    500:
 *     description: Server Error
 */
router.get('/all', auth, async (req, res) => {
    try {
        // Find all chats belonging to the user, ordered by most recent
        const chats = await Chat.find({ user: req.user.id }).select('title createdAt _id').sort({ createdAt: -1 });
        res.json(chats);
    } catch (err) {
        logger.error(`/all`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

/**
 * @route   GET /api/v1/chats/:chatId
 * @desc    Get a specific chat session and its history
 * @access  Private
 */

/**
 * @swagger
 * /chats/{chatId}:
 *  get:
 *   summary: Get specific chat session and history
 *   tags: [Chats]
 *   security:
 *   - AuthToken: []
 *   parameters:
 *   - in: path
 *   - name: chatId
 *   schema:
 *    type: string
 *    required: true
 *    description: The ID of the chat session to retrieve.
 *   responses:
 *    200:
 *     description: The full chat session data including messages.
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        description: The returned value is the full Chat schema (as follows the Chat model).
 *    404:
 *     description: Chat not found
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         msg:
 *          type: string
 *          example: Chat not found
 *    500:
 *     description: Server Error
 */
router.get('/:chatId', auth, async (req, res) => {
    try {
        const chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        if (!chat) {
            return res.status(404).json({ msg: 'Chat not found' });
        }
        res.json(chat);
    } catch (err) {
        logger.error(`/:chatId: ${req.params.chatId}`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

/**
 * @route   POST /api/v1/chats/:chatId/title
 * @desc    Manually rename chat or request AI auto-rename
 * @access  Private
 */
/**
 * @swagger
 * /chats/{chatId}/title:
 *  post:
 *   summary: Rename chat (manual or AI auto-generate)
 *   tags: [Chats]
 *   security:
 *   - AuthToken: []
 *   parameters:
 *   - in: path
 *   - name: chatId
 *   schema:
 *    type: string
 *    required: true
 *    description: The ID of the chat session.
 *    requestBody:
 *     required: false
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         newTitle:
 *         type: string
 *         description: New title if renaming manually. Omit for AI auto-rename.
 *   responses:
 *    200:
 *     description: Chat title updated
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         title:
 *           type: string
 *           example: My New Descriptive Chat Title
 *    400:
 *     description: Bad Request (e.g., trying to auto-rename an empty chat)
 *    404:
 *     description: Chat not found
 *    500:
 *     description: Server Error
 */
router.post('/:chatId/title', auth, async (req, res) => {
    const { newTitle } = req.body || {};
    try {
        let chat = await Chat.findOne({ _id: req.params.chatId, user: req.user.id });
        if (!chat) return res.status(404).json({ msg: 'Chat not found' });

        if (newTitle) { // Manual Rename
            chat.title = newTitle;
        } else { // Auto-Rename (AI Logic) (Auto-Titling)
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
        logger.error(`/:chatId/title: ${req.params.chatId}`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
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

/**
 * @swagger
 * /chats/{chatId}/message:
 *  post:
 *   summary: Send message to AI (supports text and file upload)
 *   tags: [Chats]
 *   security:
 *   - AuthToken: []
 *   parameters:
 *   - in: path
 *   - name: chatId
 *   schema:
 *    type: string
 *    required: true
 *    description: The ID of the chat session.
 *   requestBody:
 *    required: true
 *    content:
 *     multipart/form-data:
 *      schema:
 *       type: object
 *       properties:
 *        message:
 *         type: string
 *         description: The user's text prompt.
 *       file:
 *        type: string
 *        format: binary
 *        description: Optional file upload (image, PDF, etc.) for multimodal prompt.
 *   responses:
 *    200:
 *     description: Returns the updated chat messages array (user message + AI response).
 *     content:
 *      application/json:
 *       schema:
 *        type: array
 *        items:
 *         type: object
 *         description: The returned value is multiple objects of the full Chat schema (as follows the Chat model).
 *    404:
 *     description: Chat not found
 *    500:
 *     description: Server Error
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
        logger.error(`/:chatId/message: ${req.params.chatId}`, err.stack);
        // Ensure cleanup even on server error
        if (uploadedFile) {
            await deleteFileFromGemini(uploadedFile.name);
        }
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }

});

/**
 * @route   DELETE /api/v1/chats/:chatId
 * @desc    Delete a specific chat session
 * @access  Private
 */

/**
 * @swagger
 * /chats/{chatId}:
 *  delete:
 *   summary: Delete a chat session
 *   tags: [Chats]
 *   security:
 *   - AuthToken: []
 *   parameters:
 *   - in: path
 *   - name: chatId
 *   schema:
 *    type: string
 *    required: true
 *    description: The ID of the chat session to delete.
 *   responses:
 *    200:
 *     description: Chat successfully deleted
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         msg:
 *          type: string
 *          example: Chat deleted
 *    404:
 *     description: Chat not found
 *    500:
 *     description: Server Error
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
        logger.error(`/:chatId: ${req.params.chatId}`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

module.exports = router;
