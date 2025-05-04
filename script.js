// Import Firebase modules

import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  sendPasswordResetEmail,
  deleteUser,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
  Timestamp,
  limit,
  startAfter,
  count,
} from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// ------------------- GLOBAL VARIABLES -------------------

// Initialize Firebase Authentication and Firestore
const auth = getAuth(window.firebaseApp);
const db = getFirestore(window.firebaseApp);
const googleProvider = new GoogleAuthProvider();

// Track current user
let currentUser = null;
let currentNoteId = null;

// --- PAGINATION STATE FOR LOAD MORE BUTTON ---
let notesLastVisible = null; // reference to the last fetched document
let notesTotalCount = 0; // total count of notes for the user
let notesPerPage = 12; // how many notes to load at a time
let notesLoadedCount = 0; // notes currently loaded

// DOM Elements - General
const themeToggle = document.getElementById("themeToggle");
const mobileThemeToggle = document.getElementById("mobileThemeToggle");
const hamburgerBtn = document.querySelector(".hamburger");
const mobileMenu = document.querySelector(".mobile-menu");
const loadingSpinner = document.getElementById("loadingSpinner");
const toastNotification = document.getElementById("toastNotification");
const toastMessage = document.getElementById("toastMessage");

// DOM Elements - Authentication
const loginBtn = document.getElementById("loginBtn");
const mobileLoginBtn = document.getElementById("mobileLoginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const mobileLogoutBtn = document.getElementById("mobileLogoutBtn");
const userMenu = document.getElementById("userMenu");
const accountBtn = document.getElementById("accountBtn");
const mobileAccountBtn = document.getElementById("mobileAccountBtn");

// DOM Elements - Sections
const heroSection = document.getElementById("heroSection");
const overviewSection = document.getElementById("overviewSection");
const noteSection = document.getElementById("noteSection");
const getStartedBtn = document.getElementById("getStartedBtn");

// DOM Elements - Note Interface
const noteTitle = document.getElementById("noteTitle");
const noteContent = document.getElementById("noteContent");
const saveNoteBtn = document.getElementById("saveNoteBtn");
const notesGrid = document.getElementById("notesGrid");

// --- LOAD MORE BUTTON ---
const loadMoreBtn = document.createElement("button");
loadMoreBtn.textContent = "Load More";
loadMoreBtn.id = "loadMoreBtn";
loadMoreBtn.className = "hidden load-more-btn"; // start hidden
loadMoreBtn.style.margin = "24px auto";
loadMoreBtn.style.display = "block";
notesGrid.parentNode.appendChild(loadMoreBtn);

// DOM Elements - Fullscreen Note View
const fullScreenNote = document.getElementById("fullScreenNote");
const fullScreenNoteTitle = document.getElementById("fullScreenNoteTitle");
const fullScreenNoteContent = document.getElementById("fullScreenNoteContent");
const fullScreenNoteTimestamp = document.getElementById(
  "fullScreenNoteTimestamp"
);
const closeFullScreenBtn = document.getElementById("closeFullScreenBtn");
const editNoteBtn = document.getElementById("editNoteBtn");
const deleteNoteBtn = document.getElementById("deleteNoteBtn");

// DOM Elements - User Settings
const userSettingsModal = document.getElementById("userSettingsModal");
const userProfilePic = document.getElementById("userProfilePic");
const userEmail = document.getElementById("userEmail");
const resetPasswordBtn = document.getElementById("resetPasswordBtn");
const deleteAccountBtn = document.getElementById("deleteAccountBtn");
const closeSettingsBtn = document.getElementById("closeSettingsBtn");

// DOM Elements - Confirmation Modal
const confirmationModal = document.getElementById("confirmationModal");
const confirmationTitle = document.getElementById("confirmationTitle");
const confirmationMessage = document.getElementById("confirmationMessage");
const confirmActionBtn = document.getElementById("confirmActionBtn");
const cancelActionBtn = document.getElementById("cancelActionBtn");
const closeConfirmationBtn = document.getElementById("closeConfirmationBtn");

// ------------------- INITIALIZATION -------------------

document.addEventListener("DOMContentLoaded", () => {
  // Check for saved theme preference
  checkThemePreference();

  // Set up authentication state observer
  onAuthStateChanged(auth, (user) => {
    if (user) {
      // User is signed in
      handleUserSignedIn(user);
    } else {
      // User is signed out
      handleUserSignedOut();
    }
  });

  // Set up event listeners
  setupEventListeners();

  // Load More button event
  loadMoreBtn.addEventListener("click", handleLoadMoreNotes);
});

// ------------------- EVENT LISTENERS -------------------

function setupEventListeners() {
  // Theme Toggle
  themeToggle.addEventListener("click", toggleTheme);
  mobileThemeToggle.addEventListener("click", toggleTheme);

  // Mobile Menu
  hamburgerBtn.addEventListener("click", toggleMobileMenu);

  // Authentication
  loginBtn.addEventListener("click", () => {
    window.location.href = "login-signup.html";
  });
  mobileLoginBtn.addEventListener("click", () => {
    window.location.href = "login-signup.html";
  });
  logoutBtn.addEventListener("click", handleLogout);
  mobileLogoutBtn.addEventListener("click", handleLogout);

  // Get Started Button
  getStartedBtn.addEventListener("click", () => {
    window.location.href = "login-signup.html";
  });

  // Account Settings
  accountBtn.addEventListener("click", openUserSettings);
  mobileAccountBtn.addEventListener("click", openUserSettings);
  closeSettingsBtn.addEventListener("click", closeUserSettings);
  resetPasswordBtn.addEventListener("click", handleResetPassword);
  deleteAccountBtn.addEventListener("click", confirmDeleteAccount);

  // Confirmation Modal
  closeConfirmationBtn.addEventListener("click", closeConfirmationModal);
  cancelActionBtn.addEventListener("click", closeConfirmationModal);

  // Note Operations
  saveNoteBtn.addEventListener("click", handleSaveNote);
  closeFullScreenBtn.addEventListener("click", closeFullScreenNote);
  editNoteBtn.addEventListener("click", handleEditNote);
  deleteNoteBtn.addEventListener("click", confirmDeleteNote);
}

// ------------------- THEME MANAGEMENT -------------------

// Check for saved theme preference
function checkThemePreference() {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-theme");
  }
}

