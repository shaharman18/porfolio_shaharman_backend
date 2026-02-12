const express = require('express');
const router = express.Router();
const Project = require('../models/Project');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Get all projects
// @route   GET /api/projects
// @access  Public
router.get('/', asyncHandler(async (req, res) => {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
}));

// @desc    Add a project
// @route   POST /api/projects
// @access  Private/Admin
router.post('/', protect, asyncHandler(async (req, res) => {
    const project = await Project.create(req.body);
    res.status(201).json(project);
}));

// @desc    Update a project
// @route   PUT /api/projects/:id
// @access  Private/Admin
router.put('/:id', protect, asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        const updatedProject = await Project.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });
        res.json(updatedProject);
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
}));

// @desc    Delete a project
// @route   DELETE /api/projects/:id
// @access  Private/Admin
router.delete('/:id', protect, asyncHandler(async (req, res) => {
    const project = await Project.findById(req.params.id);

    if (project) {
        await project.deleteOne();
        res.json({ message: 'Project removed' });
    } else {
        res.status(404);
        throw new Error('Project not found');
    }
}));

module.exports = router;
