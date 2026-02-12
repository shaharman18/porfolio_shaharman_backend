const express = require('express');
const router = express.Router();
const { Resend } = require('resend');
const asyncHandler = require('../middleware/asyncHandler');

const resend = new Resend(process.env.RESEND_API_KEY);

router.post('/', asyncHandler(async (req, res) => {
    const { name, email, subject, message } = req.body;

    if (!name || !email || !subject || !message) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        console.log(`Attempting to send email via Resend from ${name}...`);

        const { data, error } = await resend.emails.send({
            from: 'Portfolio <onboarding@resend.dev>',
            to: process.env.EMAIL_USER || 'shaharman604@gmail.com', // Your verified email
            reply_to: email,
            subject: `Portfolio Contact: ${subject}`,
            html: `
                <h3>New Contact Message</h3>
                <p><strong>Name:</strong> ${name}</p>
                <p><strong>Email:</strong> ${email}</p>
                <p><strong>Message:</strong></p>
                <p>${message}</p>
            `,
        });

        if (error) {
            console.error('❌ Resend Error:', error);
            return res.status(500).json({ message: 'Resend failed to send email', error: error.message });
        }

        console.log('✅ Email sent successfully via Resend:', data.id);
        res.json({ message: 'Message sent successfully!' });
    } catch (error) {
        console.error('❌ Unexpected Error:', error.message);
        res.status(500).json({
            message: 'Failed to send email. Check server logs.',
            error: error.message
        });
    }
}));

module.exports = router;
