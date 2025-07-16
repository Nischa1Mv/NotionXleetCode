import express from 'express';
import dotenv from 'dotenv';
import getProblemDetails from './leetcode.js';
import { addName, getPendingPages, updatePendingPages, getAllPages, addRow } from './notion.js';
import { toSlug } from './utils.js';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const database_id = process.env.NOTION_DATABASE_ID;
const DOMAIN = process.env.DOMAIN || `http://localhost:${PORT}`;

if (!database_id) {
    console.error('❌ NOTION_DATABASE_ID is missing in .env');
    process.exit(1);
}

app.use(express.json());
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.send('✅ Notion-LeetCode Sync Server Running');
});

app.post('/add', async (req, res) => {
    const { name, approach } = req.body;
    if (!name || !approach) {
        return res.status(400).json({ error: 'Name and approach are required.' });
    }

    try {
        const duplicateCheck = await getAllPages(database_id);

        const alreadyExists = duplicateCheck.some(page => {
            const notionTitle = page.properties["Name"].title[0]?.text?.content;
            return notionTitle?.trim().toLowerCase() === name.trim().toLowerCase();
        });

        if (alreadyExists) {
            console.log(`ℹ️ Problem already exists: ${name}`);
            return res.status(400).json({ error: 'Problem already exists in the database.' });
        }

        const newRow = await addName(database_id, name, approach);
        if (!newRow) {
            return res.status(500).json({ error: 'Failed to create new page.' });
        }

        try {
            await syncNow();
        } catch (syncError) {
            console.error(`⚠️ Sync failed after adding ${name}:`, syncError);
            return res.status(207).json({  // 207 = Multi-Status (partially succeeded)
                message: 'Problem added but sync failed.',
                pageId: newRow.id,
                syncError: syncError.message || 'Unknown sync error',
            });
        }

        console.log(`✅ Added and synced: ${name}`);
        res.status(201).json({ message: 'Problem added and synced successfully.', pageId: newRow.id });

    } catch (err) {
        console.error('❌ Error adding problem:', err);
        if (err.message.includes('429')) {
            return res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
        }
        res.status(500).json({ error: 'Failed to add problem.' });
    }
});


async function syncNow() {
    const pendingProblems = await getPendingPages(database_id);
    if (pendingProblems.length === 0) return;

    for (const problem of pendingProblems) {
        const titleObj = problem.properties["Name"].title[0];
        if (!titleObj) continue;

        const title = titleObj.text.content;
        const titleSlug = toSlug(title);
        try {
            const details = await getProblemDetails(titleSlug);
            if (!details) continue;

            const properties = {
                questionId: details.questionId,
                titleSlug: details.titleSlug,
                question: details.question,
                link: details.link,
                difficulty: details.difficulty,
                topicTags: details.topicTags
            };

            await updatePendingPages(problem.id, properties);
            console.log(`✅ Updated: ${titleSlug}`);
        } catch (err) {
            console.warn('⚠️ Failed to update for:', titleSlug, err.message);
        }
    }
}



app.post('/sync', async (req, res) => {
    try {
        const pendingProblems = await getPendingPages(database_id);
        if (pendingProblems.length === 0) {
            return res.status(200).json({ message: 'No pending problems to sync.' });
        }

        for (const problem of pendingProblems) {
            const titleObj = problem.properties["Name"].title[0];
            if (!titleObj) {
                console.warn('⚠️ Missing title in problem:', problem.id);
                continue;
            }

            const title = titleObj.text.content;
            const titleSlug = toSlug(title);
            try {
                const details = await getProblemDetails(titleSlug);
                if (!details) {
                    console.warn('⚠️ No details for:', titleSlug);
                    continue;
                }

                const properties = {
                    questionId: details.questionId,
                    titleSlug: details.titleSlug,
                    question: details.question,
                    link: details.link,
                    difficulty: details.difficulty,
                    topicTags: details.topicTags
                };

                await updatePendingPages(problem.id, properties);
                console.log(`✅ Updated: ${titleSlug}`);
            } catch (err) {
                if (err.message.includes('429')) {
                    res.status(429).json({ error: 'Rate limit exceeded. Please try again later.' });
                    return;
                }
                console.warn('⚠️ Failed to update for:', titleSlug, err.message);
                continue;
            }
        }

        res.status(200).json({ message: '✅ Sync completed successfully.' });
    } catch (err) {
        console.error('❌ Sync failed:', err);
        res.status(500).json({ error: 'Sync failed' });
    }
});

app.get('/problem/:slug', async (req, res) => {
    const slug = req.params.slug;
    try {
        const data = await getProblemDetails(slug);
        res.status(200).json(data);
    } catch (err) {
        if (err.message.includes('429')) {
            res.status(429).json({ error: `⚠️ Rate limit exceeded. Retry after a while.` });
        }
        else {
            res.status(500).json({ error: `Failed to fetch problem details for ${slug}: ${err.message}` });
        }
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on ${DOMAIN}`);
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
