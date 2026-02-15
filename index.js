const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cookieParser = require('cookie-parser');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const dns = require('dns');
const helmet = require('helmet');

// dns.setServers(['8.8.8.8', '8.8.4.4']); // Removed as it can interfere with Render networking
dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (Render/Vercel)
const PORT = process.env.PORT || 5001;

const dbURI = process.env.MONGODB_URI;

if (!dbURI) {
    console.error('CRITICAL ERROR: MONGODB_URI is not defined in environment variables!');
} else {
    // Basic connection with logging
    mongoose.connect(dbURI)
        .then(() => console.log('✅ MongoDB Atlas Connected Successfully'))
        .catch(err => {
            console.error('❌ MongoDB Connection Error:', err.message);
            // On Render/Production, if DB fails to connect, we want to know why
        });
}

// Monitor DB connection state
const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', function () {
    console.log("DB connection established");
});

app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            "default-src": ["'self'"],
            "script-src": ["'self'", "'unsafe-inline'"],
            "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            "img-src": ["'self'", "data:", "https://porfolio-shaharman-backend.onrender.com", "https://*.onrender.com"],
            "connect-src": ["'self'", "https://porfolio-shaharman-backend.onrender.com", "https://*.onrender.com"],
            "font-src": ["'self'", "https://fonts.gstatic.com"],
            "object-src": ["'none'"],
        },
    },
    crossOriginResourcePolicy: { policy: "cross-origin" }
}));
const allowedOrigins = [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5001',
    'http://localhost:5000',
    process.env.CLIENT_URL
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Allow requests with no origin (like mobile apps)
        if (!origin) return callback(null, true);

        // Check if origin is in allowed list
        const isAllowed = allowedOrigins.includes(origin) || origin.includes('localhost');

        if (isAllowed) {
            callback(null, true);
        } else {
            console.warn(`CORS blocked for origin: ${origin}`);
            callback(null, false); // Don't pass an Error() here, it causes 500
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

app.use(express.json());
app.use(cookieParser());

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/', (req, res) => {
    res.send('Portfolio Backend Server is running...');
});

app.get('/favicon.ico', (req, res) => res.status(204).end());

app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Server is awake' }));

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
