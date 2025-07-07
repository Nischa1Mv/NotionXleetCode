import { Client } from "@notionhq/client";
import dotenv from "dotenv";
dotenv.config();

const notion = new Client({
    auth: process.env.NOTION_TOKEN
});

async function getPendingPages(databaseId) {
    const response = await notion.databases.query({
        database_id: databaseId,
        filter: {
            property: "Status",
            select: {
                equals: "Pending"
            }
        }
    });

    return response.results;
}

//   return {
//                 questionId: problem.questionId,
//                 titleSlug: problem.titleSlug,
//                 question: problem.question,
//                 link: problem.link,
//                 difficulty: problem.difficulty,
//                 topicTags: problem.topicTags,
//             };

async function updatePendingPages(pageId, properties) {
    await notion.pages.update({
        page_id: pageId,
        properties: {
            "Name": {
                title: [
                    {
                        text: {
                            content: `${properties.questionId}. ${properties.titleSlug
                                .split("-")
                                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                                .join(" ")}`
                        }
                    }
                ]
            },
            "Problem": {
                rich_text: [
                    {
                        text: {
                            content: properties.question
                        }
                    }
                ]
            },
            "Solution": {
                url: properties.link
            },
            "Difficulty": {
                select: {
                    name: properties.difficulty
                }
            },
            Tags: {
                multi_select: properties.topicTags.map(tag => ({ name: tag }))
            },

            "Status": {
                select: { name: "Synced" }
            }
        }
    });


}
export { updatePendingPages, getPendingPages };