const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');
const asyncHandler = require('../middleware/asyncHandler');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
    tls: { rejectUnauthorized: false },
    connectionTimeout: 30000,
    greetingTimeout: 30000,
});

// Verify connection configuration
transporter.verify(function (error, success) {
    if (error) {
        console.error('❌ Nodemailer Verification Error:', error.message);
    } else {
        console.log('✅ Email Server is ready to take messages');
    }
});

router.post('/', asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    const mailOptions = {
        from: `"Portfolio Contact" <${process.env.EMAIL_USER}>`,
        replyTo: email,
        to: process.env.EMAIL_USER,
        subject: `Portfolio Contact: ${subject}`,
        html: `
            <h3>New Contact Message</h3>
            <p><strong>Name:</strong> ${name}</p>
            <p><strong>Email:</strong> ${email}</p>
            <p><strong>Message:</strong></p>
            <p>${message}</p>
        `,
    };

    try {
        console.log(`Attempting to send email from ${email}...`);
        await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully');
        res.json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('❌ Nodemailer Error:', error.message);
        res.status(500).json({
            message: 'Failed to send email. Check server logs.',
            error: error.message
        });
    }
}));

module.exports = router;
