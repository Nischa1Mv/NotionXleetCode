import {
  extractProblemTitle,
  extractProblemDescription,
  extractProblemTags,
  extractProblemDifficulty,
  extractProblemUrl
} from './utils.js';
import { BACKENDURL,DOMAIN } from './config.example.js';
const serverUrl = BACKENDURL || DOMAIN;
// Helper function to update status with proper styling
function updateStatus(message, type = 'info') {
  const statusEl = document.getElementById("status");
  const iconMap = {
    error: '❌',
    success: '✅',
    warning: '⚠️',
    info: 'ℹ️'
  };

  statusEl.innerHTML = `${iconMap[type] || ''} ${message}`;
  statusEl.className = `status-${type}`;
}


// document.getElementById("sync").addEventListener("click", async () => {
//   try {
//     updateStatus("🔄 Syncing...", "info");

//     const res = await fetch(`${serverUrl}/sync`, {
//       method: 'POST'
//     });

//     let data;
//     try {
//       data = await res.json();
//     } catch (jsonErr) {
//       updateStatus("❌ Invalid server response.", "error");
//       return;
//     }

//     if (res.status === 429) {
//       updateStatus("🚫 Rate limit exceeded. Try again later.", "warning");
//     } else if (!res.ok) {
//       updateStatus(data.error || "❌ Sync failed.", "error");
//     } else {
//       updateStatus(data.message || "✅ Sync completed!", "success");
//     }

//   } catch (err) {
//     console.error('❌ Network error during sync:', err);
//     updateStatus("❌ Failed to connect to server.", "error");
//   }
// });


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
    return { title, description, tags, difficulty, solutionUrl ,approach };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    return null;
  }
}
// Add listener for the send button
document.getElementById("send").addEventListener("click", async () => {
  try {
    updateStatus("🔄 Sending problem details...", "info");
    const approach = document.getElementById("approach").value ;

    // Extract problem details
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
          updateStatus("❌ Failed to extract problem details.", "error");
          return;
        }
      }
    } else {
      updateStatus("❌ Not on a LeetCode problem page.", "error");
      return;
    }
    // Add the approach to the problem details
    problemDetails.approach = approach;

    // Send the details to your API
    const response = await fetch(`${serverUrl}/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(problemDetails)
    });

    const data = await response.json();

    if (response.ok) {
      updateStatus("✅ Problem details sent successfully!", "success");
    } else {
      updateStatus(data.error || "❌ Failed to send problem details.", "error");
    }
  } catch (err) {
    console.error('Error sending problem details:', err);
    updateStatus("❌ Network error while sending details.", "error");
  }
});

// Helper functions to extract problem details (implement these based on LeetCode's DOM structure)