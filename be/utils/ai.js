const { GoogleGenAI, createUserContent, createPartFromUri } = require('@google/genai');
const fs = require('fs/promises'); // <-- NEW
const path = require('path');       // <-- NEW

// Initialize the GoogleGenAI instance
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const modelName = "gemini-2.5-flash"; // Standard model for chat

// --- 1. File Upload/Deletion Utilities ---

/**
 * Uploads a file buffer to the Gemini API by temporarily writing it to disk.
 * This workaround fixes the 'file.size_bytes undefined' error when using Multer Buffers.
 * * @param {Buffer} buffer - The file data buffer.
 * @param {string} mimeType - The MIME type of the file.
 * @returns {object} The Gemini File object.
 */
const uploadFileToGemini = async (buffer, mimeType) => {
    // 1. Determine a temporary file path
    const fileExtension = mimeType.split('/')[1] || 'bin';
    const tempFileName = `temp_upload_${Date.now()}.${fileExtension}`;
    // Use the OS temp directory for safety
    const tempFilePath = path.join(process.env.TEMP || process.env.TMPDIR || '/tmp', tempFileName);

    try {
        // 2. Write the buffer to the temporary file
        await fs.writeFile(tempFilePath, buffer);

        // 3. Upload the file using the file path string (The method that works)
        const file = await ai.files.upload({
            file: tempFilePath, // <-- Passing the path string
            mimeType: mimeType
        });

        console.log(`Successfully uploaded file to Gemini: ${file.name}`);
        return file;

    } catch (error) {
        console.error("Error uploading file to Gemini API:", error);
        throw new Error("Failed to upload file to AI service.");
    } finally {
        // 4. Cleanup: Immediately delete the temporary file from the local disk
        try {
            await fs.unlink(tempFilePath);
        } catch (e) {
            console.warn(`Could not delete temporary file: ${tempFilePath}`, e);
        }
    }
};

/**
 * Deletes a file from the Gemini API using its URI (name).
 * @param {string} fileUri - The file URI (name) from the Gemini File object.
 */
const deleteFileFromGemini = async (fileUri) => {
    try {
        await ai.files.delete({ name: fileUri });
    } catch (error) {
        console.warn(`Could not delete file ${fileUri} from Gemini:`, error.message);
        // We log a warning but don't crash the server, as cleanup is secondary
    }
};


// --- 2. Message Generation Utilities ---

/**
 * Generates content using the chat history and new content parts (text + file reference).
 * This function handles both text-only and multimodal inputs using SDK utilities.
 * * @param {Array<object>} history - The existing conversation history in Gemini format.
 * @param {Array<object>} contentParts - The user's new message parts (text and fileData).
 * @returns {string} The text response from the AI.
 */
const callGeminiApi = async (history, contentParts) => {

    // 1. Determine the parts for the new user message
    const partsForNewMessage = [];
    let textMessage = '';

    // Loop through the array of parts created in the router
    for (const part of contentParts) {
        if (part.text) {
            // Found the text part
            textMessage = part.text;

        } else if (part.fileData) {
            // Found the file part (multimodal)
            // Use the utility to convert the URI/MimeType into a proper Part object
            partsForNewMessage.push(
                createPartFromUri(part.fileData.fileUri, part.fileData.mimeType)
            );
        }
    }

    // 2. Add the text message last (as a simple string, which handles text-only case)
    if (textMessage) {
        partsForNewMessage.push(textMessage);
    }

    // 3. Create the final content array: History + New Multimodal Message
    const contents = [
        ...history,
        // Use createUserContent to ensure the new message object is correctly structured
        createUserContent(partsForNewMessage)
    ];

    //console.log('Final Content:', JSON.stringify(contents, null, 2));

    // 4. Send the request
    const response = await ai.models.generateContent({
        model: modelName,
        contents: contents
    });

    return response.text;
};

/**
 * Generates a title based on a specific prompt (used for auto-rename).
 * @param {string} prompt - The prompt containing conversation context.
 * @returns {string} The generated title.
 */
const generateTitle = async (prompt) => {
    const result = await ai.models.generateContent({
        model: modelName,
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
    });

    // Clean up quotes from the generated title
    return result.text.trim().replace(/^['"]|['"]$/g, '');
};


module.exports = {
    uploadFileToGemini,
    deleteFileFromGemini,
    callGeminiApi,
    generateTitle
};