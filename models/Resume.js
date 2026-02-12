const mongoose = require('mongoose');

const resumeSchema = new mongoose.Schema({
    fileName: { type: String, required: true },
    url: { type: String, required: true },
    contentType: { type: String, required: true },
    // Optional: keeping data as a backup or removing it if you prefer purely disk
    data: { type: Buffer }
}, { timestamps: true });

const Resume = mongoose.model('Resume', resumeSchema);
module.exports = Resume;