// Toggle between light and dark theme
function toggleTheme() {
  document.body.classList.toggle("dark-theme");

  // Save theme preference to localStorage
  if (document.body.classList.contains("dark-theme")) {
    localStorage.setItem("theme", "dark");
  } else {
    localStorage.setItem("theme", "light");
  }
}

// ------------------- MOBILE MENU -------------------

// Toggle mobile menu visibility
function toggleMobileMenu() {
  mobileMenu.classList.toggle("active");
}

// ------------------- AUTHENTICATION HANDLERS -------------------

// Handle user sign in
function handleUserSignedIn(user) {
  currentUser = user;

  // Update UI for logged in state
  loginBtn.classList.add("hidden");
  mobileLoginBtn.classList.add("hidden");
  userMenu.classList.remove("hidden");
  mobileLogoutBtn.classList.remove("hidden");
  mobileAccountBtn.classList.remove("hidden");

  // Hide landing page sections
  heroSection.classList.add("hidden");
  overviewSection.classList.add("hidden");

  // Show note section
  noteSection.classList.remove("hidden");

  // Update user profile information
  updateUserProfile(user);

  // Load user's notes (paginated)
  resetNotesPaginationState();
  loadNotesPaginated();
}

// Handle user sign out
function handleUserSignedOut() {
  currentUser = null;

  // Update UI for logged out state
  loginBtn.classList.remove("hidden");
  mobileLoginBtn.classList.remove("hidden");
  userMenu.classList.add("hidden");
  mobileLogoutBtn.classList.add("hidden");
  mobileAccountBtn.classList.add("hidden");

  // Show landing page sections
  heroSection.classList.remove("hidden");
  overviewSection.classList.remove("hidden");

  // Hide note section
  noteSection.classList.add("hidden");

  // Clear form
  noteTitle.value = "";
  noteContent.value = "";
  currentNoteId = null;
  notesGrid.innerHTML = "";

  // Hide load more button
  loadMoreBtn.classList.add("hidden");
}

// Handle logout
async function handleLogout() {
  try {
    await signOut(auth);
    showToast("Logged out successfully");

    // Close mobile menu if open
    mobileMenu.classList.remove("active");
  } catch (error) {
    showToast("Error logging out: " + error.message);
  }
}

// Update user profile information
function updateUserProfile(user) {
  // Update profile picture if available
  if (user.photoURL) {
    userProfilePic.src = user.photoURL;
  } else {
    // Use initials or default avatar if no photo
    userProfilePic.src =
      "https://ui-avatars.com/api/?name=" +
      encodeURIComponent(user.email) +
      "&background=random";
  }

  // Update email
  userEmail.textContent = user.email;
}

// ------------------- USER SETTINGS -------------------

// Open user settings modal
function openUserSettings() {
  if (!currentUser) return;

  userSettingsModal.classList.remove("hidden");

  // Close mobile menu if open
  mobileMenu.classList.remove("active");
}

