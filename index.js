import express from 'express';
import dotenv from 'dotenv';
import getProblemDetails from './leetcode.js';
import { getPendingPages, updatePendingPages } from './notion.js';
import {toSlug} from './utils.js';

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

app.get('/', (req, res) => {
    res.send('✅ Notion-LeetCode Sync Server Running');
});

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
