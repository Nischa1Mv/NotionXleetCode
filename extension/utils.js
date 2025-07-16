async function extractProblemTitle() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        // Look for the title link that matches the pattern shown in the example
        const titleElement = document.querySelector('a[href^="/problems/"]');
        if (!titleElement) return null;
        
        // Return the text content which should be something like "3201. Find the Maximum Length of Valid Subsequence I"
        return titleElement.textContent.trim();
      }
    });
    
    return results[0].result;
  } catch (error) {
    console.error('Error extracting problem title:', error);
    return null;
  }
}

async function extractProblemDescription() {
  try {
    // Execute script in the active tab to get the description
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      function: () => {
        const descriptionDiv = document.querySelector('div[data-track-load="description_content"]');
        if (!descriptionDiv) return null;
        
        let content = '';
        for (const child of descriptionDiv.children) {
          // Stop if we find a paragraph with &nbsp;
          if (child.tagName === 'P' && child.innerHTML.includes('&nbsp;')) {
            break;
          }
          content += child.outerHTML;
        }
        return content;
      }
    });
    
    return results[0].result;
  } catch (error) {
    console.error('Error extracting problem description:', error);
    return null;
  }
}
async function extractProblemTags() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Find all tag links that match the pattern /tag/...
                const tagElements = document.querySelectorAll('a[href^="/tag/"]');
                if (!tagElements || tagElements.length === 0) return [];
                
                // Extract the tag names and return as an array
                const tags = Array.from(tagElements).map(tag => {
                    return {
                        name: tag.textContent.trim(),
                        href: tag.getAttribute('href')
                    };
                });
                
                return tags;
            }
        });
        
        return results[0].result;
    } catch (error) {
        console.error('Error extracting problem tags:', error);
        return [];
    }
}
async function extractProblemDifficulty() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const results = await chrome.scripting.executeScript({
            target: { tabId: tab.id },
            function: () => {
                // Find the difficulty element by looking for text-difficulty-* classes
                const difficultyEl = document.querySelector('[class*="text-difficulty-"]');
                if (!difficultyEl) return null;
                
                // Extract the difficulty text
                return difficultyEl.textContent.trim();
            }
        });
        
        return results[0].result;
    } catch (error) {
        console.error('Error extracting problem difficulty:', error);
        return null;
    }
}
async function extractProblemUrl() {
    try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        
        // Get the current tab's URL
        let url = tab.url;
        
        // If the URL contains /description/, replace it with /submissions/
        if (url.includes('/description/')) {
            url = url.replace('/description/', '/submissions/');
        } else {
            // If it doesn't end with /submissions/, add it
            if (!url.endsWith('/submissions/')) {
                // Remove trailing slash if present
                url = url.endsWith('/') ? url.slice(0, -1) : url;
                // Add /submissions/
                url = `${url}/submissions/`;
            }
        }
        
        return url;
    } catch (error) {
        console.error('Error extracting problem URL:', error);
        return null;
    }
}