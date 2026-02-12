const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dns = require('dns');
const helmet = require('helmet');

dns.setServers(['8.8.8.8', '8.8.4.4']);
dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = process.env.PORT || 5001;

mongoose.connect(process.env.MONGODB_URI, { family: 4 })
    .then(() => console.log('MongoDB Atlas Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

app.use(helmet());
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5001',
    'http://localhost:5000',
    process.env.CLIENT_URL // Add this for Vercel deployment
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) === -1) {
            const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
            return callback(new Error(msg), false);
        }
        return callback(null, true);
    },
    credentials: true
}));

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use('/api/projects', require('./routes/projects'));
app.use('/api/resume', require('./routes/resume'));
app.use('/api/contact', require('./routes/contact'));

const authLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    message: { message: 'Too many login attempts. Access blocked for 1 hour for security.' },
});
app.use('/api/auth', authLimiter, require('./routes/auth'));

app.use(require('./middleware/errorMiddleware'));

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
setInterval(() => { }, 10000);
