// Configuration
const serverUrl = `https://notionxleetcode.onrender.com`;
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


document.getElementById("sync").addEventListener("click", async () => {
  try {
    updateStatus("🔄 Syncing...", "info");
    
    const res = await fetch(`${serverUrl}/sync`, {
      method: 'POST'
    });
    
    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      updateStatus("❌ Invalid server response.", "error");
      return;
    }
    
    if (res.status === 429) {
      updateStatus("🚫 Rate limit exceeded. Try again later.", "warning");
    } else if (!res.ok) {
      updateStatus(data.error || "❌ Sync failed.", "error");
    } else {
      updateStatus(data.message || "✅ Sync completed!", "success");
    }
    
  } catch (err) {
    console.error('❌ Network error during sync:', err);
    updateStatus("❌ Failed to connect to server.", "error");
  }
});


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
        // You can use the details here, perhaps to populate fields or display info
      }
    } catch (err) {
      console.error('Failed to extract problem details:', err);
    }
  }
});

// Function to extract problem details
async function extractProblemDetails() {
  try {
    const [title, description, tags, difficulty, problemUrl] = await Promise.all([
      extractProblemTitle(),
      extractProblemDescription(),
      extractProblemTags(),
      extractProblemDifficulty(),
      extractProblemUrl(),
    ]);
    return { title, description, tags, difficulty, problemUrl };
  } catch (error) {
    console.error('Error extracting problem details:', error);
    return null;
  }
}
// Add listener for the send button
document.getElementById("send").addEventListener("click", async () => {
  try {
    updateStatus("🔄 Sending problem details...", "info");
    
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
async function extractProblemTitle() {
  // Execute script in the tab to get the problem title
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => document.querySelector('.mr-2.text-lg').textContent.trim()
  });
  return result[0].result;
}

async function extractProblemDescription() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => document.querySelector('[data-cy="question-title-content"]').nextElementSibling.innerHTML
  });
  return result[0].result;
}

async function extractProblemTags() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const tags = document.querySelectorAll('.topic-tag__1jni');
      return Array.from(tags).map(tag => tag.textContent.trim());
    }
  });
  return result[0].result;
}

async function extractProblemDifficulty() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const result = await chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => {
      const difficultyElement = document.querySelector('.mt-3 .text-xs');
      return difficultyElement ? difficultyElement.textContent.trim() : 'Unknown';
    }
  });
  return result[0].result;
}

async function extractProblemUrl() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab.url;
}