# NotionXLeetCode

## Overview
I often use the **Feynman Method** (named after physicist Richard Feynman) to track my LeetCode progress. This learning technique involves thoroughly documenting problems to reinforce understanding and ensure knowledge retention.

### Current Process
Each time I solve a problem, I need to record various details:
- Problem description
- Difficulty level (Easy, Medium, Hard)
- Related topics and algorithms
- My solution approach and implementation
- Key insights and learning points

This manual documentation process becomes time-consuming, which is why I created this extension to automate it. The extension extracts question details from LeetCode and seamlessly integrates them into a Notion database using the Notion API.

### Notion Template
You can find the Notion template I use for this project [here](https://sleet-quality-d08.notion.site/201dc128dd6580219324cc7ea77d4ccc?v=201dc128dd6580a19f13000c29133845&source=copy_link). Feel free to duplicate it for your own use.

### Features
- One-click problem documentation
- Automatic extraction of problem metadata
- Direct integration with Notion

## Setup Instructions

### 1. Prepare Notion
- Duplicate the [Notion Template](https://sleet-quality-d08.notion.site/201dc128dd6580219324cc7ea77d4ccc?v=201dc128dd6580a19f13000c29133845&source=copy_link)
- Create a new integration in [Notion's integrations dashboard](https://www.notion.com/my-integrations)

### 2. Configure API Access
- Create a Notion integration:
    1. Go to [Notion's integrations page](https://www.notion.com/my-integrations)
    2. Click "New integration" and follow the prompts
    3. Copy your API secret key
- Add your API secret as `NOTION_TOKEN` in your `.env` file (see `.env.example` for reference)
- Grant the integration access to your database:
    1. Open your Notion database page
    2. Click the `...` (More) menu in the top-right corner
    3. Select `+ Add Connections`
    4. Search for and add your integration
    5. Confirm access permissions

### 3. Set Database ID
- Locate your database ID from the URL:
    ```
    https://www.notion.so/abc123def4567890abc123def4567890?v=def456abc1237890def456abc1237890
    ```
    ↑ Database ID is everything before `?v=`
- Add this ID as `NOTION_DATABASE_ID` in your `.env` file

### 4. Deploy the Backend
- Deploy the backend service to a platform like Render, Heroku, Vercel, or similar

### 5. Configure the Extension
- Copy `config.example.js` to `config.js` in the extension directory
- Update the backend URL in your config file:
    ```javascript
    // config.js
    export const BACKEND_URL = 'https://your-deployed-backend-url.com';
    ```

*Making learning visible, one problem at a time.*
