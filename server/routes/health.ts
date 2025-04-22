import express from 'express';

const router = express.Router();

/**
 * Health check endpoint
 * Responde imediatamente com 200 OK
 */
router.get('/', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

export default router; 