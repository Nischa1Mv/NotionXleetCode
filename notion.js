import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

async function getAllPages(databaseId) {
    const response = await notion.databases.query({
        database_id: databaseId,
        page_size: 100,
    });
    return response.results;
}

async function addRow(databaseId, title, description, approach, solutionUrl, difficulty, tags) {
    const response = await notion.pages.create({
        parent: { database_id: databaseId },
        properties: {
            "Name": {
                title: [
                    {
                        text: {
                            content: title
                        }
                    }
                ]
            },
            "Problem": {
                rich_text: [
                    {
                        text: {
                            content: description
                        }
                    }
                ]
            },
            "Approach": {
                rich_text: [
                    {
                        text: {
                            content: approach
                        }
                    }
                ]
            },
            "Solution": {
                url: solutionUrl
            },
            "Difficulty": {
                select: { name: difficulty }
            },
            "Tags": {
                multi_select: tags.map(tag => ({ name: tag }))
            },
            "Status": {
                select: { name: "Synced" }
            }
        }
    });
    return response;
}

export { getAllPages, addRow };