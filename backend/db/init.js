import Database from 'better-sqlite3';
import { readFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_PATH = join(__dirname, 'labels.db');
const SCHEMA_PATH = join(__dirname, 'schema.sql');
const UPLOADS_PATH = join(__dirname, '..', 'uploads');

// Ensure uploads directory exists
if (!existsSync(UPLOADS_PATH)) {
    mkdirSync(UPLOADS_PATH, { recursive: true });
}

// Initialize database
const db = new Database(DB_PATH);
db.pragma('journal_mode = WAL');

// Read and execute schema
const schema = readFileSync(SCHEMA_PATH, 'utf-8');
db.exec(schema);

console.log('Database initialized successfully at:', DB_PATH);

// Seed some example clipart entries (without actual files)
const seedData = [
    {
        id: 'seed-lightbulb',
        name: 'Light Bulb',
        filename: 'lightbulb.svg',
        mime_type: 'image/svg+xml',
        tags: 'idea,light,bulb,electricity,innovation',
        file_size: 1024
    },
    {
        id: 'seed-vote',
        name: 'Vote Badge',
        filename: 'vote.svg',
        mime_type: 'image/svg+xml',
        tags: 'vote,election,democracy,badge,political',
        file_size: 2048
    },
    {
        id: 'seed-star',
        name: 'Gold Star',
        filename: 'star.svg',
        mime_type: 'image/svg+xml',
        tags: 'star,award,gold,achievement,rating',
        file_size: 512
    }
];

const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO clipart (id, name, filename, mime_type, tags, file_size)
    VALUES (@id, @name, @filename, @mime_type, @tags, @file_size)
`);

for (const clipart of seedData) {
    insertStmt.run(clipart);
}

console.log('Seed data inserted');

// Create sample SVG files for seeds
const sampleSvgs = {
    'lightbulb.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none" stroke="currentColor" stroke-width="2">
  <path d="M32 8C22 8 14 16 14 26c0 6 3 11 8 14v6c0 2 2 4 4 4h12c2 0 4-2 4-4v-6c5-3 8-8 8-14 0-10-8-18-18-18z"/>
  <line x1="24" y1="56" x2="40" y2="56"/>
  <line x1="26" y1="60" x2="38" y2="60"/>
  <circle cx="32" cy="26" r="6" fill="gold" stroke="none"/>
</svg>`,
    'vote.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <circle cx="32" cy="32" r="28" fill="#1e40af" stroke="#1e3a8a" stroke-width="2"/>
  <text x="32" y="38" text-anchor="middle" fill="white" font-size="16" font-weight="bold">VOTE</text>
  <path d="M20 44 L28 52 L44 28" stroke="white" stroke-width="3" fill="none"/>
</svg>`,
    'star.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <polygon points="32,4 40,24 62,26 46,42 50,62 32,52 14,62 18,42 2,26 24,24" fill="gold" stroke="#d4a00a" stroke-width="2"/>
</svg>`
};

import { writeFileSync } from 'fs';
for (const [filename, content] of Object.entries(sampleSvgs)) {
    writeFileSync(join(UPLOADS_PATH, filename), content);
}

console.log('Sample SVG files created');

db.close();
console.log('Database setup complete!');
