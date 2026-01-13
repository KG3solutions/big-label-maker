import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/database.js';

const router = Router();

// GET /api/designs - List saved designs
router.get('/', (req, res) => {
    try {
        const { search, limit = 20, offset = 0 } = req.query;
        const db = getDb();

        let query = 'SELECT id, name, thumbnail, created_at, updated_at FROM label_designs WHERE 1=1';
        const params = {};

        if (search) {
            query += ' AND name LIKE @search';
            params.search = `%${search}%`;
        }

        query += ' ORDER BY updated_at DESC LIMIT @limit OFFSET @offset';
        params.limit = parseInt(limit);
        params.offset = parseInt(offset);

        const stmt = db.prepare(query);
        const designs = stmt.all(params);

        res.json({ data: designs });
    } catch (error) {
        console.error('Error fetching designs:', error);
        res.status(500).json({ error: 'Failed to fetch designs' });
    }
});

// GET /api/designs/:id - Get single design with full data
router.get('/:id', (req, res) => {
    try {
        const db = getDb();
        const stmt = db.prepare('SELECT * FROM label_designs WHERE id = ?');
        const design = stmt.get(req.params.id);

        if (!design) {
            return res.status(404).json({ error: 'Design not found' });
        }

        // Parse the design_data JSON
        design.design_data = JSON.parse(design.design_data);

        res.json(design);
    } catch (error) {
        console.error('Error fetching design:', error);
        res.status(500).json({ error: 'Failed to fetch design' });
    }
});

// POST /api/designs - Save new design
router.post('/', (req, res) => {
    try {
        const { name, design_data, thumbnail } = req.body;

        if (!name) {
            return res.status(400).json({ error: 'Name is required' });
        }

        if (!design_data) {
            return res.status(400).json({ error: 'Design data is required' });
        }

        const id = uuidv4();
        const db = getDb();

        const stmt = db.prepare(`
            INSERT INTO label_designs (id, name, design_data, thumbnail)
            VALUES (@id, @name, @design_data, @thumbnail)
        `);

        stmt.run({
            id,
            name,
            design_data: JSON.stringify(design_data),
            thumbnail: thumbnail || null
        });

        const newDesign = db.prepare('SELECT * FROM label_designs WHERE id = ?').get(id);
        newDesign.design_data = JSON.parse(newDesign.design_data);

        res.status(201).json(newDesign);
    } catch (error) {
        console.error('Error saving design:', error);
        res.status(500).json({ error: 'Failed to save design' });
    }
});

// PUT /api/designs/:id - Update existing design
router.put('/:id', (req, res) => {
    try {
        const { name, design_data, thumbnail } = req.body;
        const db = getDb();

        const existing = db.prepare('SELECT * FROM label_designs WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Design not found' });
        }

        const stmt = db.prepare(`
            UPDATE label_designs
            SET name = @name, design_data = @design_data, thumbnail = @thumbnail, updated_at = datetime('now')
            WHERE id = @id
        `);

        stmt.run({
            id: req.params.id,
            name: name || existing.name,
            design_data: design_data ? JSON.stringify(design_data) : existing.design_data,
            thumbnail: thumbnail !== undefined ? thumbnail : existing.thumbnail
        });

        const updated = db.prepare('SELECT * FROM label_designs WHERE id = ?').get(req.params.id);
        updated.design_data = JSON.parse(updated.design_data);

        res.json(updated);
    } catch (error) {
        console.error('Error updating design:', error);
        res.status(500).json({ error: 'Failed to update design' });
    }
});

// DELETE /api/designs/:id - Delete design
router.delete('/:id', (req, res) => {
    try {
        const db = getDb();

        const existing = db.prepare('SELECT id FROM label_designs WHERE id = ?').get(req.params.id);
        if (!existing) {
            return res.status(404).json({ error: 'Design not found' });
        }

        db.prepare('DELETE FROM label_designs WHERE id = ?').run(req.params.id);

        res.status(204).send();
    } catch (error) {
        console.error('Error deleting design:', error);
        res.status(500).json({ error: 'Failed to delete design' });
    }
});

export default router;
