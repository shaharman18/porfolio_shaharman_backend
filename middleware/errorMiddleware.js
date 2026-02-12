const errorHandler = (err, req, res, next) => {
    // Log error for debugging in Render/Vercel logs
    console.error('--- SERVER ERROR ---');
    console.error(`Path: ${req.path}`);
    console.error(`Message: ${err.message}`);
    if (process.env.NODE_ENV !== 'production') {
        console.error(err.stack);
    }
    console.error('--------------------');

    const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

    // Ensure CORS headers are present on error response
    const origin = req.headers.origin;
    if (origin) {
        res.setHeader('Access-Control-Allow-Origin', origin);
        res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    res.status(statusCode).json({
        message: err.message,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

module.exports = errorHandler;
