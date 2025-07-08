// Configuration
const serverUrl = process.env.DOMAIN || 'http://localhost:3000';

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

document.getElementById("send").addEventListener("click", async () => {
  const approach = document.getElementById("approach").value.trim();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url;
  const title = tab.title;

  if (!url.includes("leetcode.com/problems")) {
    updateStatus("❌ Not a LeetCode problem page.", "error");
    return;
  }

  if (!approach) {
    updateStatus("⚠️ Please enter your approach.", "warning");
    return;
  }

  const name = title;

  try {
    updateStatus("ℹ️ Adding problem...", "info");

    const res = await fetch(`${serverUrl}/add`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, approach })
    });

    let data;
    try {
      data = await res.json();
    } catch (jsonErr) {
      updateStatus("❌ Invalid server response.", "error");
      return;
    }

    // Handle different statuses
    switch (res.status) {
      case 201:
        updateStatus(data.message || "✅ Problem added!", "success");
        document.getElementById("approach").value = "";
        break;
      case 207:
        updateStatus("⚠️ Problem added, but sync failed.", "warning");
        break;
      case 400:
        updateStatus(data.error || "⚠️ Bad Request.", "warning");
        break;
      case 409:
        updateStatus(data.error || "⚠️ Problem already exists.", "warning");
        break;
      case 429:
        updateStatus("🚫 Rate limit exceeded. Try again later.", "warning");
        break;
      default:
        updateStatus(data.error || "❌ Unknown error occurred.", "error");
        break;
    }

  } catch (err) {
    console.error('❌ Network error:', err);
    updateStatus("❌ Failed to connect to server.", "error");
  }
});

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