// Close user settings modal
function closeUserSettings() {
  userSettingsModal.classList.add("hidden");
}

// Handle password reset
async function handleResetPassword() {
  if (!currentUser || !currentUser.email) return;

  try {
    showLoading();
    await sendPasswordResetEmail(auth, currentUser.email);
    hideLoading();
    showToast("Password reset email sent. Check your inbox.");
    closeUserSettings();
  } catch (error) {
    hideLoading();
    showToast("Error sending password reset: " + error.message);
  }
}

// Confirm account deletion
function confirmDeleteAccount() {
  confirmationTitle.textContent = "Delete Account";
  confirmationMessage.textContent =
    "Are you sure you want to delete your account? This action cannot be undone and all your notes will be lost.";

  // Set up confirmation action
  confirmActionBtn.onclick = handleDeleteAccount;

  // Show confirmation modal
  confirmationModal.classList.remove("hidden");
}

// Handle account deletion
async function handleDeleteAccount() {
  if (!currentUser) return;

  showLoading();

  try {
    // Delete all user's notes first
    const notesRef = collection(db, "notes");
    const q = query(notesRef, where("userId", "==", currentUser.uid));
    const querySnapshot = await getDocs(q);

    // Create an array of promises to delete each note
    const deletePromises = [];
    querySnapshot.forEach((doc) => {
      deletePromises.push(deleteDoc(doc.ref));
    });

    // Wait for all notes to be deleted
    await Promise.all(deletePromises);

    // Now delete the user account
    await deleteUser(currentUser);

    hideLoading();
    showToast("Account deleted successfully");
    closeConfirmationModal();
    closeUserSettings();
  } catch (error) {
    hideLoading();
    showToast("Error deleting account: " + error.message);
  }
}

// ------------------- NOTE OPERATIONS -------------------

// --- PAGINATION LOAD NOTES MODIFIED ---
function resetNotesPaginationState() {
  notesLastVisible = null;
  notesLoadedCount = 0;
  notesTotalCount = 0;
  loadMoreBtn.classList.add("hidden");
}

// Load user's notes (paginated)
async function loadNotesPaginated(initialClear = true) {
  if (!currentUser) return;

  showLoading();

  try {
    // Count total notes for current user to control load more button visibility
    const notesRef = collection(db, "notes");
    const countQuery = query(notesRef, where("userId", "==", currentUser.uid));
    const countSnapshot = await getDocs(countQuery);
    notesTotalCount = countSnapshot.size;

    // Build query for first/next batch
    let notesQuery;
    if (!notesLastVisible) {
      notesQuery = query(
        notesRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        limit(notesPerPage)
      );
    } else {
      notesQuery = query(
        notesRef,
        where("userId", "==", currentUser.uid),
        orderBy("timestamp", "desc"),
        startAfter(notesLastVisible),
        limit(notesPerPage)
      );
    }

    // Fetch batch
    const snapshot = await getDocs(notesQuery);

    // Initial load: clear existing notes
    if (initialClear) {
      const emptyMessage = notesGrid.querySelector(".empty-notes-message");
      if (emptyMessage) {
        notesGrid.innerHTML = "";
      }
      notesGrid.innerHTML = "";
    }

    // Handle empty
    if (notesLoadedCount === 0 && snapshot.empty) {
      notesGrid.innerHTML = `
          <div class="empty-notes-message">
              <i class="dus-speaker_notes_off"></i>
              <p>You don't have any notes yet. Create your first note!</p>
          </div>
        `;
      loadMoreBtn.classList.add("hidden");
    } else {
      // Display notes
      snapshot.forEach((doc) => {
        const note = doc.data();
        createNoteCard(doc.id, note);
      });
      // Track pagination
      if (!snapshot.empty) {
        notesLastVisible = snapshot.docs[snapshot.docs.length - 1];
        notesLoadedCount += snapshot.docs.length;
      }
      // Show/hide load more button
      // Show only if there are more notes to load
      if (notesTotalCount > notesLoadedCount) {
        loadMoreBtn.classList.remove("hidden");
      } else {
        loadMoreBtn.classList.add("hidden");
      }
    }
  } catch (error) {
    showToast("Error loading notes: " + error.message);
    loadMoreBtn.classList.add("hidden");
  } finally {
    hideLoading();
  }
}

// For "Load More" button click
function handleLoadMoreNotes() {
  loadNotesPaginated(false);
}

// --- Override old loadNotes with paginated version ---
async function loadNotes() {
  resetNotesPaginationState();
  await loadNotesPaginated();
}

