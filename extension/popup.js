import {
  extractProblemTitle,
  extractProblemDescription,
  extractProblemTags,
  extractProblemDifficulty,
  extractProblemUrl
} from './utils.js';
import { getAllPages, addRow } from './notion.js';

// Run when the extension is loaded
// Global variable to store problem details
let globalProblemDetails = null;

document.addEventListener('DOMContentLoaded', async () => {
  // Check if we're on a LeetCode problem page
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;

  if (url.includes("leetcode.com/problems")) {
    try {
      globalProblemDetails = await extractProblemDetails();
      if (globalProblemDetails) {
        console.log('Problem details extracted:', globalProblemDetails);
        // Update the problem name input field with the extracted title
        document.getElementById('problem-name').value = globalProblemDetails.title || '';
      }
    } catch (err) {
      console.error('Failed to extract problem details:', err);
    }
  }
});


// Function to extract problem details
async function extractProblemDetails() {
  try {
    const [title, description, tags, difficulty, solutionUrl] = await Promise.all([
      extractProblemTitle(),
      extractProblemDescription(),
      extractProblemTags(),
      extractProblemDifficulty(),
      extractProblemUrl(),
    ]);
    // Validate required fields
    if (!title || !description || !solutionUrl|| !tags || !difficulty) {
      throw new Error('Failed to extract required problem details');
    }

    return {
      title: title || '',
      description: description || '',
      tags: tags || [],
      difficulty: difficulty || 'Medium', // Default to Medium if not found
      solutionUrl: solutionUrl || ''
    };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    throw error; // Propagate error to be handled by caller
  }
}

//after clicking save button
document.getElementById("send").addEventListener("click", async () => {
  try {
    const approach = document.getElementById("approach").value ;

    // Check if we're still on the same LeetCode problem
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const url = tab.url;

    let problemDetails;

    if (url.includes("leetcode.com/problems")) {
      if (globalProblemDetails) {
        // Use cached problem details if available
        problemDetails = globalProblemDetails;
      } else {
        // Extract problem details if not already cached
        problemDetails = await extractProblemDetails();
        if (!problemDetails) {
          console.error('Failed to extract problem details.');
          return;
        }
      }
    } else {
      console.log("❌ Not on a LeetCode problem page.", "error");
      return;
    }

    // Add the approach to the problem details
    problemDetails.approach = approach;

    try {
        // Check if problem already exists
        const allPages = await getAllPages();
        const alreadyExists = allPages.some(page => {
            const notionTitle = page.properties["Name"].title[0]?.text?.content;
            return notionTitle?.trim().toLowerCase() === problemDetails.title.trim().toLowerCase();
        });

        if (alreadyExists) {
            console.log("❌ Problem already exists in Notion database.", "error");
            return;
        }

        // Add the new problem to Notion
        const response = await addRow(
            database_id, 
            problemDetails.title, 
            problemDetails.description, 
            approach, 
            problemDetails.solutionUrl, 
            problemDetails.difficulty, 
            problemDetails.tags
        );

        if (response) {
            console.log("✅ Problem successfully added to Notion!", "success");
        } else {
            console.log("❌ Failed to add problem to Notion.", "error");
        }
    } catch (err) {
        console.error('Error interacting with Notion:', err);
        console.log("❌ Error interacting with Notion API.", "error");
    }

    if (response.ok) {
      console.log("✅ Problem details sent successfully!", "success");
    } else {
      console.log(data.error || "❌ Failed to send problem details.", "error");
    }
  } catch (err) {
    console.error('Error sending problem details:', err);
    console.log("❌ Network error while sending details.", "error");
  }
});
