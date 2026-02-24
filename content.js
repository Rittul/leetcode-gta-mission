// Global flags to prevent multiple triggers
let lastShownSubmission = null;
let submissionRequested = false;

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
  
  // Create div overlay
  const overlay = document.createElement('div');
  overlay.id = 'gta-mission-overlay';
  overlay.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 999999;
    pointer-events: none;
    text-align: center;
    font-family: 'Impact', 'Arial Black', sans-serif;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 30px;
    flex-wrap: wrap;
  `;
  
  // Add mission title
  const title = document.createElement('h1');
  title.textContent = 'MISSION PASSED!';
  title.style.cssText = `
    font-size: 120px;
    font-weight: 900;
    color: #FFD700;
    text-shadow: 
      4px 4px 0px #000,
      -4px -4px 0px #000,
      4px -4px 0px #000,
      -4px 4px 0px #000,
      8px 8px 20px rgba(0, 0, 0, 0.9);
    letter-spacing: 8px;
    margin: 0;
    padding: 0;
    line-height: 1;
    white-space: nowrap;
    animation: slideInFromLeft 1s ease-out;
  `;
  
  // Add respect text
  const respect = document.createElement('h2');
  respect.textContent = 'RESPECT ++';
  respect.style.cssText = `
    font-size: 80px;
    font-weight: 900;
    color: #00FF00;
    text-shadow: 
      3px 3px 0px #000,
      -3px -3px 0px #000,
      3px -3px 0px #000,
      -3px 3px 0px #000,
      6px 6px 15px rgba(0, 0, 0, 0.9);
    letter-spacing: 6px;
    margin: 0;
    padding: 0;
    line-height: 1;
    white-space: nowrap;
    animation: slideInFromRight 1s ease-out 0.2s both;
  `;
  
  overlay.appendChild(title);
  overlay.appendChild(respect);
  document.body.appendChild(overlay);
  
  // Add animations to document
  if (!document.getElementById('gta-mission-styles')) {
    const style = document.createElement('style');
    style.id = 'gta-mission-styles';
    style.textContent = `
      @keyframes slideInFromLeft {
        from {
          opacity: 0;
          transform: translateX(-200px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
      @keyframes slideInFromRight {
        from {
          opacity: 0;
          transform: translateX(200px);
        }
        to {
          opacity: 1;
          transform: translateX(0);
        }
      }
    `;
    document.head.appendChild(style);
  }
  
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
    if (submissionRequested && checkForNewAcceptance()) {
      showMissionPassed();
      submissionRequested = false;
    }
  }, 500);
});

// Track submit clicks so we only show after a user-initiated submission
document.addEventListener('click', (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const submitButton = target.closest('[data-e2e-locator="console-submit-button"], [data-e2e-locator="submit-button"], button');
  if (!submitButton) {
    return;
  }

  const buttonText = submitButton.textContent || '';
  if (/submit/i.test(buttonText)) {
    submissionRequested = true;
  }
}, true);

// Track keyboard submit shortcut (Ctrl+Enter / Cmd+Enter)
document.addEventListener('keydown', (event) => {
  const isSubmitShortcut = (event.ctrlKey || event.metaKey) && event.key === 'Enter';
  if (isSubmitShortcut) {
    submissionRequested = true;
  }
}, true);

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
