// Global flag to prevent multiple triggers
let lastShownSubmission = null;

// More precise detection - only trigger on NEW acceptance
function checkForNewAcceptance() {
  // Look for the submission result panel
  const resultPanel = document.querySelector('[data-e2e-locator="submission-result"]');
  
  if (!resultPanel) return false;
  
  // Check if it says "Accepted"
  const isAccepted = resultPanel.textContent.includes('Accepted');
  
  if (!isAccepted) return false;
  
  // Get a unique identifier for this submission
  const submissionDetails = resultPanel.textContent;
  const submissionHash = submissionDetails.substring(0, 100); // Use first 100 chars as identifier
  
  // Only trigger if this is a NEW acceptance (different from last one we showed)
  if (submissionHash !== lastShownSubmission) {
    lastShownSubmission = submissionHash;
    return true;
  }
  
  return false;
}

// Show the GTA overlay
function showMissionPassed() {
  console.log('🎮 MISSION PASSED TRIGGERED!');
  
  // Remove any existing overlay first
  const existingOverlay = document.getElementById('gta-mission-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create iframe overlay
  const overlay = document.createElement('iframe');
  overlay.id = 'gta-mission-overlay';
  overlay.src = chrome.runtime.getURL('overlay.html');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    border: none;
    z-index: 999999;
    pointer-events: none;
    background: transparent;
  `;
  
  document.body.appendChild(overlay);
  
  // Fade out and remove overlay after 3.5 seconds
  setTimeout(() => {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.5s ease-out';
    
    setTimeout(() => {
      overlay.remove();
      console.log('🎮 Overlay removed');
    }, 500);
  }, 3500);
}

// Use MutationObserver with debouncing
let debounceTimer = null;
let lastCheckTime = 0;

const observer = new MutationObserver((mutations) => {
  // Throttle: don't check more than once per second
  const now = Date.now();
  if (now - lastCheckTime < 1000) {
    return;
  }
  
  // Clear previous timer
  if (debounceTimer) {
    clearTimeout(debounceTimer);
  }
  
  // Wait 500ms before checking (debounce)
  debounceTimer = setTimeout(() => {
    lastCheckTime = Date.now();
    if (checkForNewAcceptance()) {
      showMissionPassed();
    }
  }, 500);
});

// Start observing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    observer.observe(document.body, { childList: true, subtree: true });
  });
} else {
  observer.observe(document.body, { childList: true, subtree: true });
}

// Listen for page navigation (LeetCode is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    lastShownSubmission = null; // Reset on new problem
  }
}).observe(document, { subtree: true, childList: true });
