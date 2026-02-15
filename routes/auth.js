const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
router.post('/login', asyncHandler(async (req, res) => {
    const { username, password, passcode } = req.body;

    if (passcode !== process.env.SECRET_ADMIN_PASSCODE) {
        res.status(401);
        throw new Error('Invalid master passcode');
    }

    const user = await User.findOne({ username });

    if (user && (await user.matchPassword(password))) {
        const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
            expiresIn: '30d'
        });

        // Check for production OR Render environment
        const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'Production';

        res.cookie('jwt', token, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'none' : 'lax',
            maxAge: 30 * 24 * 60 * 60 * 1000
        });

        res.json({
            _id: user._id,
            username: user.username
        });
    } else {
        res.status(401);
        throw new Error('Invalid credentials');
    }
}));

// @desc    Logout user / clear cookie
// @route   POST /api/auth/logout
// @access  Private
router.post('/logout', (req, res) => {
    const isProduction = process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'Production';

    res.cookie('jwt', '', {
        httpOnly: true,
        secure: isProduction,
        sameSite: isProduction ? 'none' : 'lax',
        expires: new Date(0)
    });
    res.status(200).json({ message: 'Logged out successfully' });
});

// @desc    Check auth status
// @route   GET /api/auth/status
// @access  Public (technically private but wrapper handles it)
router.get('/status', (req, res) => {
    const token = req.cookies.jwt;
    if (!token) {
        return res.json({ isAuthenticated: false });
    }
    try {
        jwt.verify(token, process.env.JWT_SECRET);
        res.json({ isAuthenticated: true });
    } catch (e) {
        res.json({ isAuthenticated: false });
    }
});

// @desc    Update admin profile
// @route   PUT /api/auth/profile
// @access  Private
router.put('/profile', protect, asyncHandler(async (req, res) => {
    const user = await User.findById(req.user.userId);

    if (user) {
        user.username = req.body.username || user.username;
        if (req.body.password) {
            user.password = req.body.password;
        }

        const updatedUser = await user.save();
        res.json({
            _id: updatedUser._id,
            username: updatedUser.username
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
}));

module.exports = router;
