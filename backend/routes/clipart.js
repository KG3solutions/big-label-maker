import { Router } from 'express';
import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';
import { existsSync, unlinkSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const UPLOADS_PATH = join(__dirname, '..', 'uploads');

const router = Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOADS_PATH);
    },
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${file.originalname}`;
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/svg+xml', 'image/png', 'image/jpeg', 'image/gif', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error(`Invalid file type: ${file.mimetype}. Allowed: SVG, PNG, JPEG, GIF, WebP`), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// GET /api/clipart - List/search clipart
router.get('/', (req, res) => {
    try {
        const { search, tags, limit = 50, offset = 0 } = req.query;
        const db = getDb();

        let query = 'SELECT * FROM clipart WHERE 1=1';
        const params = {};

        if (search) {
            query += ' AND (name LIKE @search OR tags LIKE @search)';
            params.search = `%${search}%`;
        }

        if (tags) {
            const tagList = tags.split(',').map(t => t.trim());
            const tagConditions = tagList.map((_, i) => `tags LIKE @tag${i}`).join(' OR ');
            query += ` AND (${tagConditions})`;
            tagList.forEach((tag, i) => {
                params[`tag${i}`] = `%${tag}%`;
            });
        }

        query += ' ORDER BY created_at DESC LIMIT @limit OFFSET @offset';
        params.limit = parseInt(limit);
        params.offset = parseInt(offset);

        const stmt = db.prepare(query);
        const cliparts = stmt.all(params);

        // Get total count for pagination
        const countQuery = query.replace(/SELECT \*/, 'SELECT COUNT(*) as count').replace(/ORDER BY.*$/, '');
        const countParams = { ...params };
        delete countParams.limit;
        delete countParams.offset;
        const countStmt = db.prepare(countQuery);
        const { count } = countStmt.get(countParams);

        res.json({
            data: cliparts,
            pagination: {
                total: count,
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    } catch (error) {
        console.error('Error fetching clipart:', error);
        res.status(500).json({ error: 'Failed to fetch clipart' });
    }
});

// GET /api/clipart/:id - Get single clipart metadata
router.get('/:id', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM clipart WHERE id = ?');
        const clipart = stmt.get(req.params.id);

        if (!clipart) {
            return res.status(404).json({ error: 'Clipart not found' });
        }

        res.json(clipart);
    } catch (error) {
        console.error('Error fetching clipart:', error);
        res.status(500).json({ error: 'Failed to fetch clipart' });
    }
});

// GET /api/clipart/:id/file - Serve clipart file
router.get('/:id/file', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT filename, mime_type FROM clipart WHERE id = ?');
        const clipart = stmt.get(req.params.id);

        if (!clipart) {
            return res.status(404).json({ error: 'Clipart not found' });
        }

        const filePath = join(UPLOADS_PATH, clipart.filename);

        if (!existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }

        res.set('Content-Type', clipart.mime_type);
        res.sendFile(filePath);
    } catch (error) {
        console.error('Error serving clipart file:', error);
        res.status(500).json({ error: 'Failed to serve file' });
    }
});

// POST /api/clipart - Upload new clipart
router.post('/', upload.single('file'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const { name, tags = '' } = req.body;

        if (!name) {
            // Delete uploaded file if validation fails
            unlinkSync(req.file.path);
            return res.status(400).json({ error: 'Name is required' });
        }

        const id = uuidv4();
        const db = getDb();

        const stmt = db.prepare(`
            INSERT INTO clipart (id, name, filename, mime_type, tags, file_size)
            VALUES (@id, @name, @filename, @mime_type, @tags, @file_size)
        `);

        stmt.run({
            id,
            name,
            filename: req.file.filename,
            mime_type: req.file.mimetype,
            tags: tags.trim(),
            file_size: req.file.size
        });

        const newClipart = db.prepare('SELECT * FROM clipart WHERE id = ?').get(id);

        res.status(201).json(newClipart);
    } catch (error) {
        console.error('Error uploading clipart:', error);
        if (req.file) {
            try { unlinkSync(req.file.path); } catch {}
        }
        res.status(500).json({ error: 'Failed to upload clipart' });
    }
});

// PUT /api/clipart/:id - Update clipart metadata
router.put('/:id', (req, res) => {
    try {
        const { name, tags } = req.body;
        const db = getDb();

        const existing = db.prepare('SELECT * FROM clipart WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Clipart not found' });
        }

        const stmt = db.prepare(`
            UPDATE clipart
            SET name = @name, tags = @tags, updated_at = datetime('now')
            WHERE id = @id
        `);

        stmt.run({
            id: req.params.id,
            name: name || existing.name,
            tags: tags !== undefined ? tags : existing.tags
        });

        const updated = db.prepare('SELECT * FROM clipart WHERE id = ?').get(req.params.id);
        res.json(updated);
    } catch (error) {
        console.error('Error updating clipart:', error);
        res.status(500).json({ error: 'Failed to update clipart' });
    }
});

// DELETE /api/clipart/:id - Delete clipart
router.delete('/:id', (req, res) => {
    try {
        const db = getDb();

        const clipart = db.prepare('SELECT filename FROM clipart WHERE id = ?').get(req.params.id);

        if (!clipart) {
            return res.status(404).json({ error: 'Clipart not found' });
        }

        // Delete file
        const filePath = join(UPLOADS_PATH, clipart.filename);
        if (existsSync(filePath)) {
            unlinkSync(filePath);
        }

        // Delete database record
        db.prepare('DELETE FROM clipart WHERE id = ?').run(req.params.id);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting clipart:', error);
        res.status(500).json({ error: 'Failed to delete clipart' });
    }
});

export default router;
