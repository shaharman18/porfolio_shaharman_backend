const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Resume = require('../models/Resume');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

const uploadDir = 'uploads/';

// Ensure directory exists
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configure Multer for disk storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        // We use a timestamped name OR a fixed name. 
        // User wants "previous should be delete", so timestamped is better for cache busting, 
        // then we manually delete old ones.
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'resume-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: function (req, file, cb) {
        if (path.extname(file.originalname).toLowerCase() !== '.pdf') {
            return cb(new Error('Only PDFs are allowed'));
        }
        cb(null, true);
    }
});

// @route   GET /api/resume
router.get('/', asyncHandler(async (req, res) => {
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    if (!resume) return res.json(null);
    res.json(resume);
}));

// Route to view the resume (can now point directly to static /uploads or through this)
router.get('/view', asyncHandler(async (req, res) => {
    const resume = await Resume.findOne().sort({ createdAt: -1 });
    if (!resume) {
        res.status(404);
        throw new Error('Resume not found');
    }
    // Redirect to the actual static file
    res.redirect(resume.url);
}));

// @route   POST /api/resume/upload
router.post('/upload', protect, upload.single('resume'), asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('No file uploaded');
    }

    // 1. CLEANUP FOLDER: Delete all other files in /uploads to keep it fresh
    const files = fs.readdirSync(uploadDir);
    for (const file of files) {
        // Only delete file if it's NOT the one we just uploaded
        if (file !== req.file.filename) {
            const filePath = path.join(uploadDir, file);
            if (fs.lstatSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        }
    }

    const url = `/uploads/${req.file.filename}`;

    // 2. UPDATE DATABASE
    let resume = await Resume.findOne();

    if (resume) {
        resume.fileName = req.file.originalname;
        resume.url = url;
        // Clear buffer data if it exists from previous version
        resume.data = undefined;
        resume.contentType = req.file.mimetype;
        await resume.save();
    } else {
        resume = await Resume.create({
            fileName: req.file.originalname,
            url,
            contentType: req.file.mimetype,
            // We set data to something minimal or remove it from schema later
            data: Buffer.from([])
        });
    }

    res.status(201).json({
        message: 'Resume uploaded and folder cleaned successfully',
        fileName: resume.fileName,
        url: resume.url
    });
}));

module.exports = router;
