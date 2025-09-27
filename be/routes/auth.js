const express = require('express');
const router = express.Router();
const User = require('../models/user'); // Import the model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// POST /api/auth/register
router.post('/register', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. Check if user already exists
        let user = await User.findOne({ email });
        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        user = new User({ email, password });

        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(password, salt);

        await user.save();

        res.status(201).json({ msg: 'User registered successfully' });

    } catch (err) {
        logger.error(`/register: ${email}`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'Email does not exist' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Password is incorrect' });
        }

        const payload = {
            user: {
                id: user.id,
            },
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET, // JWT_SECRET must be in your .env file
            { expiresIn: '5h' }, // Token expiration time
            (err, token) => {
                if (err) throw err;
                res.json({ token }); // Send the token back to the frontend
            }
        );

    } catch (err) {
        logger.error(`/login: ${email}`, err.stack);
        res.status(500).json({ msg: 'An unexpected error occurred, please try again later'});
    }
});

module.exports = router;