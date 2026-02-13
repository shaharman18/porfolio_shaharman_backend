const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// Use memory storage so the file buffer is available for storing in MongoDB
// This is critical for Render/Heroku where the filesystem is ephemeral
const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
            return cb(new Error('Only PDFs are allowed'));
        }
        cb(null, true);
    }
});

// @route   GET /api/resume
// Returns resume metadata (without the binary data)
router.get('/', asyncHandler(async (req, res) => {
    const resume = await Resume.findOne().sort({ createdAt: -1 }).select('-data');
    if (!resume) return res.json(null);
    res.json(resume);
}));

// @route   GET /api/resume/view
// Serves the PDF directly from MongoDB buffer
router.get('/view', asyncHandler(async (req, res) => {
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    if (!resume || !resume.data) {
        res.status(404);
        throw new Error('Resume not found');
    }

    res.set({
        'Content-Type': resume.contentType || 'application/pdf',
        'Content-Disposition': `inline; filename="${resume.fileName}"`,
        'Content-Length': resume.data.length,
        'Cache-Control': 'public, max-age=3600'
    });
    res.send(resume.data);
}));

// @route   POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // Store the PDF data directly in MongoDB (survives Render restarts)
    let resume = await Resume.findOne();

    if (resume) {
        resume.fileName = req.file.originalname;
        resume.url = '/api/resume/view';
        resume.data = req.file.buffer;
        resume.contentType = req.file.mimetype;
        await resume.save();
    } else {
        resume = await Resume.create({
            fileName: req.file.originalname,
            url: '/api/resume/view',
            contentType: req.file.mimetype,
            data: req.file.buffer
        });
    }

    res.status(201).json({
        message: 'Resume uploaded successfully',
        fileName: resume.fileName,
        url: resume.url
    });
}));

module.exports = router;
