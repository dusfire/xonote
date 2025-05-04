/**
 * Welcome.js - Professional Welcome Popup for Xonote
 * Enhanced Features:
 * - Shows only once per unique user (using localStorage)
 * - Blurred background overlay when popup is active
 * - Disables page scrolling when popup is shown
 * - Closes automatically after 5 seconds with progress indicator
 * - Manual close button
 * - Uses custom xo.png logo
 * - Premium design with animations and responsive layout
 */

(function () {
  // Configuration
  const POPUP_TIMEOUT = 15000; // 5 seconds
  const STORAGE_KEY = "xonote_welcome_shown";
  const TARGET_ELEMENT = "welcomeXo";
  const LOGO_PATH = "assets/xologo.png"; // Path to logo image

  // Check if we've shown the welcome popup to this user before
  function hasSeenWelcome() {
    return localStorage.getItem(STORAGE_KEY) === "true";
  }

  // Mark that this user has seen the welcome popup
  function markWelcomeSeen() {
    localStorage.setItem(STORAGE_KEY, "true");
  }

  // Disable page scrolling
  function disableScrolling() {
    // Store the original overflow style
    const originalStyle = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return originalStyle;
  }

  // Re-enable page scrolling
  function enableScrolling(originalStyle) {
    document.body.style.overflow = originalStyle;
  }

  // Create styles for the welcome popup
  function createWelcomeStyles() {
    const styleEl = document.createElement("style");
    styleEl.id = "welcome-popup-styles";
    styleEl.textContent = `
          .welcome-backdrop {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background-color: rgba(0, 0, 0, 0.4);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              z-index: 9999;
              opacity: 0;
              transition: opacity 0.3s ease;
          }
          
          .welcome-backdrop.visible {
              opacity: 1;
          }

          .welcome-popup-container {
              position: fixed;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              justify-content: center;
              align-items: center;
              z-index: 10000;
              pointer-events: none;
          }

          .welcome-popup {
              background-color: var(--card-bg, #ffffff);
              color: var(--text-color, #333333);
              border-radius: 16px;
              box-shadow: 0 20px 50px rgba(0, 0, 0, 0.2);
              padding: 32px;
              max-width: 90%;
              width: 500px;
              position: relative;
              pointer-events: auto;
              opacity: 0;
              transform: translateY(20px) scale(0.98);
              transition: opacity 0.4s ease, transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
              overflow: hidden;
              border: 1px solid var(--border-color, rgba(0, 0, 0, 0.06));
          }

          .welcome-popup.visible {
              opacity: 1;
              transform: translateY(0) scale(1);
          }

          .welcome-popup-close {
              position: absolute;
              top: 20px;
              right: 20px;
              width: 32px;
              height: 32px;
              background: rgba(0, 0, 0, 0.05);
              border: none;
              border-radius: 50%;
              cursor: pointer;
              display: flex;
              align-items: center;
              justify-content: center;
              opacity: 0.8;
              transition: all 0.2s ease;
              color: var(--text-color, #333333);
          }

          .welcome-popup-close:hover {
              opacity: 1;
              background: rgba(0, 0, 0, 0.1);
              transform: rotate(90deg);
          }

          .welcome-popup-close::before,
          .welcome-popup-close::after {
              content: '';
              position: absolute;
              width: 16px;
              height: 2px;
              background-color: currentColor;
          }

          .welcome-popup-close::before {
              transform: rotate(45deg);
          }

          .welcome-popup-close::after {
              transform: rotate(-45deg);
          }

          .welcome-popup-logo {
              text-align: center;
              margin-bottom: 24px;
          }

          .welcome-popup-logo img {
              width: 80px;
              height: auto;
              
          }

          .welcome-popup-title {
              font-size: 24px;
              font-weight: 700;
              margin-bottom: 12px;
              text-align: center;
              letter-spacing: -0.02em;
              background: linear-gradient(120deg, var(--primary-color, #4f46e5), var(--secondary-color, #3730a3));
              -webkit-background-clip: text;
              background-clip: text;
              -webkit-text-fill-color: transparent;
          }

          .welcome-popup-message {
              text-align: center;
              margin-bottom: 28px;
              line-height: 1.6;
              color: var(--text-secondary, #555555);
              font-size: 15px;
          }

          .welcome-popup-features {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 16px;
              margin-bottom: 32px;
              border-radius: 12px;
              padding: 16px;
              background-color: rgba(0, 0, 0, 0.02);
              border: 1px solid rgba(0, 0, 0, 0.04);
          }

          .welcome-feature-item {
              display: flex;
              align-items: center;
              font-size: 14px;
              padding: 8px;
              border-radius: 8px;
              transition: background-color 0.2s ease;
          }

          .welcome-feature-item:hover {
              background-color: rgba(0, 0, 0, 0.03);
          }

          .welcome-feature-icon {
              margin-right: 10px;
              color: var(--primary-color, #4f46e5);
              display: flex;
              align-items: center;
              justify-content: center;
              background-color: rgba(79, 70, 229, 0.1);
              width: 28px;
              height: 28px;
              border-radius: 50%;
              flex-shrink: 0;
          }

          .welcome-popup-progress-container {
              position: absolute;
              bottom: 0;
              left: 0;
              width: 100%;
              height: 4px;
              background-color: rgba(0, 0, 0, 0.05);
          }

          .welcome-popup-progress {
              height: 100%;
              background-color: var(--primary-color, #4f46e5);
              width: 100%;
              transform-origin: left;
              transform: scaleX(1);
              transition: transform linear 15s;
          }

          .welcome-popup-progress.active {
              transform: scaleX(0);
          }

          .welcome-popup-button {
              background: linear-gradient(to right, var(--primary-color, #4f46e5), var(--secondary-color, #3730a3));
              color: white;
              border: none;
              border-radius: 8px;
              padding: 14px 20px;
              font-weight: 600;
              font-size: 15px;
              cursor: pointer;
              display: block;
              width: 100%;
              transition: all 0.2s ease;
              box-shadow: 0 4px 12px rgba(79, 70, 229, 0.2);
              letter-spacing: 0.02em;
          }

          .welcome-popup-button:hover {
              transform: translateY(-2px);
              box-shadow: 0 6px 16px rgba(79, 70, 229, 0.3);
          }

          .welcome-popup-button:active {
              transform: translateY(0);
          }

          /* Dark theme adjustments */
          body.dark-theme .welcome-feature-icon {
              background-color: rgba(79, 70, 229, 0.2);
          }

          body.dark-theme .welcome-popup-features {
              background-color: rgba(255, 255, 255, 0.03);
              border-color: rgba(255, 255, 255, 0.05);
          }

          body.dark-theme .welcome-popup-close {
              background: rgba(255, 255, 255, 0.1);
          }

          body.dark-theme .welcome-popup-close:hover {
              background: rgba(255, 255, 255, 0.15);
          }

          body.dark-theme .welcome-popup-progress-container {
              background-color: rgba(255, 255, 255, 0.05);
          }

          @media (max-width: 640px) {
              .welcome-popup {
                  width: calc(100% - 32px);
                  padding: 24px 20px;
              }

              .welcome-popup-features {
                  grid-template-columns: 1fr;
              }

              .welcome-popup-title {
                  font-size: 22px;
              }
              
              .welcome-popup-logo img {
                  width: 70px;
              }
          }
      `;
    document.head.appendChild(styleEl);
  }

  // Create the welcome popup HTML
  function createWelcomePopup() {
    // Create container
    const container = document.createElement("div");
    container.className = "welcome-popup-container";

    // Create backdrop with blur
    const backdrop = document.createElement("div");
    backdrop.className = "welcome-backdrop";
    document.body.appendChild(backdrop);

    // Create popup content
    container.innerHTML = `
          <div class="welcome-popup">
              <button class="welcome-popup-close" aria-label="Close welcome message"></button>
              
              <div class="welcome-popup-logo">
                  <img src="${LOGO_PATH}" alt="Xonote Logo" />
              </div>
              
              <h2 class="welcome-popup-title">Welcome to Xonote!</h2>
              
              <p class="welcome-popup-message">
                  Your personal note-taking workspace with cloud sync and beautiful design.
                  Start capturing your ideas instantly with a clean, distraction-free interface.
              </p>
              
              <div class="welcome-popup-features">
                  <div class="welcome-feature-item">
                      <span class="welcome-feature-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M7 16L12 21L17 16M7 8L12 3L17 8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                      </span>
                      <span>Cloud Sync</span>
                  </div>
                  <div class="welcome-feature-item">
                      <span class="welcome-feature-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 16V12M12 8H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                          </svg>
                      </span>
                      <span>Dark & Light Modes</span>
                  </div>
                  <div class="welcome-feature-item">
                      <span class="welcome-feature-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 15V17M6 21H18C19.1046 21 20 20.1046 20 19V13C20 11.8954 19.1046 11 18 11H6C4.89543 11 4 11.8954 4 13V19C4 20.1046 4.89543 21 6 21ZM16 11V7C16 4.79086 14.2091 3 12 3C9.79086 3 8 4.79086 8 7V11H16Z" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                      </span>
                      <span>Secure Storage</span>
                  </div>
                  <div class="welcome-feature-item">
                      <span class="welcome-feature-icon">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <path d="M12 18.5V19.5M5 10.5H19M5 10.5V16.2C5 17.8802 5 18.7202 5.32698 19.362C5.6146 19.9265 6.07354 20.3854 6.63803 20.673C7.27976 21 8.11984 21 9.8 21H14.2C15.8802 21 16.7202 21 17.362 20.673C17.9265 20.3854 18.3854 19.9265 18.673 19.362C19 18.7202 19 17.8802 19 16.2V10.5M5 10.5V8.8C5 7.11984 5 6.27976 5.32698 5.63803C5.6146 5.07354 6.07354 4.6146 6.63803 4.32698C7.27976 4 8.11984 4 9.8 4H14.2C15.8802 4 16.7202 4 17.362 4.32698C17.9265 4.6146 18.3854 5.07354 18.673 5.63803C19 6.27976 19 7.11984 19 8.8V10.5M12 8.5V8.51M12 14.5V14.51" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                      </span>
                      <span>Mobile Friendly</span>
                  </div>
              </div>
              
              <button class="welcome-popup-button">Get Started Now</button>
              
              <div class="welcome-popup-progress-container">
                  <div class="welcome-popup-progress"></div>
              </div>
          </div>
      `;

    return { container, backdrop };
  }

  // Show the welcome popup with animations
  function showWelcomePopup() {
    if (hasSeenWelcome()) {
      return; // Don't show if user has seen it before
    }

    // Create styles if they don't exist
    if (!document.getElementById("welcome-popup-styles")) {
      createWelcomeStyles();
    }

    // Create and add the popup
    const targetElement = document.getElementById(TARGET_ELEMENT);
    if (!targetElement) {
      console.error("Target element for welcome popup not found");
      return;
    }

    const { container: popupContainer, backdrop } = createWelcomePopup();
    targetElement.appendChild(popupContainer);

    // Get elements for interactions
    const popup = popupContainer.querySelector(".welcome-popup");
    const closeBtn = popupContainer.querySelector(".welcome-popup-close");
    const actionBtn = popupContainer.querySelector(".welcome-popup-button");
    const progressBar = popupContainer.querySelector(".welcome-popup-progress");

    // Disable scrolling and save original style
    const originalOverflowStyle = disableScrolling();

    // Show the backdrop and popup with animation
    setTimeout(() => {
      backdrop.classList.add("visible");
    }, 50);

    setTimeout(() => {
      popup.classList.add("visible");
    }, 150);

    // Start the progress bar animation
    setTimeout(() => {
      progressBar.classList.add("active");
    }, 200);

    // Setup close handlers
    const closePopup = () => {
      // Start animations to hide elements
      popup.classList.remove("visible");
      backdrop.classList.remove("visible");

      // Re-enable scrolling
      enableScrolling(originalOverflowStyle);

      // Remove elements after animations complete
      setTimeout(() => {
        if (popupContainer.parentNode) {
          popupContainer.parentNode.removeChild(popupContainer);
        }
        if (backdrop.parentNode) {
          backdrop.parentNode.removeChild(backdrop);
        }
      }, 400); // Match the duration of the fade-out animation

      // Mark as seen
      markWelcomeSeen();
    };

    // Close button event
    closeBtn.addEventListener("click", closePopup);

    // Click on backdrop to close
    backdrop.addEventListener("click", closePopup);

    // Prevent clicks on the popup from closing it
    popup.addEventListener("click", (e) => {
      e.stopPropagation();
    });

    // Action button event
    actionBtn.addEventListener("click", () => {
      closePopup();
      // Focus on note title input if it exists
      const noteTitleInput = document.getElementById("noteTitle");
      if (noteTitleInput) {
        noteTitleInput.focus();
      }
    });

    // Auto-close after timeout
    setTimeout(closePopup, POPUP_TIMEOUT);
  }

  // Theme change observer - updates popup appearance if theme changes while popup is visible
  function observeThemeChanges() {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (
          mutation.type === "attributes" &&
          mutation.attributeName === "class"
        ) {
          // The theme has changed while the popup is open
          // CSS variables in our styles will handle the theme changes automatically
        }
      });
    });

    observer.observe(document.body, { attributes: true });
  }

  // Check if Firebase is available and handle auth state
  function setupFirebaseListener() {
    // This function attempts to bind to Firebase auth state changes
    // It's wrapped in a try/catch because Firebase might not be available yet
    try {
      if (typeof getAuth === "function" && window.firebaseApp) {
        const auth = getAuth(window.firebaseApp);
        onAuthStateChanged(auth, (user) => {
          if (user && !hasSeenWelcome()) {
            // New sign-in detected
            showWelcomePopup();
          }
        });
      }
    } catch (e) {
      // Firebase might not be loaded yet or not used
      console.log("Firebase auth not available for welcome popup");
    }
  }

  // Initialize on page load
  function init() {
    // Wait for DOM to be fully loaded
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", () => {
        showWelcomePopup();
        observeThemeChanges();
        setupFirebaseListener();
      });
    } else {
      // DOM already loaded
      showWelcomePopup();
      observeThemeChanges();
      setupFirebaseListener();
    }
  }

  // Start everything
  init();
})();
