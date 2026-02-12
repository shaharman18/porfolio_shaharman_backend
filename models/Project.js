const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
    title: { type: String, required: true },
    category: { type: String, required: true },
    problem: { type: String, required: true },
    solution: { type: String, required: true },
    tech: [{ type: String, required: true }],
    github: { type: String },
    demo: { type: String },
    features: [{ type: String }],
    featured: { type: Boolean, default: false },
    image: { type: String }
}, { timestamps: true });

const Project = mongoose.model('Project', projectSchema);
module.exports = Project;
