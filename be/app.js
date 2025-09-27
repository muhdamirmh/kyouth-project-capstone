const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')
require('dotenv').config()

const authRoutes = require('./routes/auth')
const chatRoutes = require('./routes/chat')

const app = express()

const port = process.env.PORT || 3000
const dbURI = process.env.MONGODB_URI

const allowedOrigins = [
    // 1. Your Vercel domain
    process.env.FE_URL,
    process.env.FE_URL_DEV,
];

mongoose.connect(dbURI)
    .then(() =>
        console.log(`MongoDB connected successfully`),
        app.listen(port, () => {
            console.log(`Server is listening on http://localhost:${port}`)
        })
    )
    .catch(err => {
        console.error('MongoDB connection error:', err);
        process.exit(1); // Exit process with failure
    });

app.use(cors({
    origin: allowedOrigins,
    credentials: true // Important for handling cookies/JWTs
}));
app.use(express.json())
app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/chats', chatRoutes)

app.get('/', (req, res) => {
    res.send('Hello World!')
})

module.exports = app

