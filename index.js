import express from 'express';
import dotenv from 'dotenv';
import { getAllPages, addRow } from './extension/notion.js';
import cors from 'cors';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const database_id = process.env.NOTION_DATABASE_ID;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
    methods: ['GET', 'POST'],
    allowedHeaders: ['Content-Type'],
}));

if (!database_id) {
    console.error('❌ NOTION_DATABASE_ID is missing in .env');
    process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('✅ Notion-LeetCode Sync Server Running');
});




app.post('/save', async (req, res) => {
    const { title, description, approach, solutionUrl, difficulty, tags } = req.body;
    if (!title || !description || !approach || !solutionUrl || !difficulty || !tags) {
        return res.status(400).json({ error: 'All fields are required.' });
    }
    try {
        const allPages = await getAllPages(database_id);
        const alreadyExists = allPages.some(page => {
            const notionTitle = page.properties["Name"].title[0]?.text?.content;
            return notionTitle?.trim().toLowerCase() === title.trim().toLowerCase();
        }
    );
    if (alreadyExists) {
        return res.status(400).json({ error: 'Problem already exists in the database.' });
    }
    const newRow = await addRow(database_id, title, description, approach, solutionUrl, difficulty, tags);
    res.status(201).json({ message: 'Problem saved successfully.', pageId: newRow.id });
    
}
catch (err) {
    console.error('❌ Error saving problem:', err);
    if (err.message.includes('429')) {
        return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
    }
    res.status(500).json({ error: 'Failed to save problem.' });
}
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on ${DOMAIN}`);
});
