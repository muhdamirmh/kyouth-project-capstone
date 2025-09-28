const express = require('express');
const router = express.Router();
const User = require('../models/user');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

/**
 * @swagger
 * tags:
 *  name: Auth
 *  description: User authentication and management
 */

// POST /api/auth/register
/**
 * @swagger
 * /auth/register:
 *  post:
 *   summary: Register a new user
 *   tags:
 *    - Auth
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       required:
 *       - email
 *       - password
 *       properties:
 *        email:
 *         type: string
 *         format: email
 *         description: The user's email address.
 *        password:
 *         type: string
 *         format: password
 *         description: The user's password (will be hashed).
 *   responses:
 *    201:
 *     description: User registered successfully
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: true
 *         message:
 *          type: string
 *          example: User registered successfully
 *    400:
 *     description: User already exists
 *    500:
 *     description: Internal Server Error
 */
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email });
        if (user) {
            // Using standardized JSON response format
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        user = new User({ email, password });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);
        await user.save();

        res.status(201).json({ success: true, message: 'User registered successfully' });

    } catch (err) {
        logger.error(`/register: ${email}`, err.stack);
        res.status(500).json({ success: false, message: 'An unexpected technical error occurred.'});
    }
});

// POST /api/auth/login
/**
 * @swagger
 * /auth/login:
 *  post:
 *   summary: Authenticate a user and return an auth token
 *   tags:
 *    - Auth
 *   requestBody:
 *    required: true
 *    content:
 *     application/json:
 *      schema:
 *       type: object
 *       required:
 *       - email
 *       - password
 *       properties:
 *        email:
 *         type: string
 *         format: email
 *         example: test@example.com
 *        password:
 *         type: string
 *         format: password
 *         example: 123456
 *   responses:
 *    200:
 *     description: Login successful, returns JWT token
 *     content:
 *      application/json:
 *       schema:
 *        type: object
 *        properties:
 *         success:
 *          type: boolean
 *          example: true
 *         token:
 *          type: string
 *          description: JSON Web Token (JWT) for authentication.
 *          example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *    400:
 *     description: Invalid credentials (Email/Password incorrect)
 *    500:
 *     description: Internal Server Error
 */
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ success: false, message: 'Email does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Password is incorrect' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ success: true, token }); // Send the token back
            }
        );

    } catch (err) {
        logger.error(`/login: ${email}`, err.stack);
        res.status(500).json({ success: false, message: 'An unexpected technical error occurred.'});
    }
});

module.exports = router;