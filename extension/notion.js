import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

async function getAllPages(databaseId) {
    try {
        if (!databaseId) {
            throw new Error('Database ID is required');
        }

        const response = await notion.databases.query({
            database_id: databaseId,
            page_size: 100,
        });

        if (!response || !response.results) {
            throw new Error('Invalid response from Notion API');
        }

        return response.results;
    } catch (error) {
        console.error('Error fetching pages from Notion:', error);
        throw error;
    }
}

async function addRow(databaseId, title, description, approach, solutionUrl, difficulty, tags) {
    try {
        if (!databaseId || !title || !description || !approach|| !solutionUrl || !difficulty || !tags) {
            throw new Error('Missing  parameters: are required');
        }

        // Validate and sanitize inputs
        const sanitizedTags = Array.isArray(tags) ? tags : [];
        const sanitizedDifficulty = ['Easy', 'Medium', 'Hard'].includes(difficulty) ? difficulty : 'Medium';

        const response = await notion.pages.create({
            parent: { database_id: databaseId },
            properties: {
                "Name": {
                    title: [
                        {
                            text: {
                                content: title.substring(0, 2000)
                            }
                        }
                    ]
                },
                "Problem": {
                    rich_text: [
                        {
                            text: {
                                content: description.substring(0, 2000)
                            }
                        }
                    ]
                },
                "Approach": {
                    rich_text: [
                        {
                            text: {
                                content: (approach || '').substring(0, 2000)
                            }
                        }
                    ]
                },
                "Solution": {
                    url: solutionUrl || ''
                },
                "Difficulty": {
                    select: { name: sanitizedDifficulty }
                },
                "Tags": {
                    multi_select: sanitizedTags.map(tag => ({ name: tag.substring(0, 100) }))
                },
                "Status": {
                    select: { name: "Synced" }
                }
            }
        });

        if (!response) {
            throw new Error('Failed to create page in Notion');
        }

        return response;
    } catch (error) {
        console.error('Error adding row to Notion:', error);
        throw error;
    }
}

export {getAllPages, addRow };