import express from 'express';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import clipartRoutes from './routes/clipart.js';
import designsRoutes from './routes/designs.js';
import { closeDb } from './db/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
    next();
});

// API Routes
app.use('/api/clipart', clipartRoutes);
app.use('/api/designs', designsRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Serve static files from uploads directory
app.use('/uploads', express.static(join(__dirname, 'uploads')));

// Serve frontend build in production
const frontendPath = join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendPath));
app.get('*', (req, res) => {
    res.sendFile(join(frontendPath, 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);

    if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ error: 'File too large. Maximum size is 5MB.' });
    }

    if (err.message && err.message.includes('Invalid file type')) {
        return res.status(400).json({ error: err.message });
    }

    res.status(500).json({ error: 'Internal server error' });
});

// Start server
const server = app.listen(PORT, () => {
    console.log(`Big Label Maker API running on http://localhost:${PORT}`);
    console.log(`API endpoints:`);
    console.log(`  GET    /api/health`);
    console.log(`  GET    /api/clipart`);
    console.log(`  POST   /api/clipart`);
    console.log(`  GET    /api/clipart/:id`);
    console.log(`  GET    /api/clipart/:id/file`);
    console.log(`  PUT    /api/clipart/:id`);
    console.log(`  DELETE /api/clipart/:id`);
    console.log(`  GET    /api/designs`);
    console.log(`  POST   /api/designs`);
    console.log(`  GET    /api/designs/:id`);
    console.log(`  PUT    /api/designs/:id`);
    console.log(`  DELETE /api/designs/:id`);
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\nShutting down...');
    closeDb();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

process.on('SIGTERM', () => {
    console.log('\nShutting down...');
    closeDb();
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});