// Create a note card in the grid
function createNoteCard(id, note) {
  const date =
    note.timestamp instanceof Timestamp ? note.timestamp.toDate() : new Date();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  const noteCard = document.createElement("div");
  noteCard.className = "note-card";
  noteCard.innerHTML = `
      <h3>${note.title || "Untitled Note"}</h3>
      <div class="note-card-content">${note.content}</div>
      <div class="note-timestamp"><i class="dus-time"></i> ${formattedDate}</div>
  `;

  // Add click event to open the note in full screen
  noteCard.addEventListener("click", () => {
    openFullScreenNote(id, note);
  });

  notesGrid.appendChild(noteCard);
}

// Handle saving a note (create or update)
async function handleSaveNote() {
  if (!currentUser) return;

  // Get note data
  const title = noteTitle.value.trim();
  const content = noteContent.value.trim();

  if (!title && !content) {
    showToast("Note cannot be empty");
    return;
  }

  showLoading();

  try {
    if (currentNoteId) {
      // Update existing note
      const noteRef = doc(db, "notes", currentNoteId);
      await updateDoc(noteRef, {
        title: title || "Untitled Note",
        content,
        timestamp: serverTimestamp(),
      });
    } else {
      // Create new note
      await addDoc(collection(db, "notes"), {
        userId: currentUser.uid,
        title: title || "Untitled Note",
        content,
        timestamp: serverTimestamp(),
      });
    }

    // Clear form and reload notes
    noteTitle.value = "";
    noteContent.value = "";
    currentNoteId = null;
    // Reset pagination and reload
    resetNotesPaginationState();
    loadNotesPaginated();
  } catch (error) {
    showToast("Error saving note: " + error.message);
  } finally {
    hideLoading();
  }
}

// Open note in full screen view
function openFullScreenNote(id, note) {
  currentNoteId = id;

  // Set note data in full screen view
  fullScreenNoteTitle.textContent = note.title || "Untitled Note";
  fullScreenNoteContent.textContent = note.content;

  // Format timestamp
  const date =
    note.timestamp instanceof Timestamp ? note.timestamp.toDate() : new Date();

  const formattedDate = new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);

  fullScreenNoteTimestamp.textContent = "Last edited: " + formattedDate;

  // Show full screen view
  fullScreenNote.classList.remove("hidden");
}

// Close full screen note view
function closeFullScreenNote() {
  fullScreenNote.classList.add("hidden");
}

// Handle editing a note
function handleEditNote() {
  if (!currentNoteId) return;

  // Load note data into form
  noteTitle.value =
    fullScreenNoteTitle.textContent === "Untitled Note"
      ? ""
      : fullScreenNoteTitle.textContent;
  noteContent.value = fullScreenNoteContent.textContent;

  // Close full screen view
  closeFullScreenNote();

  // Scroll to note form
  noteTitle.scrollIntoView({ behavior: "smooth" });

  // Focus on title
  setTimeout(() => {
    noteTitle.focus();
  }, 500);
}

// Confirm note deletion
function confirmDeleteNote() {
  confirmationTitle.textContent = "Delete Note";
  confirmationMessage.textContent =
    "Are you sure you want to delete this note? This action cannot be undone.";

  // Set up confirmation action
  confirmActionBtn.onclick = handleDeleteNote;

  // Show confirmation modal
  confirmationModal.classList.remove("hidden");
}

// Handle note deletion
async function handleDeleteNote() {
  if (!currentNoteId) return;

  showLoading();

  try {
    await deleteDoc(doc(db, "notes", currentNoteId));

    showToast("Note deleted successfully");
    closeFullScreenNote();
    closeConfirmationModal();
    // Reset and reload paginated notes
    resetNotesPaginationState();
    loadNotesPaginated();
  } catch (error) {
    showToast("Error deleting note: " + error.message);
  } finally {
    hideLoading();
  }
}

// ------------------- UTILITY FUNCTIONS -------------------

// Show loading spinner
function showLoading() {
  loadingSpinner.classList.remove("hidden");
}

// Hide loading spinner
function hideLoading() {
  loadingSpinner.classList.add("hidden");
}

// Show toast notification
function showToast(message) {
  toastMessage.textContent = message;
  toastNotification.classList.remove("hidden");

  // Hide toast after 3 seconds
  setTimeout(() => {
    toastNotification.classList.add("hidden");
  }, 3000);
}

// Close confirmation modal
function closeConfirmationModal() {
  confirmationModal.classList.add("hidden");
}

// Export functions for use in other files
export {
  auth,
  googleProvider,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  showToast,
  showLoading,
  hideLoading,
};
