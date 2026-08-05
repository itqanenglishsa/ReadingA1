/* ==========================================================================
   Itqan English 30-Day Reading Challenge - Core Engine
   Features: 30 days stories (A1 CEFR Beginner), Interactive dictionary clicks,
   Vocabulary Wallet with filter, local storage sync, Comprehension Quizzes,
   and Text-to-Speech audio support.
   ========================================================================== */

// Note: The 30-Day CEFR A1 Reading Curriculum Data is loaded from curriculum.js

// Active State Management
let currentDayIndex = 0; // index mapping to day - 1
let completedDays = [];   // Array of day numbers
let savedWords = [];      // Array of objects { word, translation, day, source }
let streakCount = 0;
let synth = window.speechSynthesis;
let currentUtterance = null;
let activeTab = "challenge"; // challenge | wallet | achievements
let selectedQuizAnswers = {}; // map of { questionIndex: selectedOptionIndex }

// Gamification Engine State
let userXp = 0;
let unlockedBadges = [];
let perfectQuizCount = 0;
let audioListenedDays = [];
let awardedXpKeys = [];

// Reading Quests Interactive Game Engine State
let activeGameMode = "reader"; // 'reader' | 'detective' | 'hidden_objects' | 'highlight' | 'speed' | 'puzzle' | 'oneglance' | 'listenread' | 'mistakes' | 'ending' | 'readaloud' | 'memory'
let clozePercentage = 0; // 0 | 50 | 100
let speedTimerInterval = null;
let speedSeconds = 0;
let speedRunning = false;
let oneGlanceInterval = null;
let oneGlanceSeconds = 7;
let mediaRecorder = null;
let recordedAudioChunks = [];
let isRecordingMic = false;
let activeHighlightTool = "noun";
let secretKeyFoundToday = false;
let completedGameModes = new Set();

// Badges Catalog Definition
const BADGES_CATALOG = [
  { id: "first_step", title: "الخطوة الأولى 🚀", desc: "إكمال اليوم الأول من تحدي القراءة", icon: "🚀" },
  { id: "streak_3", title: "شعلة الإصرار 🔥", desc: "الوصول إلى 3 أيام متتالية من القراءة", icon: "🔥" },
  { id: "streak_7", title: "بطل الالتزام ⚡", desc: "الوصول إلى 7 أيام متتالية من القراءة", icon: "⚡" },
  { id: "quiz_master", title: "علامة كاملة 🧠", desc: "إجابة جميع أسئلة الاختبار بشكل صحيح", icon: "🧠" },
  { id: "word_10", title: "كنز الكلمات 📚", desc: "حفظ 10 كلمات في محفظة المفردات", icon: "📚" },
  { id: "audio_listener", title: "مستمع ماهر 🎧", desc: "الاستماع لقصة اليوم بالنطق الصوتي", icon: "🎧" },
  { id: "halfway_hero", title: "نصف المشوار 🏆", desc: "إكمال 15 يوماً من منهج التحدي", icon: "🏆" },
  { id: "itqan_legend", title: "أسطورة إتقان 👑", desc: "إكمال جميع الـ 30 يوماً بالكامل!", icon: "👑" }
];

// Levels Ladder System
const LEVELS_LADDER = [
  { level: 1, minXp: 0, maxXp: 150, title: "مبتدئ القراءة", avatar: "🌱" },
  { level: 2, minXp: 150, maxXp: 400, title: "جامع الكلمات", avatar: "📖" },
  { level: 3, minXp: 400, maxXp: 800, title: "مستكشف القصص", avatar: "🧠" },
  { level: 4, minXp: 800, maxXp: 1300, title: "خبير المفردات", avatar: "⚡" },
  { level: 5, minXp: 1300, maxXp: 2000, title: "عالم متألق", avatar: "🌟" },
  { level: 6, minXp: 2000, maxXp: 3000, title: "قائد التحدي", avatar: "🏆" },
  { level: 7, minXp: 3000, maxXp: 99999, title: "أسطورة إتقان", avatar: "👑" }
];

// DOM Cache Elements
const appRoot = document.getElementById("app-root");
const logoHome = document.getElementById("logo-home");
const tabChallengeBtn = document.getElementById("tab-challenge");
const tabWalletBtn = document.getElementById("tab-wallet");
const tabAchievementsBtn = document.getElementById("tab-achievements");
const walletCountBadge = document.getElementById("wallet-count");
const badgesCountBadge = document.getElementById("badges-count");
const streakCountText = document.getElementById("streak-count");
const progressPercentText = document.getElementById("progress-percent");
const headerProgressBar = document.getElementById("header-progress-bar");
const headerXpCount = document.getElementById("header-xp-count");
const headerXpBadge = document.getElementById("header-xp-badge");

const panelChallenge = document.getElementById("panel-challenge");
const panelWallet = document.getElementById("panel-wallet");
const panelAchievements = document.getElementById("panel-achievements");

// Achievement Panel Elements
const achieveAvatar = document.getElementById("achieve-avatar");
const achieveLevelTag = document.getElementById("achieve-level-tag");
const achieveLevelTitle = document.getElementById("achieve-level-title");
const achieveLevelSub = document.getElementById("achieve-level-sub");
const achieveXpRatio = document.getElementById("achieve-xp-ratio");
const achieveXpFill = document.getElementById("achieve-xp-fill");

const achieveStatXp = document.getElementById("achieve-stat-xp");
const achieveStatStreak = document.getElementById("achieve-stat-streak");
const achieveStatWords = document.getElementById("achieve-stat-words");
const achieveStatDays = document.getElementById("achieve-stat-days");

const badgesContainer = document.getElementById("badges-container");
const toastContainer = document.getElementById("toast-container");

const daysNavContainer = document.getElementById("days-navigation-container");

const activeDayBadge = document.getElementById("active-day-badge");
const activeStoryTitle = document.getElementById("active-story-title");
const difficultyTag = document.getElementById("difficulty-tag");
const wordCountBadge = document.getElementById("word-count-badge");
const storyTextView = document.getElementById("story-text-view");
const btnListen = document.getElementById("btn-listen");

const targetWordsContainer = document.getElementById("target-words-container");
const quizQuestionsContainer = document.getElementById("quiz-questions-container");

const btnCompleteDay = document.getElementById("btn-complete-day");
const btnNextDay = document.getElementById("btn-next-day");

// Wallet Views
const emptyWalletView = document.getElementById("empty-wallet-view");
const walletItemsGridView = document.getElementById("wallet-items-grid-view");
const walletTotalCount = document.getElementById("wallet-total-count");
const btnClearWallet = document.getElementById("btn-clear-wallet");
const btnWalletGoReading = document.getElementById("btn-wallet-go-reading");
const walletSearchBar = document.getElementById("wallet-search");
const savedWordsContainer = document.getElementById("saved-words-container");
const filterChips = document.querySelectorAll(".filter-chip");

// Tooltip Popup elements
const dictTooltip = document.getElementById("dict-tooltip");
const tooltipEng = document.getElementById("tooltip-eng");
const tooltipArb = document.getElementById("tooltip-arb");
const tooltipPos = document.getElementById("tooltip-pos");
const tooltipAudioBtn = document.getElementById("tooltip-audio");
const tooltipSaveBtn = document.getElementById("tooltip-save-btn");
const tooltipSaveText = document.getElementById("tooltip-save-text");
const tooltipCloseBtn = document.getElementById("tooltip-close-btn");

// Celebration modal
const celebrationModal = document.getElementById("celebration-modal");
const statCompletedDays = document.getElementById("stat-completed-days");
const statStreakDays = document.getElementById("stat-streak-days");
const btnCelebrationContinue = document.getElementById("btn-celebration-continue");


/* ==========================================================================
   State Persistence with Local Storage
   ========================================================================== */
function loadStateFromStorage() {
  // Load Completed Days
  const savedCompleted = localStorage.getItem("itqan_completed_days");
  if (savedCompleted) {
    completedDays = JSON.parse(savedCompleted);
  } else {
    completedDays = [];
  }

  // Load Saved Word Wallet
  const savedVocab = localStorage.getItem("itqan_vocab_wallet");
  if (savedVocab) {
    try {
      const parsed = JSON.parse(savedVocab);
      savedWords = Array.isArray(parsed) ? parsed.filter(w => w && typeof w === 'object' && w.word) : [];
    } catch(e) {
      savedWords = [];
    }
  } else {
    savedWords = [];
  }

  // Load Active Day
  const savedActiveDay = localStorage.getItem("itqan_active_day");
  if (savedActiveDay) {
    const dNum = parseInt(savedActiveDay);
    if (dNum >= 1 && dNum <= 30) {
      currentDayIndex = dNum - 1;
    }
  }

  // Load Gamification State
  const savedXp = localStorage.getItem("itqan_user_xp");
  userXp = savedXp ? parseInt(savedXp, 10) : 0;

  const savedBadges = localStorage.getItem("itqan_unlocked_badges");
  unlockedBadges = savedBadges ? JSON.parse(savedBadges) : [];

  const savedPerfectQuizzes = localStorage.getItem("itqan_perfect_quizzes");
  perfectQuizCount = savedPerfectQuizzes ? parseInt(savedPerfectQuizzes, 10) : 0;

  const savedAudioDays = localStorage.getItem("itqan_audio_days");
  audioListenedDays = savedAudioDays ? JSON.parse(savedAudioDays) : [];

  const savedXpKeys = localStorage.getItem("itqan_awarded_xp_keys");
  awardedXpKeys = savedXpKeys ? JSON.parse(savedXpKeys) : [];

  // Seed legacy completed items into awardedXpKeys so existing progress is never re-rewarded
  completedDays.forEach(d => {
    const k = `day_complete_${d}`;
    if (!awardedXpKeys.includes(k)) awardedXpKeys.push(k);
  });
  savedWords.forEach(item => {
    if (item && item.word) {
      const k = `word_save_${item.word.trim().toLowerCase()}`;
      if (!awardedXpKeys.includes(k)) awardedXpKeys.push(k);
    }
  });
  audioListenedDays.forEach(d => {
    const k = `audio_listen_day_${d}`;
    if (!awardedXpKeys.includes(k)) awardedXpKeys.push(k);
  });

  // Load Streak Count & Last Activity
  calculateStreak();
  updateHeaderStats();
}

function saveStateToStorage() {
  localStorage.setItem("itqan_completed_days", JSON.stringify(completedDays));
  localStorage.setItem("itqan_vocab_wallet", JSON.stringify(savedWords));
  localStorage.setItem("itqan_active_day", (currentDayIndex + 1).toString());
  localStorage.setItem("itqan_user_xp", userXp.toString());
  localStorage.setItem("itqan_unlocked_badges", JSON.stringify(unlockedBadges));
  localStorage.setItem("itqan_perfect_quizzes", perfectQuizCount.toString());
  localStorage.setItem("itqan_audio_days", JSON.stringify(audioListenedDays));
  localStorage.setItem("itqan_awarded_xp_keys", JSON.stringify(awardedXpKeys));
}

function getLocalDateString(d = new Date()) {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function getDaysDifference(dateStrA, dateStrB) {
  if (!dateStrA || !dateStrB) return 0;
  const partsA = dateStrA.split('-').map(Number);
  const partsB = dateStrB.split('-').map(Number);
  if (partsA.length < 3 || partsB.length < 3) return 0;
  
  const dateA = new Date(partsA[0], partsA[1] - 1, partsA[2]);
  const dateB = new Date(partsB[0], partsB[1] - 1, partsB[2]);
  
  const diffTime = dateB.getTime() - dateA.getTime();
  return Math.round(diffTime / (1000 * 3600 * 24));
}

function calculateStreak() {
  const todayStr = getLocalDateString();
  const lastActiveDateStr = localStorage.getItem("itqan_last_active_date");
  const storedStreak = localStorage.getItem("itqan_streak_count");

  if (!lastActiveDateStr || storedStreak === null) {
    // First usage or Local Storage cleared -> starts at 1
    streakCount = 1;
  } else {
    const parsedStreak = parseInt(storedStreak, 10);
    const currentStreakVal = (isNaN(parsedStreak) || parsedStreak < 1) ? 1 : parsedStreak;
    const daysDiff = getDaysDifference(lastActiveDateStr, todayStr);

    if (daysDiff === 0) {
      // Same day: keep current streak count
      streakCount = currentStreakVal;
    } else if (daysDiff === 1) {
      // Next consecutive day: increment streak by 1
      streakCount = currentStreakVal + 1;
    } else if (daysDiff > 1) {
      // Skipped 1 or more days: reset streak to 1
      streakCount = 1;
    } else {
      // Date went backwards or invalid: keep current streak
      streakCount = currentStreakVal;
    }
  }

  localStorage.setItem("itqan_streak_count", streakCount.toString());
  localStorage.setItem("itqan_last_active_date", todayStr);
}

function recordActivityForStreak() {
  calculateStreak();
  updateHeaderStats();
}


/* ==========================================================================
   Rendering Mechanics & UI Updates
   ========================================================================== */

function initializeApp() {
  loadStateFromStorage();
  
  // Render Sidebar curriculum list
  renderSidebarDays();
  
  // Setup Game Mode navigation controls
  setupGameModeNavigation();
  
  // Load Active Day content
  loadActiveDayContent();
  
  // Update header elements
  updateHeaderStats();
  updateWalletCountBadge();
  
  // Bind Static Listeners
  bindStaticListeners();
  
  // Initialize Focus Mode (وضع التركيز)
  initFocusMode();
}

function updateHeaderStats() {
  streakCountText.innerText = streakCount.toString();
  
  if (headerXpCount) {
    headerXpCount.innerText = userXp.toString();
  }
  
  if (badgesCountBadge) {
    badgesCountBadge.innerText = `${unlockedBadges.length}/8`;
  }
  
  const completionPercent = Math.round((completedDays.length / 30) * 100);
  progressPercentText.innerText = `${completionPercent}%`;
  headerProgressBar.style.width = `${completionPercent}%`;
}

function updateWalletCountBadge() {
  const count = savedWords.length;
  walletCountBadge.innerText = count.toString();
  walletTotalCount.innerText = count.toString();
  
  if (count === 0) {
    emptyWalletView.classList.remove("hidden");
    walletItemsGridView.classList.add("hidden");
  } else {
    emptyWalletView.classList.add("hidden");
    walletItemsGridView.classList.remove("hidden");
    renderWalletItems();
  }
}


/* ==========================================================================
   Gamification Engine Core (XP, Badges, Level Ladder, Audio & FX)
   ========================================================================== */

function getCurrentLevelInfo(xp) {
  let lvl = LEVELS_LADDER[0];
  for (let i = LEVELS_LADDER.length - 1; i >= 0; i--) {
    if (xp >= LEVELS_LADDER[i].minXp) {
      lvl = LEVELS_LADDER[i];
      break;
    }
  }
  const range = lvl.maxXp - lvl.minXp;
  const currentInRange = Math.max(0, xp - lvl.minXp);
  const percent = lvl.maxXp >= 99999 ? 100 : Math.min(100, Math.round((currentInRange / range) * 100));
  return { ...lvl, percent, currentInRange, range };
}

function awardXp(amount, reason = "", targetElem = null) {
  const prevLevelObj = getCurrentLevelInfo(userXp);
  userXp += amount;
  
  saveStateToStorage();
  updateHeaderStats();
  
  // Animate XP bump in header
  if (headerXpBadge) {
    headerXpBadge.classList.add("bump");
    setTimeout(() => headerXpBadge.classList.remove("bump"), 250);
  }
  
  // Show floating popup FX
  showFloatingXpPop(amount, targetElem);
  playRewardSound("xp");
  
  // Check Level Up
  const newLevelObj = getCurrentLevelInfo(userXp);
  if (newLevelObj.level > prevLevelObj.level) {
    playRewardSound("levelup");
    showToastNotification(
      `ترقية مستحقة! 🎉 (المستوى ${newLevelObj.level})`,
      `أصبحت الآن: ${newLevelObj.title} ${newLevelObj.avatar}`,
      newLevelObj.avatar,
      true
    );
    triggerConfetti();
  }
  
  // Check for Badges unlock
  checkBadgesUnlock();
  
  if (activeTab === "achievements") {
    renderAchievementsPanel();
  }
}

function awardXpOnce(actionKey, amount, reason = "", targetElem = null) {
  if (!actionKey) return false;
  if (!awardedXpKeys.includes(actionKey)) {
    awardedXpKeys.push(actionKey);
    saveStateToStorage();
    awardXp(amount, reason, targetElem);
    return true;
  }
  return false;
}

function showFloatingXpPop(amount, targetElem = null) {
  const pop = document.createElement("div");
  pop.className = "floating-xp-pop";
  pop.innerText = `+${amount} XP ⭐`;
  
  let left = window.innerWidth / 2 - 50;
  let top = window.innerHeight / 2 - 20;
  
  if (targetElem && targetElem.getBoundingClientRect) {
    const rect = targetElem.getBoundingClientRect();
    left = rect.left + rect.width / 2 - 40;
    top = rect.top - 20;
  }
  
  pop.style.left = `${Math.max(10, left)}px`;
  pop.style.top = `${Math.max(10, top)}px`;
  document.body.appendChild(pop);
  
  setTimeout(() => pop.remove(), 1200);
}

function showToastNotification(title, desc, icon = "⭐", isBadge = false) {
  if (!toastContainer) return;
  const toast = document.createElement("div");
  toast.className = `toast-popup ${isBadge ? 'badge-unlock' : ''}`;
  toast.innerHTML = `
    <span class="toast-icon">${icon}</span>
    <div class="toast-body">
      <span class="toast-title">${title}</span>
      ${desc ? `<span class="toast-desc">${desc}</span>` : ''}
    </div>
  `;
  toastContainer.appendChild(toast);
  
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

function showToast(msg, icon = "⭐") {
  showToastNotification(msg, "", icon);
}

function checkBadgesUnlock() {
  const state = {
    completedDaysCount: completedDays.length,
    streakCount: streakCount,
    savedWordsCount: savedWords.length,
    perfectQuizCount: perfectQuizCount,
    audioCount: audioListenedDays.length
  };
  
  let newlyUnlocked = false;
  
  BADGES_CATALOG.forEach(b => {
    if (!unlockedBadges.includes(b.id)) {
      let isEligible = false;
      if (b.id === "first_step" && state.completedDaysCount >= 1) isEligible = true;
      if (b.id === "streak_3" && state.streakCount >= 3) isEligible = true;
      if (b.id === "streak_7" && state.streakCount >= 7) isEligible = true;
      if (b.id === "word_10" && state.savedWordsCount >= 10) isEligible = true;
      if (b.id === "quiz_master" && state.perfectQuizCount >= 1) isEligible = true;
      if (b.id === "audio_listener" && state.audioCount >= 1) isEligible = true;
      if (b.id === "halfway_hero" && state.completedDaysCount >= 15) isEligible = true;
      if (b.id === "itqan_legend" && state.completedDaysCount >= 30) isEligible = true;
      
      if (isEligible) {
        unlockedBadges.push(b.id);
        newlyUnlocked = true;
        playRewardSound("badge");
        showToastNotification("وسام جديد! 🏆", `فتح وسام: ${b.title}`, b.icon, true);
        triggerConfetti();
      }
    }
  });
  
  if (newlyUnlocked) {
    saveStateToStorage();
    updateHeaderStats();
    if (activeTab === "achievements") {
      renderAchievementsPanel();
    }
  }
}

function renderAchievementsPanel() {
  if (!panelAchievements) return;
  
  const levelInfo = getCurrentLevelInfo(userXp);
  achieveAvatar.innerText = levelInfo.avatar;
  achieveLevelTag.innerText = `المستوى ${levelInfo.level}`;
  achieveLevelTitle.innerText = levelInfo.title;
  
  if (levelInfo.maxXp >= 99999) {
    achieveXpRatio.innerText = `${userXp} XP (أعلى مستوى)`;
    achieveXpFill.style.width = "100%";
  } else {
    achieveXpRatio.innerText = `${userXp} / ${levelInfo.maxXp} XP`;
    achieveXpFill.style.width = `${levelInfo.percent}%`;
  }
  
  achieveStatXp.innerText = userXp.toString();
  achieveStatStreak.innerText = streakCount.toString();
  achieveStatWords.innerText = savedWords.length.toString();
  achieveStatDays.innerText = `${completedDays.length}/30`;
  
  // Render Badges Cards
  badgesContainer.innerHTML = "";
  
  BADGES_CATALOG.forEach(badge => {
    const isUnlocked = unlockedBadges.includes(badge.id);
    const card = document.createElement("div");
    card.className = `badge-card ${isUnlocked ? "unlocked" : "locked"}`;
    
    card.innerHTML = `
      <span class="badge-status-tag">${isUnlocked ? "مفتوح ✓" : "مغلق 🔒"}</span>
      <div class="badge-card-icon">${badge.icon}</div>
      <div class="badge-card-title">${badge.title}</div>
      <div class="badge-card-desc">${badge.desc}</div>
    `;
    
    badgesContainer.appendChild(card);
  });
}

function playRewardSound(type = "xp") {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    
    if (type === "xp") {
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.07 + 0.25);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.3);
      });
    } else if (type === "badge" || type === "levelup") {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 fanfare
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.09);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + i * 0.09);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.09 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + i * 0.09);
        osc.stop(ctx.currentTime + i * 0.09 + 0.45);
      });
    }
  } catch (e) {
    // Ignore context autoplay restrictions
  }
}

function playCorrectAnswerSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    // High cheerful success chime notes (E5 659.25Hz -> A5 880.00Hz -> C#6 1108.73Hz)
    const notes = [659.25, 880.00, 1108.73];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.08);
      gain.gain.setValueAtTime(0.18, ctx.currentTime + i * 0.08);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.08 + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.08);
      osc.stop(ctx.currentTime + i * 0.08 + 0.4);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

function playIncorrectAnswerSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    // Soft descending 2-note error chime (Eb4 311Hz -> Ab3 207Hz)
    const tones = [
      { freq: 311.13, duration: 0.14, delay: 0 },
      { freq: 207.65, duration: 0.22, delay: 0.12 }
    ];
    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(t.freq, ctx.currentTime + t.delay);
      gain.gain.setValueAtTime(0.15, ctx.currentTime + t.delay);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + t.delay + t.duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + t.delay);
      osc.stop(ctx.currentTime + t.delay + t.duration + 0.05);
    });
  } catch (e) {
    // Ignore audio restrictions
  }
}

function triggerConfetti() {
  const canvas = document.getElementById("confetti-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  
  canvas.width = canvas.parentElement ? canvas.parentElement.clientWidth : window.innerWidth;
  canvas.height = canvas.parentElement ? canvas.parentElement.clientHeight : window.innerHeight;
  
  const particles = [];
  const colors = ["#214ecf", "#e06045", "#facc15", "#10b981", "#8b5cf6", "#ec4899"];
  
  for (let i = 0; i < 75; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height * 0.5,
      r: Math.random() * 6 + 4,
      color: colors[Math.floor(Math.random() * colors.length)],
      vx: (Math.random() - 0.5) * 5,
      vy: Math.random() * 3 + 2,
      rotation: Math.random() * 360,
      vRot: (Math.random() - 0.5) * 12
    });
  }
  
  let alpha = 1;
  const startTime = Date.now();
  
  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const elapsed = Date.now() - startTime;
    
    if (elapsed > 2000) {
      alpha -= 0.04;
    }
    
    if (alpha <= 0) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      return;
    }
    
    ctx.globalAlpha = Math.max(0, alpha);
    particles.forEach(p => {
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.translate(p.x, p.y);
      ctx.rotate((p.rotation * Math.PI) / 180);
      ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 1.5);
      ctx.restore();
      
      p.x += p.vx;
      p.y += p.vy;
      p.rotation += p.vRot;
    });
    
    requestAnimationFrame(draw);
  }
  
  draw();
}

// 1. Sidebar renderer
function renderSidebarDays() {
  daysNavContainer.innerHTML = "";
  
  challengeData.forEach((dayData, index) => {
    const isCompleted = completedDays.includes(dayData.day);
    const isActive = index === currentDayIndex;
    
    const dayBtn = document.createElement("button");
    dayBtn.className = `day-nav-item ${isActive ? "active" : ""} ${isCompleted ? "completed" : ""}`;
    dayBtn.id = `sidebar-day-${dayData.day}`;
    
    let statusIconHtml = "";
    if (isCompleted) {
      statusIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" class="status-icon-check"><polyline points="20 6 9 17 4 12"/></svg>`;
    } else if (isActive) {
      statusIconHtml = `<div class="status-icon-active"></div>`;
    } else {
      statusIconHtml = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="status-icon-locked"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="16" y2="12"/><line x1="12" x2="12.01" y1="8" y2="8"/></svg>`;
    }
    
    dayBtn.innerHTML = `
      <div class="day-status-indicator">
        ${statusIconHtml}
      </div>
      <div class="day-item-meta">
        <div class="day-item-num">اليوم ${dayData.day.toString().padStart(2, '0')}</div>
        <div class="day-item-title">${dayData.title}</div>
      </div>
      <span class="day-level-tag">${dayData.difficulty.split(" ")[0]}</span>
    `;
    
    dayBtn.addEventListener("click", () => {
      // Pause TTS before transitioning
      stopVoice();
      currentDayIndex = index;
      saveStateToStorage();
      
      // Update sidebar visual active class
      document.querySelectorAll(".day-nav-item").forEach(btn => btn.classList.remove("active"));
      dayBtn.classList.add("active");
      
      // Reload Workspace active Day
      loadActiveDayContent();
      
      // Reset sidebar statuses visually
      renderSidebarDays();
      
      // Smooth scroll back to top of reader area on click
      document.querySelector(".reader-area").scrollTo({ top: 0, behavior: 'smooth' });
    });
    
    daysNavContainer.appendChild(dayBtn);
    if (isActive) {
      setTimeout(() => {
        dayBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }, 100);
    }
  });
}

// 2. Active Day Reader Card Loader & Quest Engine Initialization
function loadActiveDayContent() {
  stopVoice();
  const currentDayData = challengeData[currentDayIndex];
  
  // Update badge and basic texts
  activeDayBadge.innerText = `MISSION ${currentDayData.day.toString().padStart(2, '0')}`;
  activeStoryTitle.innerText = currentDayData.title;
  difficultyTag.innerText = currentDayData.difficulty;
  
  const wordCount = currentDayData.story.split(/\s+/).length;
  wordCountBadge.innerText = `${wordCount} كلمة`;
  
  const missionBadge = document.getElementById("mission-status-badge");
  if (missionBadge) {
    missionBadge.innerText = completedDays.includes(currentDayData.day) ? "🏆 المهمة مكتملة" : "🎯 مهمة نشطة";
  }
  
  // Prepare & Render Clickable Story Text
  storyTextView.innerHTML = prepareStoryWordsHtml(currentDayData.story, currentDayData.dictionary);
  
  // Render Target Words for today
  renderTargetWords(currentDayData.target_words, currentDayData.dictionary);
  
  // Render Comprehension Quiz
  renderQuiz(currentDayData.quiz);
  
  // Reset Day State
  selectedQuizAnswers = {};
  secretKeyFoundToday = false;
  
  // Init Mission Clues Hub
  initInteractiveClues();
  
  // Apply Cloze Filter
  applyMemoryClozeFilter(clozePercentage);
  
  // Render Active Selected Game Mode
  renderActiveGameMode();
  
  // Progress Complete button handling
  const isCompleted = completedDays.includes(currentDayData.day);
  if (isCompleted) {
    btnCompleteDay.classList.add("hidden");
    if (currentDayIndex < 29) {
      btnNextDay.classList.remove("hidden");
    } else {
      btnNextDay.classList.add("hidden");
    }
  } else {
    btnCompleteDay.classList.remove("hidden");
    btnNextDay.classList.add("hidden");
  }
  
  // Close any open tooltips
  closeTooltip();
}

/* ==========================================================================
   13 Interactive Reading Game Modes & Missions Engine
   ========================================================================== */

// Interactive Clues Hub Handlers
function initInteractiveClues() {
  const clueBtnHint = document.getElementById("clue-btn-hint");
  const clueBtnMap = document.getElementById("clue-btn-map");
  const clueBtnKey = document.getElementById("clue-btn-key");
  const clueDisplayBox = document.getElementById("clue-display-box");
  const clueDisplayText = document.getElementById("clue-display-text");
  const clueCloseBtn = document.getElementById("clue-close-btn");
  
  if (!clueDisplayBox) return;
  
  const currentDayData = challengeData[currentDayIndex];
  
  if (clueBtnHint) {
    clueBtnHint.onclick = () => {
      clueDisplayBox.classList.remove("hidden");
      clueDisplayText.innerHTML = `📜 <strong>هدف القصة والدرس:</strong> اقرأ القصة بعناية واكتشف المفردات الجديدة التالية: <span style="color:#214ecf; font-weight:700;">${currentDayData.target_words.join(", ")}</span>!`;
    };
  }
  
  if (clueBtnMap) {
    clueBtnMap.onclick = () => {
      clueDisplayBox.classList.remove("hidden");
      // Find setting or location in dictionary/story
      let loc = "المدرسة / المنزل";
      if (currentDayData.story.toLowerCase().includes("school")) loc = "المدرسة (School)";
      else if (currentDayData.story.toLowerCase().includes("house") || currentDayData.story.toLowerCase().includes("home")) loc = "المنزل (Home)";
      else if (currentDayData.story.toLowerCase().includes("park")) loc = "الحديقة (Park)";
      else if (currentDayData.story.toLowerCase().includes("market")) loc = "السوق (Market)";
      
      clueDisplayText.innerHTML = `🗺️ <strong>موقع أحداث القصة:</strong> تدور أحداث قصة اليوم في: <span style="color:#d97706; font-weight:700;">${loc}</span>.`;
    };
  }
  
  if (clueBtnKey) {
    clueBtnKey.onclick = (e) => {
      clueDisplayBox.classList.remove("hidden");
      const secretKeyActionKey = `secret_key_day_${currentDayData.day}`;
      const awarded = awardXpOnce(secretKeyActionKey, 25, "عثرت على مفتاح الـ XP السري 🔑", e.target);
      if (awarded) {
        clueDisplayText.innerHTML = `🔑 <strong>رائع جداً!</strong> لقد كشفت مفتاح الدرس السري وحصلت على <strong>+25 XP</strong>! 🌟`;
        showToast("🔑 تم كشف المفتاح السري! (+25 XP)");
      } else {
        clueDisplayText.innerHTML = `🔑 <strong>المفتاح السري:</strong> لقد كشفت مفتاح هذا الدرس مسبقاً! واصل استكشاف باقي الأنشطة.`;
      }
    };
  }
  
  if (clueCloseBtn) {
    clueCloseBtn.onclick = () => {
      clueDisplayBox.classList.add("hidden");
    };
  }
}

// Memory Cloze Filter Functionality
function applyMemoryClozeFilter(pct) {
  clozePercentage = pct;
  const clozeBtns = document.querySelectorAll(".cloze-btn");
  clozeBtns.forEach(btn => {
    const val = parseInt(btn.getAttribute("data-cloze"), 10);
    if (val === pct) btn.classList.add("active");
    else btn.classList.remove("active");
  });
  
  const words = storyTextView.querySelectorAll(".story-word");
  words.forEach((w, idx) => {
    w.classList.remove("cloze-hidden");
    if (pct === 50 && idx % 2 === 1) {
      w.classList.add("cloze-hidden");
    } else if (pct === 100) {
      w.classList.add("cloze-hidden");
    }
  });
}

// Mode Switcher Navigation Setup
function setupGameModeNavigation() {
  const questModesNav = document.getElementById("quest-modes-nav");
  if (!questModesNav) return;
  
  const modeBtns = questModesNav.querySelectorAll(".mode-chip-btn");
  modeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modeBtns.forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      
      activeGameMode = btn.getAttribute("data-mode");
      renderActiveGameMode();
    });
  });

  // Cloze Buttons in Reader Toolbar
  const clozeBtns = document.querySelectorAll(".cloze-btn");
  clozeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      const pct = parseInt(btn.getAttribute("data-cloze"), 10);
      applyMemoryClozeFilter(pct);
    });
  });
}

// Master Active Game Mode Renderer
function renderActiveGameMode() {
  const gameModeArena = document.getElementById("game-mode-arena");
  const storyBoardBlock = document.getElementById("story-board-block");
  const quizSectionBlock = document.getElementById("quiz-section-block");
  const targetWordsCard = document.querySelector(".target-words-card");
  
  if (!gameModeArena || !storyBoardBlock) return;
  
  // Clear any running timers
  if (speedTimerInterval) clearInterval(speedTimerInterval);
  if (oneGlanceInterval) clearInterval(oneGlanceInterval);
  
  if (activeGameMode === "reader") {
    gameModeArena.classList.add("hidden");
    storyBoardBlock.classList.remove("hidden");
    if (quizSectionBlock) quizSectionBlock.classList.remove("hidden");
    if (targetWordsCard) targetWordsCard.classList.remove("hidden");
    return;
  }
  
  gameModeArena.classList.remove("hidden");
  storyBoardBlock.classList.add("hidden");
  if (quizSectionBlock) quizSectionBlock.classList.add("hidden");
  if (targetWordsCard) targetWordsCard.classList.add("hidden");
  
  const currentDayData = challengeData[currentDayIndex];
  
  switch (activeGameMode) {
    case "detective":
      renderDetectiveMode(gameModeArena, currentDayData);
      break;
    case "hidden_objects":
      renderHiddenObjectsMode(gameModeArena, currentDayData);
      break;
    case "highlight":
      renderHighlightMode(gameModeArena, currentDayData);
      break;
    case "speed":
      renderSpeedReadingMode(gameModeArena, currentDayData);
      break;
    case "puzzle":
      renderStoryPuzzleMode(gameModeArena, currentDayData);
      break;
    case "oneglance":
      renderOneGlanceMode(gameModeArena, currentDayData);
      break;
    case "listenread":
      renderListenThenReadMode(gameModeArena, currentDayData);
      break;
    case "shadowing":
      renderShadowingMode(gameModeArena, currentDayData);
      break;
    case "mistakes":
      renderFindMistakeMode(gameModeArena, currentDayData);
      break;
    case "ending":
      renderChooseEndingMode(gameModeArena, currentDayData);
      break;
    case "readaloud":
      renderReadAloudMode(gameModeArena, currentDayData);
      break;
    case "memory":
      renderMemoryMode(gameModeArena, currentDayData);
      break;
    default:
      gameModeArena.classList.add("hidden");
      storyBoardBlock.classList.remove("hidden");
      if (quizSectionBlock) quizSectionBlock.classList.remove("hidden");
      break;
  }
}

/* --------------------------------------------------------------------------
   Game Mode 1: Detective Mode (وضع المحقق التفاعلي)
   -------------------------------------------------------------------------- */
function renderDetectiveMode(container, dayData) {
  const dictionary = dayData.dictionary || {};
  const storyLower = (dayData.story || "").toLowerCase();
  
  // Extract target words that actually exist in today's story text
  let validTargetWords = (dayData.target_words || []).filter(w => storyLower.includes(w.toLowerCase()));
  
  // If fewer than 3 target words found in text, backfill from dictionary words present in the story
  if (validTargetWords.length < 3) {
    const extraWords = Object.keys(dictionary).filter(w => 
      w.length > 2 && 
      storyLower.includes(w.toLowerCase()) && 
      !validTargetWords.map(vw => vw.toLowerCase()).includes(w.toLowerCase())
    );
    validTargetWords = validTargetWords.concat(extraWords);
  }

  // Prepare evidence clues list (top 3 guaranteed present words)
  const cluesToFind = validTargetWords.slice(0, 3).map((word, idx) => ({
    word: word.toLowerCase(),
    translation: dictionary[word.toLowerCase()] || dictionary[word] || word,
    found: false,
    id: idx
  }));

  const quizQ = (dayData.quiz && dayData.quiz[0]) ? dayData.quiz[0] : {
    question: `ما الإثبات الرئيسي المذكور في أحداث قضية اليوم ${dayData.day}؟`,
    options: [dayData.title, "الهروب من التحدي", "النوم طوال اليوم"],
    answer: 0
  };

  let foundCount = 0;

  container.innerHTML = `
    <div class="arena-card-title">
      <span>🕵️</span> <span>وضع المحقق التفاعلي (Interactive Detective Mode)</span>
    </div>
    <p class="arena-card-desc">أهلاً بك يا سيادة المحقق! أمامك ملف القضية رقم #${dayData.day}. اجمع الأدلة من نص القصة بالضغط على الكلمات، ثم أجب عن سؤال التحقيق لحسم القضية!</p>
    
    <!-- Detective Case File Box -->
    <div class="detective-case-box">
      <div class="detective-case-header">
        <div class="detective-badge">🔍 ملف القضية رقم #${dayData.day} • حالة الملف: قيد التحقيق الميداني</div>
        <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
          <div class="detective-progress-badge" id="detective-progress-text">الأدلة المفتشة: 0 / ${cluesToFind.length} 🔎</div>
          <button class="action-btn-primary focus-trigger-btn" id="btn-detective-focus-mode" title="تكبير وقراءة بثيم المحقق الخاص" style="background: linear-gradient(135deg, #d97706 0%, #b45309 100%) !important; box-shadow: 0 4px 12px rgba(217, 119, 6, 0.35) !important;">
            <span>🕵️</span>
            <span>تكبير وقراءة بدون مشتتات (ثيم المحقق)</span>
          </button>
        </div>
      </div>

      <!-- Detective Notebook / Clues Board -->
      <div class="detective-notebook">
        <div class="notebook-title">📓 مذكرة المحقق (الأدلة السرية المطلوب اكتشافها بالنص):</div>
        <div class="detective-clues-grid" id="detective-clues-container">
          ${cluesToFind.map(clue => `
            <div class="detective-clue-chip ${clue.found ? 'found' : ''}" id="detective-clue-${clue.id}">
              <span class="clue-status-icon">${clue.found ? '✅' : '❓'}</span>
              <span class="clue-word-tag">${clue.word}</span>
              <span class="clue-trans-tag">${clue.found ? `= ${clue.translation}` : '(اضغط الكلمة في القصة)'}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Detective Question & Verdict -->
      <div class="detective-interrogation-box">
        <div class="detective-question">❓ استجواب القضية: ${quizQ.question}</div>
        <div class="detective-options-grid" id="detective-opts-container">
          ${quizQ.options.map((opt, i) => `
            <button class="detective-opt-btn" data-idx="${i}">
              <span class="opt-inspect-icon">🔍</span>
              <span>${i + 1}. ${opt}</span>
            </button>
          `).join('')}
        </div>
        
        <div class="detective-actions-row">
          <button class="btn-secondary" id="btn-detective-hint" style="padding: 6px 14px; font-size: 0.88rem;">
            <span>💡 طلب تلميح من المساعد</span>
          </button>
        </div>
        <div id="detective-hint-box" class="detective-hint-callout hidden"></div>
      </div>
    </div>

    <!-- Story Text Inspector View -->
    <div class="story-board-wrapper">
      <div class="reader-toolbar">
        <span class="toolbar-tip">🔍 انقر على الكلمات داخل النص أدناه لجمع الأدلة وقراءتها (أو افتح "وضع القراءة بملء الشاشة 📖" لتفعيل كشاف المحقق):</span>
      </div>
      <article class="story-container" id="detective-story-view">
        ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
      </article>
    </div>
  `;

  // State counters for Smart Hints
  let wrongAttempts = 0;
  let nonClueClicks = 0;
  let hintBoxOpen = false;

  // Function to show/render Smart Hint
  function renderSmartHint(isAutoTrigger = false) {
    const hintBox = container.querySelector("#detective-hint-box");
    if (!hintBox) return;

    hintBox.classList.remove("hidden");
    hintBoxOpen = true;

    const unfoundClues = cluesToFind.filter(c => !c.found);
    const targetClue = unfoundClues[0];

    let contentHtml = "";
    if (targetClue) {
      contentHtml = `
        <div class="smart-hint-header">
          <span class="smart-hint-badge">🧠 تلميح ذكي ${isAutoTrigger ? '(مساعدة تلقائية)' : ''}</span>
          <div>ابحث في نص القصة عن الكلمة الإنجليزية <code style="color:#fbbf24; font-weight:800; font-size:1rem;">"${targetClue.word}"</code> والتي تعني بالفيلم/القصة (<b>${targetClue.translation}</b>).</div>
        </div>
        <div class="smart-hint-actions">
          <button class="btn-smart-action" id="btn-pulse-clue" title="تحديد موقع الكلمة بالنص">
            <span>✨ إضاءة الدليل بالنص</span>
          </button>
          <button class="btn-smart-action" id="btn-eliminate-opt" title="استبعاد إجابة غير صحيحة">
            <span>❌ استبعاد إجابة خاطئة</span>
          </button>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="smart-hint-header">
          <span class="smart-hint-badge">🧠 تلميح ذكي ${isAutoTrigger ? '(مساعدة تلقائية)' : ''}</span>
          <div>لقد عثرت على جميع الأدلة! السؤال يختبر استيعابك: <b>"${quizQ.question}"</b>. الإجابة الصحيحة هي الخيار رقم <b>${quizQ.answer + 1}</b> (<code>${quizQ.options[quizQ.answer]}</code>).</div>
        </div>
        <div class="smart-hint-actions">
          <button class="btn-smart-action" id="btn-eliminate-opt">
            <span>❌ استبعاد إجابة خاطئة</span>
          </button>
        </div>
      `;
    }

    hintBox.innerHTML = contentHtml;

    // Pulse clue button action
    const pulseBtn = hintBox.querySelector("#btn-pulse-clue");
    if (pulseBtn && targetClue) {
      pulseBtn.onclick = () => {
        const wordNodes = container.querySelectorAll("#detective-story-view .story-word, #detective-story-view .untranslated-word");
        let foundNode = null;
        wordNodes.forEach(node => {
          const txt = node.innerText.toLowerCase().replace(/[^a-z]/g, "").trim();
          if (txt === targetClue.word || txt.includes(targetClue.word) || targetClue.word.includes(txt)) {
            node.classList.add("clue-pulse-target");
            if (!foundNode) foundNode = node;
            setTimeout(() => node.classList.remove("clue-pulse-target"), 4000);
          }
        });
        if (foundNode) {
          foundNode.scrollIntoView({ behavior: "smooth", block: "center" });
          showToastNotification("✨ تم إضاءة الدليل!", `انظر إلى الكلمة المضيئة في نص القصة: "${targetClue.word}"`, "💡");
        }
      };
    }

    // Eliminate wrong option button action
    const elimBtn = hintBox.querySelector("#btn-eliminate-opt");
    if (elimBtn) {
      elimBtn.onclick = () => eliminateOneWrongOption();
    }
  }

  function eliminateOneWrongOption() {
    const optBtns = container.querySelectorAll(".detective-opt-btn");
    const wrongIndices = [];
    optBtns.forEach((btn, i) => {
      if (i !== quizQ.answer && !btn.classList.contains("wrong") && !btn.classList.contains("eliminated")) {
        wrongIndices.push({ btn, i });
      }
    });

    if (wrongIndices.length > 0) {
      const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
      pick.btn.classList.add("eliminated");
      pick.btn.innerHTML = `<span class="opt-inspect-icon">❌</span> <span style="text-decoration:line-through;">${pick.i + 1}. ${quizQ.options[pick.i]} (خيار مستبعد)</span>`;
      showToastNotification("❌ تم استبعاد خيار خاطئ!", `تم استبعاد الخيار رقم ${pick.i + 1} لمساعدتك على الإجابة!`, "💡");
    } else {
      showToast("💡 تم استبعاد جميع الخيارات الخاطئة المتاحة!");
    }
  }

  // Handle clicking words in story to inspect evidence
  const storyView = container.querySelector("#detective-story-view");
  if (storyView) {
    storyView.onclick = (e) => {
      const wordNode = e.target.closest(".story-word, .untranslated-word");
      if (!wordNode) return;
      
      const rawText = wordNode.innerText.trim();
      const wordText = rawText.toLowerCase().replace(/[^a-z]/g, "").trim();
      if (!wordText) return;

      // Speak word on inspect safely
      speakWord(wordText);

      // Also open dictionary tooltip if word is translated
      if (wordNode.classList.contains("story-word")) {
        openTooltip(wordNode);
      }

      // Check if word matches any unfound clue
      const matchingClue = cluesToFind.find(c => !c.found && (c.word === wordText || wordText.includes(c.word) || c.word.includes(wordText)));
      if (matchingClue) {
        matchingClue.found = true;
        foundCount++;
        
        // Update clue chip in notebook
        const clueChip = container.querySelector(`#detective-clue-${matchingClue.id}`);
        if (clueChip) {
          clueChip.classList.add("found");
          clueChip.querySelector(".clue-status-icon").innerText = "✅";
          const wordTag = clueChip.querySelector(".clue-word-tag");
          if (wordTag) wordTag.innerText = matchingClue.word;
          clueChip.querySelector(".clue-trans-tag").innerText = `= ${matchingClue.translation}`;
        }

        // Highlight word in story
        wordNode.classList.add("detective-found-clue");

        // Update progress
        const progressText = container.querySelector("#detective-progress-text");
        if (progressText) {
          progressText.innerText = `الأدلة المفتشة: ${foundCount} / ${cluesToFind.length} 🔎`;
        }

        const clueKey = `detective_clue_day_${dayData.day}_${matchingClue.word}`;
        const isNewXp = awardXpOnce(clueKey, 10, `اكتشاف دليل القضية (${matchingClue.word})`, e.target);
        if (isNewXp) {
          showToastNotification("🔎 تم اكتشاف دليل القضية!", `الدليل: ${matchingClue.word} (${matchingClue.translation}) (+10 XP)`, "🕵️");
        } else {
          showToastNotification("🔎 تم اكتشاف دليل القضية!", `الدليل: ${matchingClue.word} (${matchingClue.translation})`, "🕵️");
        }

        if (foundCount === cluesToFind.length) {
          triggerConfetti();
          showToastNotification("✨ تم جمع كافة الأدلة!", "ممتاز يا محقق! اجمع كل الأدلة وأجب على سؤال التحقيق.", "🏆");
        }
      } else {
        nonClueClicks++;
        const trans = dayData.dictionary[wordText] || dayData.dictionary[rawText.toLowerCase()] || "";
        showToastNotification(`🔍 تفقد الدليل: "${rawText}"`, trans ? `المعنى: ${trans}` : "كلمة في نص القضية", "🔎");

        // Auto trigger smart hint if user clicks multiple non-clue words and clues remain
        if (nonClueClicks >= 4 && cluesToFind.some(c => !c.found) && !hintBoxOpen) {
          renderSmartHint(true);
          showToastNotification("💡 تلميح ذكي تلقائي", "تم تفعيل التلميح الذكي لمساعدتك في العثور على الدليل المتبقي!", "🧠");
        }
      }
    };
  }

  // Handle Hint Button
  const hintBtn = container.querySelector("#btn-detective-hint");
  if (hintBtn) {
    hintBtn.onclick = () => {
      renderSmartHint(false);
      showToastNotification("💡 التلميحات الذكية", "تم تفعيل لوحة التلميح الذكي مع خيارات المساعدة الميدانية!", "🧠");
    };
  }

  // Handle Option Buttons (Verdict)
  const optBtns = container.querySelectorAll(".detective-opt-btn");
  optBtns.forEach(btn => {
    btn.onclick = (e) => {
      if (btn.classList.contains("eliminated")) return;
      const idx = parseInt(btn.getAttribute("data-idx"), 10);
      if (idx === quizQ.answer) {
        btn.classList.add("correct");
        playCorrectAnswerSound();
        const verdictKey = `detective_verdict_day_${dayData.day}`;
        const isNewXp = awardXpOnce(verdictKey, 25, "حسم قضية المحقق بنجاح 🏆", e.target);
        if (isNewXp) {
          showToast("🏆 قضية مغلقة! أحسنت يا سيادة المحقق! لقد أصدرت الحكم الصحيح وتم إغلاق الملف! (+25 XP)");
        } else {
          showToast("🏆 قضية مغلقة! أحسنت يا سيادة المحقق! تم حسم قضية هذا الدرس سابقاً.");
        }
        triggerConfetti();

        // Update case header badge
        const caseHeader = container.querySelector(".detective-badge");
        if (caseHeader) {
          caseHeader.innerHTML = "🏆 ملف القضية رقم #" + dayData.day + " • تم إغلاق القضية بنجاح 🏅";
          caseHeader.style.color = "#4ade80";
        }
      } else {
        btn.classList.add("wrong");
        playIncorrectAnswerSound();
        wrongAttempts++;
        showToast("❌ استنتاج غير دقيق يا محقق! ادرس الأدلة في القصة وحاول مجدداً.");

        // Smart Hint Trigger on struggle (2 wrong attempts)
        if (wrongAttempts >= 2) {
          renderSmartHint(true);
          eliminateOneWrongOption();
          showToastNotification("💡 تلميح ذكي تلقائي", "لاحظنا صعوبة في الاستنتاج! تم استبعاد خيار خاطئ وتفعيل لوحة التلميحات الذكية.", "🧠");
        }
      }
    };
  });
}

/* --------------------------------------------------------------------------
   Game Mode 2: Hidden Objects (البحث عن العناصر والمعلومات)
   -------------------------------------------------------------------------- */
function renderHiddenObjectsMode(container, dayData) {
  // Extract names, places, verbs or target words
  const objectsToFind = [
    { label: "اسم شخص 👤", target: dayData.target_words[0] || "sami", found: false },
    { label: "كلمة هدف 🎯", target: dayData.target_words[1] || "friend", found: false },
    { label: "اسم مفردة 📖", target: dayData.target_words[2] || "school", found: false }
  ];
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🔍</span> <span>تحدي البحث عن العناصر (Hidden Objects)</span>
    </div>
    <p class="arena-card-desc">انقر على الكلمات المطلوبة في القصة أدناه لإضافتها لقائمة العناصر المكتشفة وجني المكافآت!</p>
    
    <div class="hidden-objects-bar">
      <div style="font-family:var(--font-arabic); font-weight:800; font-size:0.95rem; color:var(--rh-ink);">🎯 قائمه الكلمات المطلوبة:</div>
      <div class="objects-checklist" id="objects-chips-container">
        ${objectsToFind.map((obj, i) => `
          <div class="object-item-chip" id="obj-chip-${i}">
            <span>${obj.label}</span> (<code style="color:#214ecf;">${obj.target}</code>)
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="story-board-wrapper">
      <article class="story-container" id="hidden-obj-story-view">
        ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
      </article>
    </div>
  `;
  
  const storyView = container.querySelector("#hidden-obj-story-view");
  storyView.onclick = (e) => {
    const wordNode = e.target.closest(".story-word");
    if (!wordNode) return;
    
    const wordText = wordNode.innerText.toLowerCase().trim();
    
    objectsToFind.forEach((obj, i) => {
      if (!obj.found && (wordText.includes(obj.target.toLowerCase()) || obj.target.toLowerCase().includes(wordText))) {
        obj.found = true;
        wordNode.classList.add("hl-verb");
        const chip = container.querySelector(`#obj-chip-${i}`);
        if (chip) chip.classList.add("found");
        
        const objKey = `hidden_obj_day_${dayData.day}_${obj.target.toLowerCase()}`;
        const isNewXp = awardXpOnce(objKey, 15, `اكتشاف عنصر: ${obj.target}`, wordNode);
        if (isNewXp) {
          showToast(`🔍 رائع! عثرت على الكلمة المطلوبة: ${obj.target} (+15 XP)`);
        } else {
          showToast(`🔍 رائع! عثرت على الكلمة المطلوبة: ${obj.target}`);
        }
      }
    });
  };
}

/* --------------------------------------------------------------------------
   Game Mode 3: Highlight Challenge (تحدي التظليل)
   -------------------------------------------------------------------------- */
function renderHighlightMode(container, dayData) {
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🖍️</span> <span>تحدي التظليل والتصنيف (Highlight Challenge)</span>
    </div>
    <p class="arena-card-desc">اختر أداة التظليل بالأعلى ثم انقر على الكلمات في النص لتظليل الأسماء، الأفعال، أو الصفات كالمحترفين!</p>
    
    <div class="clues-buttons-group" style="margin-bottom:16px;">
      <button class="mode-chip-btn active" id="hl-tool-noun" style="background:#bfdbfe; color:#1e3a8a; border-color:#3b82f6;">
        🟦 الأسماء (Nouns)
      </button>
      <button class="mode-chip-btn" id="hl-tool-verb" style="background:#bbf7d0; color:#14532d; border-color:#22c55e;">
        🟩 الأفعال (Verbs)
      </button>
      <button class="mode-chip-btn" id="hl-tool-adj" style="background:#fef08a; color:#713f12; border-color:#eab308;">
        🟨 الصفات (Adjectives)
      </button>
    </div>
    
    <div class="story-board-wrapper">
      <article class="story-container" id="hl-story-view">
        ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
      </article>
    </div>
  `;
  
  let currentTool = "noun";
  const btnN = container.querySelector("#hl-tool-noun");
  const btnV = container.querySelector("#hl-tool-verb");
  const btnA = container.querySelector("#hl-tool-adj");
  
  const setTool = (tool, activeBtn) => {
    currentTool = tool;
    [btnN, btnV, btnA].forEach(b => b.style.opacity = "0.6");
    activeBtn.style.opacity = "1";
  };
  
  btnN.onclick = () => setTool("noun", btnN);
  btnV.onclick = () => setTool("verb", btnV);
  btnA.onclick = () => setTool("adj", btnA);
  setTool("noun", btnN);
  
  const storyView = container.querySelector("#hl-story-view");
  storyView.onclick = (e) => {
    const wordNode = e.target.closest(".story-word");
    if (!wordNode) return;
    
    const wText = wordNode.innerText;
    const pos = getPartOfSpeech(wText);
    
    wordNode.classList.remove("hl-noun", "hl-verb", "hl-adj");
    const hlKey = `highlight_day_${dayData.day}_${wText.toLowerCase().trim()}`;
    if (currentTool === "noun" && pos.includes("noun")) {
      wordNode.classList.add("hl-noun");
      awardXpOnce(hlKey, 5, "تظليل اسم صحيح", wordNode);
    } else if (currentTool === "verb" && pos.includes("verb")) {
      wordNode.classList.add("hl-verb");
      awardXpOnce(hlKey, 5, "تظليل فعل صحيح", wordNode);
    } else if (currentTool === "adj" && pos.includes("adjective")) {
      wordNode.classList.add("hl-adj");
      awardXpOnce(hlKey, 5, "تظليل صفة صحيحة", wordNode);
    } else {
      showToast(`💡 الكلمة "${wText}" صُنفت كـ: ${pos}`);
    }
  };
}

/* --------------------------------------------------------------------------
   Game Mode 4: Speed Reading (تحدي سرعة القراءة WPM)
   -------------------------------------------------------------------------- */
function renderSpeedReadingMode(container, dayData) {
  speedSeconds = 0;
  speedRunning = false;
  const wordCount = dayData.story.split(/\s+/).length;
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>⚡</span> <span>تحدي سرعة القراءة (Speed Reading)</span>
    </div>
    <p class="arena-card-desc">انقر على "ابدأ التحدي" لقياس سرعة قراءتك بالكلمات في الدقيقة (WPM) ونيل أوسمة الطلاقة!</p>
    
    <div class="speed-reading-dashboard">
      <div class="speed-timer-display" id="speed-timer-num">00:00</div>
      <button class="btn-primary" id="btn-speed-toggle">
        <span>ابدأ قراءة القصة ⏱️</span>
      </button>
      <div id="speed-result-badge" class="hidden"></div>
    </div>
    
    <div class="story-board-wrapper hidden" id="speed-story-block" style="margin-top:20px;">
      <article class="story-container">
        ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
      </article>
    </div>
  `;
  
  const btnToggle = container.querySelector("#btn-speed-toggle");
  const timerNum = container.querySelector("#speed-timer-num");
  const storyBlock = container.querySelector("#speed-story-block");
  const resultBadge = container.querySelector("#speed-result-badge");
  
  btnToggle.onclick = () => {
    if (!speedRunning) {
      speedRunning = true;
      speedSeconds = 0;
      storyBlock.classList.remove("hidden");
      btnToggle.innerHTML = "<span>أنهيت القراءة! 🎯</span>";
      btnToggle.style.background = "#15803d";
      
      speedTimerInterval = setInterval(() => {
        speedSeconds++;
        const mins = Math.floor(speedSeconds / 60).toString().padStart(2, '0');
        const secs = (speedSeconds % 60).toString().padStart(2, '0');
        timerNum.innerText = `${mins}:${secs}`;
      }, 1000);
    } else {
      speedRunning = false;
      clearInterval(speedTimerInterval);
      btnToggle.classList.add("hidden");
      
      const wpm = Math.round((wordCount / Math.max(speedSeconds, 1)) * 60);
      let rating = "طلاقة رائعة! ⚡";
      if (wpm > 120) rating = "سرعة خارقة! 🚀";
      else if (wpm < 50) rating = "قراءة هادئة ومتأنية 🌱";
      
      resultBadge.classList.remove("hidden");
      const speedKey = `speed_reading_day_${dayData.day}`;
      const isNewXp = awardXpOnce(speedKey, 25, "إكمال تحدي سرعة القراءة", timerNum);
      if (isNewXp) {
        resultBadge.innerHTML = `
          <div class="speed-wpm-badge">${wpm} WPM • ${rating}</div>
          <div style="font-family:var(--font-arabic); font-size:0.95rem; margin-top:10px; color:var(--rh-ink);">
            قرأت ${wordCount} كلمة في ${speedSeconds} ثانية! حصلت على <strong>+25 XP</strong>
          </div>
        `;
        showToast(`⚡ إنجاز ممتاز! سرعة القراءة: ${wpm} WPM (+25 XP)`);
      } else {
        resultBadge.innerHTML = `
          <div class="speed-wpm-badge">${wpm} WPM • ${rating}</div>
          <div style="font-family:var(--font-arabic); font-size:0.95rem; margin-top:10px; color:var(--rh-ink);">
            قرأت ${wordCount} كلمة في ${speedSeconds} ثانية!
          </div>
        `;
        showToast(`⚡ إنجاز ممتاز! سرعة القراءة: ${wpm} WPM`);
      }
    }
  };
}

/* --------------------------------------------------------------------------
   Game Mode 5: Story Puzzle (ترتيب أحداث القصة - Timeline Ordering)
   -------------------------------------------------------------------------- */
function renderStoryPuzzleMode(container, dayData) {
  const rawSentences = dayData.story.split(/(?<=[.!?])\s+/).filter(s => s.trim().length > 0);
  const targetWords = dayData.target_words || [];

  let puzzleItems = rawSentences.map((s, idx) => {
    let formattedSentence = s.trim();
    targetWords.forEach(tw => {
      if (tw && tw.trim()) {
        const escaped = tw.trim().replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
        const reg = new RegExp(`\\b(${escaped})\\b`, 'gi');
        formattedSentence = formattedSentence.replace(reg, '<mark class="target-word-hl">$1</mark>');
      }
    });
    return { text: formattedSentence, rawText: s.trim(), origIdx: idx };
  });

  // Function to shuffle array avoiding initial correct match if possible
  const shuffleItems = () => {
    if (puzzleItems.length > 1) {
      let attempts = 0;
      while (attempts < 15) {
        puzzleItems.sort(() => Math.random() - 0.5);
        const isStillOrder = puzzleItems.every((item, idx) => item.origIdx === idx);
        if (!isStillOrder) break;
        attempts++;
      }
    }
  };

  shuffleItems();
  
  let showStoryHint = false;
  let isChecked = false;

  const renderContent = () => {
    const correctCount = puzzleItems.filter((item, idx) => item.origIdx === idx).length;
    const totalCount = puzzleItems.length;

    container.innerHTML = `
      <div class="arena-card-header" style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:14px;">
        <div class="arena-card-title" style="margin-bottom:0;">
          <span style="font-size:1.4rem;">⏳</span> <span>مُسار أحداث القصة (Timeline Sequence)</span>
        </div>
        <div class="timeline-score-badge" style="font-size:0.9rem; font-weight:700; color:#1e40af; background:#dbeafe; padding:6px 14px; border-radius:20px; border:1px solid #bfdbfe;">
          دقة الترتيب: <span>${correctCount} / ${totalCount}</span> ${correctCount === totalCount ? '🎉' : '⏱️'}
        </div>
      </div>
      
      <p class="arena-card-desc" style="margin-bottom:14px; color:#475569;">
        اسحب وأسقط الكروت أو استخدم أسهم التوجيه ⬆️ ⬇️ لترتيب أحداث القصة من البداية حتى النهاية.
      </p>

      <!-- Action Toolbar -->
      <div class="timeline-toolbar" style="display:flex; gap:10px; flex-wrap:wrap; margin-bottom:16px;">
        <button class="btn-secondary" id="btn-toggle-story-hint" style="padding:7px 14px; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px;">
          <span>${showStoryHint ? '🙈' : '📖'}</span> <span>${showStoryHint ? 'إخفاء النص الأصلي' : 'تلميح القصة الأصلية'}</span>
        </button>
        <button class="btn-secondary" id="btn-shuffle-puzzle" style="padding:7px 14px; font-size:0.88rem; display:inline-flex; align-items:center; gap:6px; background:#f1f5f9;">
          <span>🔀</span> <span>إعادة الخلط</span>
        </button>
      </div>

      ${showStoryHint ? `
        <div class="story-hint-card" style="background:#f8fafc; border:1px dashed #94a3b8; border-radius:12px; padding:14px 18px; margin-bottom:16px; font-size:0.96rem; line-height:1.7; color:#1e293b;">
          <strong style="color:#0f172a; display:block; margin-bottom:6px;">📖 نص القصة الأصلي للمساعدة:</strong>
          ${dayData.story}
        </div>
      ` : ''}

      <!-- Interactive Timeline List -->
      <div class="timeline-flow-wrapper" id="puzzle-timeline-wrapper">
        <div class="timeline-connector-line"></div>
        <div class="puzzle-sentences-list" id="puzzle-list-container">
          ${renderPuzzleTimelineItems(puzzleItems, isChecked)}
        </div>
      </div>
      
      <button class="btn-primary" id="btn-check-puzzle" style="margin-top:16px; width:100%; padding:12px; font-size:1.05rem; font-weight:700;">
        <span>تحقق من ترتيب القصة 🎯</span>
      </button>
    `;

    bindPuzzleControls(container, puzzleItems, rawSentences, dayData, renderContent, () => {
      isChecked = true;
      renderContent();
    }, () => {
      shuffleItems();
      isChecked = false;
      renderContent();
    }, () => {
      showStoryHint = !showStoryHint;
      renderContent();
    });
  };

  renderContent();
}

function renderPuzzleTimelineItems(items, isChecked) {
  return items.map((item, i) => {
    const isCorrectPos = item.origIdx === i;
    let cardStatusClass = '';
    if (isChecked) {
      cardStatusClass = isCorrectPos ? 'status-correct' : 'status-wrong';
    } else if (isCorrectPos) {
      cardStatusClass = 'status-matched';
    }

    return `
      <div class="puzzle-timeline-card ${cardStatusClass}" data-idx="${i}" data-orig="${item.origIdx}" draggable="true">
        <div class="timeline-badge">${i + 1}</div>
        <div class="timeline-drag-handle" title="اسحب للترتيب">⋮⋮</div>
        <div class="timeline-text-content">
          ${item.text}
        </div>
        ${isChecked ? (isCorrectPos 
          ? '<div class="timeline-status-tag tag-correct">✓ صحيحة</div>' 
          : '<div class="timeline-status-tag tag-wrong">✕ موقّع خاطئ</div>') : ''}
        <div class="puzzle-card-actions">
          <button class="puzzle-move-btn btn-up" ${i === 0 ? 'disabled style="opacity:0.25"' : ''} title="تحريك للأعلى">▲</button>
          <button class="puzzle-move-btn btn-down" ${i === items.length - 1 ? 'disabled style="opacity:0.25"' : ''} title="تحريك الأسفل">▼</button>
        </div>
      </div>
    `;
  }).join('');
}

function bindPuzzleControls(container, puzzleItems, rawSentences, dayData, renderContent, onCheck, onShuffle, onToggleHint) {
  const listContainer = container.querySelector("#puzzle-list-container");
  const checkBtn = container.querySelector("#btn-check-puzzle");
  const hintToggleBtn = container.querySelector("#btn-toggle-story-hint");
  const shuffleBtn = container.querySelector("#btn-shuffle-puzzle");

  if (hintToggleBtn) {
    hintToggleBtn.onclick = onToggleHint;
  }

  if (shuffleBtn) {
    shuffleBtn.onclick = onShuffle;
  }

  // Bind ▲ / ▼ Move Buttons
  listContainer.querySelectorAll(".puzzle-timeline-card").forEach((card, i) => {
    const btnUp = card.querySelector(".btn-up");
    const btnDown = card.querySelector(".btn-down");

    if (btnUp) {
      btnUp.onclick = (e) => {
        e.stopPropagation();
        if (i > 0) {
          const temp = puzzleItems[i];
          puzzleItems[i] = puzzleItems[i - 1];
          puzzleItems[i - 1] = temp;
          renderContent();
        }
      };
    }

    if (btnDown) {
      btnDown.onclick = (e) => {
        e.stopPropagation();
        if (i < puzzleItems.length - 1) {
          const temp = puzzleItems[i];
          puzzleItems[i] = puzzleItems[i + 1];
          puzzleItems[i + 1] = temp;
          renderContent();
        }
      };
    }
  });

  // Native Drag and Drop Logic
  let draggedIndex = null;

  listContainer.querySelectorAll(".puzzle-timeline-card").forEach((card) => {
    card.addEventListener("dragstart", (e) => {
      draggedIndex = parseInt(card.getAttribute("data-idx"), 10);
      card.classList.add("dragging");
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", draggedIndex);
    });

    card.addEventListener("dragend", () => {
      card.classList.remove("dragging");
      listContainer.querySelectorAll(".puzzle-timeline-card").forEach(c => c.classList.remove("drag-over"));
    });

    card.addEventListener("dragover", (e) => {
      e.preventDefault();
      card.classList.add("drag-over");
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over");
    });

    card.addEventListener("drop", (e) => {
      e.preventDefault();
      card.classList.remove("drag-over");
      const targetIndex = parseInt(card.getAttribute("data-idx"), 10);
      if (draggedIndex !== null && draggedIndex !== targetIndex) {
        const draggedItem = puzzleItems[draggedIndex];
        puzzleItems.splice(draggedIndex, 1);
        puzzleItems.splice(targetIndex, 0, draggedItem);
        renderContent();
      }
    });
  });

  if (checkBtn) {
    checkBtn.onclick = (e) => {
      onCheck();
      const isCorrect = puzzleItems.every((item, idx) => item.origIdx === idx);
      if (isCorrect) {
        playCorrectAnswerSound();
        const puzzleKey = `story_puzzle_day_${dayData.day}`;
        const isNewXp = awardXpOnce(puzzleKey, 30, "حل لغز ترتيب القصة", e.target);
        if (isNewXp) {
          showToast("🎉 ممتاز جداً! اكتمل ترتيب القصة بالشكل الصحيح 100%! (+30 XP)");
        } else {
          showToast("🎉 ممتاز جداً! اكتمل ترتيب القصة بالشكل الصحيح 100%!");
        }
        triggerConfetti();
      } else {
        playIncorrectAnswerSound();
        const correctCount = puzzleItems.filter((item, idx) => item.origIdx === idx).length;
        showToast(`❌ الترتيب يضم بعض الأخطاء (${correctCount} من ${puzzleItems.length} في موقعها الصحيح). أعد تحريك الكروت ذات العلامة الحمراء!`);
      }
    };
  }
}

/* --------------------------------------------------------------------------
   Game Mode 6: One Glance (نظرة واحدة - تحدي الذاكرة السريعة)
   -------------------------------------------------------------------------- */
function renderOneGlanceMode(container, dayData) {
  oneGlanceSeconds = 7;
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>👁️</span> <span>تحدي النظرة الواحدة (One Glance Challenge)</span>
    </div>
    <p class="arena-card-desc">سوف يتم إخفاء القصة بعد 7 ثوانٍ فقط! ركّز جيداً ثم أجب عن أسئلة الذاكرة.</p>
    
    <div class="oneglance-flash-box" id="oneglance-box">
      <div class="oneglance-timer-ring" id="oneglance-ring">⏳ 7 ثوانٍ</div>
      <article class="story-container" id="oneglance-text">
        ${dayData.story}
      </article>
    </div>
    
    <div class="hidden" id="oneglance-quiz-block">
      <div class="detective-case-box">
        <div class="detective-badge">اختبار الذاكرة السريعة 🧠</div>
        <div class="detective-question">سؤال الذاكرة: ما هي الكلمة الرئيسية المستهدفة اليوم؟</div>
        <div class="detective-options-grid">
          <button class="detective-opt-btn og-opt" data-correct="true">${dayData.target_words[0] || 'Friend'}</button>
          <button class="detective-opt-btn og-opt" data-correct="false">Doctor</button>
          <button class="detective-opt-btn og-opt" data-correct="false">Car</button>
        </div>
      </div>
    </div>
  `;
  
  const ring = container.querySelector("#oneglance-ring");
  const textElem = container.querySelector("#oneglance-text");
  const quizBlock = container.querySelector("#oneglance-quiz-block");
  
  oneGlanceInterval = setInterval(() => {
    oneGlanceSeconds--;
    if (ring) ring.innerText = `⏳ ${oneGlanceSeconds} ثوانٍ`;
    
    if (oneGlanceSeconds <= 0) {
      clearInterval(oneGlanceInterval);
      if (textElem) {
        textElem.innerHTML = "<div style='font-size:1.5rem; padding:20px; color:#fde68a;'>🙈 اختفى النص! حان وقت اختبار ذاكرتك Visual Memory</div>";
      }
      if (quizBlock) quizBlock.classList.remove("hidden");
    }
  }, 1000);
  
  container.querySelectorAll(".og-opt").forEach(btn => {
    btn.onclick = (e) => {
      if (btn.getAttribute("data-correct") === "true") {
        btn.classList.add("correct");
        playCorrectAnswerSound();
        const glanceKey = `one_glance_day_${dayData.day}`;
        const isNewXp = awardXpOnce(glanceKey, 20, "اجتياز تحدي النظرة الواحدة", e.target);
        if (isNewXp) {
          showToast("👁️ قوة ملاحظة ممتازة! إجابة صحيحة من الذاكرة (+20 XP)");
        } else {
          showToast("👁️ قوة ملاحظة ممتازة! إجابة صحيحة من الذاكرة");
        }
      } else {
        btn.classList.add("wrong");
        playIncorrectAnswerSound();
      }
    };
  });
}

/* --------------------------------------------------------------------------
   Game Mode 7: Listen then Read (استمع ثم اقرأ)
   -------------------------------------------------------------------------- */
function renderListenThenReadMode(container, dayData) {
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🎧</span> <span>استمع ثم اقرأ (Listen then Read)</span>
    </div>
    <p class="arena-card-desc">المرحلة الأولى: استمع للصوت أولاً قبل إظهار النص، ثم حدد المفردات التي سمعتها.</p>
    
    <div class="speed-reading-dashboard" style="background:#0f172a; color:#ffffff;">
      <button class="btn-primary" id="btn-audio-only" style="background:var(--rh-blue);">
        <span>تشغيل الصوت فقط 🎧</span>
      </button>
      <div class="mic-wave-container" id="listen-wave-container" style="margin-top:16px;">
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
      </div>
    </div>
    
    <div class="hidden" id="listen-text-reveal" style="margin-top:20px;">
      <div class="detective-case-box">
        <div class="detective-question">سؤال الاستماع: ما الكلمة الأساسية التي سمعتها في البداية؟</div>
        <div class="detective-options-grid">
          <button class="detective-opt-btn lr-opt" data-correct="true">${dayData.target_words[0] || 'Hello'}</button>
          <button class="detective-opt-btn lr-opt" data-correct="false">Goodbye</button>
        </div>
      </div>
      <div class="story-board-wrapper">
        <article class="story-container">
          ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
        </article>
      </div>
    </div>
  `;
  
  const btnAudio = container.querySelector("#btn-audio-only");
  const wave = container.querySelector("#listen-wave-container");
  const textReveal = container.querySelector("#listen-text-reveal");
  
  btnAudio.onclick = () => {
    if (synth) {
      synth.cancel();
      const utt = new SpeechSynthesisUtterance(correctTextForSpeech(dayData.story));
      utt.lang = 'en-US';
      utt.rate = 0.85;
      
      wave.classList.add("active");
      utt.onend = () => {
        wave.classList.remove("active");
        textReveal.classList.remove("hidden");
        showToast("🎧 اكتمل الاستماع! يمكنك الآن قراءة النص والتأكد.");
      };
      
      synth.speak(utt);
    }
  };
  
  container.querySelectorAll(".lr-opt").forEach(btn => {
    btn.onclick = (e) => {
      if (btn.getAttribute("data-correct") === "true") {
        btn.classList.add("correct");
        playCorrectAnswerSound();
        const listenReadKey = `listen_read_day_${dayData.day}`;
        const isNewXp = awardXpOnce(listenReadKey, 20, "استماع دقيق", e.target);
        if (isNewXp) {
          showToast("🎧 استماع دقيق ورائع! (+20 XP)");
        } else {
          showToast("🎧 استماع دقيق ورائع!");
        }
      } else {
        btn.classList.add("wrong");
        playIncorrectAnswerSound();
      }
    };
  });
}

/* --------------------------------------------------------------------------
   Game Mode 7.5: Shadowing Practice (نمط التظليل والمحاكاة الصوتية)
   -------------------------------------------------------------------------- */
function renderShadowingMode(container, dayData) {
  // Split story into sentences
  const rawSentences = (dayData.story || "").match(/[^.!?]+[.!?]+/g);
  const storySentences = (rawSentences && rawSentences.length > 0) ? rawSentences : [dayData.story];
  let currentSentenceIdx = 0;
  let selectedSpeed = 0.75;

  const renderShadowingContent = () => {
    const totalSentences = storySentences.length;
    const rawSentence = storySentences[currentSentenceIdx] || dayData.story;
    const sentenceWords = rawSentence.trim().split(/\s+/);

    container.innerHTML = `
      <div class="arena-card-title">
        <span>🗣️</span> <span>نمط التظليل والمحاكاة الفورية (Shadowing Mode)</span>
      </div>
      <p class="arena-card-desc">
        تقنية <strong>Shadowing</strong> العالمية: استمع للنموذج الصوتي وكرر خلف المتحدث <u>فوراً في نفس اللحظة</u> بمحاكاة نبرته وسرعته لرفع الطلاقة وسرعة التحدث!
      </p>

      <!-- Sentence Navigation & Settings Toolbar -->
      <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px; margin-bottom:16px; background:rgba(255,255,255,0.04); padding:10px 14px; border-radius:var(--radius-sm); border:1px solid rgba(255,255,255,0.08);">
        <div style="font-family:var(--font-arabic); font-weight:700; color:#38bdf8;">
          📌 الجملة <span id="shadow-sent-num">${currentSentenceIdx + 1}</span> من ${totalSentences}
        </div>
        
        <!-- Speed Controls -->
        <div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
          <span style="font-size:0.85rem; color:#94a3b8; font-weight:600;">سرعة النطق:</span>
          <button class="cloze-btn ${selectedSpeed === 0.5 ? 'active' : ''}" data-speed="0.5" style="padding:3px 10px; font-size:0.8rem;">🐢 بطيء 0.5x</button>
          <button class="cloze-btn ${selectedSpeed === 0.75 ? 'active' : ''}" data-speed="0.75" style="padding:3px 10px; font-size:0.8rem;">⚡ متوسط 0.75x</button>
          <button class="cloze-btn ${selectedSpeed === 1 ? 'active' : ''}" data-speed="1" style="padding:3px 10px; font-size:0.8rem;">🚀 طبيعي 1x</button>
        </div>
      </div>

      <!-- Active Sentence Display with Word-by-Word Highlighting -->
      <div class="story-board-wrapper" style="margin-bottom:18px;">
        <article class="story-container" id="shadowing-sentence-box" style="font-size:1.35rem; line-height:2.1; text-align:center; padding:24px 18px;">
          ${sentenceWords.map((word, i) => `<span class="shadow-word" id="shadow-w-${i}" style="transition:all 0.2s ease; display:inline-block; margin:0 3px; padding:2px 6px; border-radius:4px;">${prepareStoryWordsHtml(word, dayData.dictionary)}</span>`).join('')}
        </article>
      </div>

      <!-- Action Controls -->
      <div style="display:flex; gap:12px; justify-content:center; align-items:center; flex-wrap:wrap; margin-bottom:16px;">
        <button class="btn-primary" id="btn-start-shadowing" style="font-size:1rem; padding:10px 24px; background:#0284c7; display:flex; align-items:center; gap:8px;">
          <span>🗣️ تشغيل وتظليل الجملة (Shadow Now)</span>
        </button>
        <button class="btn-secondary" id="btn-next-sentence" style="font-size:0.95rem; padding:10px 18px;" ${currentSentenceIdx >= totalSentences - 1 ? 'disabled' : ''}>
          <span>الجملة التالية ➡️</span>
        </button>
      </div>

      <!-- Audio & Mic Visualizer -->
      <div class="mic-wave-container" id="shadow-wave-visualizer" style="margin-top:12px;">
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
      </div>

      <div style="font-family:var(--font-arabic); font-size:0.9rem; text-align:center; color:#94a3b8; margin-top:10px;" id="shadow-status-hint">
        💡 نصيحة التظليل: لا تنتظر حتى تنتهي الجملة، كرر الكلمات فور سماعها في نفس اللحظة!
      </div>

      <div id="shadowing-feedback-box" class="hidden" style="margin-top:16px; text-align:center;"></div>
    `;

    // Speed button handlers
    container.querySelectorAll("[data-speed]").forEach(btn => {
      btn.onclick = () => {
        selectedSpeed = parseFloat(btn.getAttribute("data-speed"));
        container.querySelectorAll("[data-speed]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
      };
    });

    // Sentence nav handlers
    const nextBtn = container.querySelector("#btn-next-sentence");
    if (nextBtn && currentSentenceIdx < totalSentences - 1) {
      nextBtn.onclick = () => {
        if (window.speechSynthesis) window.speechSynthesis.cancel();
        currentSentenceIdx++;
        renderShadowingContent();
      };
    }

    // Start Shadowing TTS + Live Highlight
    const startBtn = container.querySelector("#btn-start-shadowing");
    const wave = container.querySelector("#shadow-wave-visualizer");
    const hint = container.querySelector("#shadow-status-hint");
    const feedback = container.querySelector("#shadowing-feedback-box");

    if (startBtn) {
      startBtn.onclick = () => {
        if (!window.speechSynthesis) {
          showToast("الإنطق الصوتي غير مدعوم في متصفحك الحالي.");
          return;
        }

        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(correctTextForSpeech(rawSentence));
        utt.lang = 'en-US';
        utt.rate = selectedSpeed;

        wave.classList.add("active");
        startBtn.style.background = "#059669";
        startBtn.innerHTML = "<span>🗣️ جاري التظليل والمحاكاة الآن... تحدث خلفه!</span>";
        hint.innerText = "🎙️ المتحدث ينطق الآن... كرر خلفه فوراً بدون توقف!";

        // Word boundary highlighting
        let wordIndex = 0;
        utt.onboundary = (e) => {
          if (e.name === 'word') {
            container.querySelectorAll(".shadow-word").forEach(el => {
              el.style.background = "transparent";
              el.style.color = "inherit";
            });

            const targetWordEl = container.querySelector(`#shadow-w-${wordIndex}`);
            if (targetWordEl) {
              targetWordEl.style.background = "#f59e0b";
              targetWordEl.style.color = "#0f172a";
              targetWordEl.style.fontWeight = "bold";
            }
            wordIndex++;
          }
        };

        utt.onend = () => {
          wave.classList.remove("active");
          startBtn.style.background = "#0284c7";
          startBtn.innerHTML = "<span>🗣️ إعادة المحاكاة للجملة (Shadow Again)</span>";
          hint.innerText = "🌟 محاكاة ممتازة! كرر العملية أو انتقل للجملة التالية.";

          container.querySelectorAll(".shadow-word").forEach(el => {
            el.style.background = "rgba(34, 197, 94, 0.25)";
            el.style.color = "#4ade80";
          });

          const shadowKey = `shadowing_day_${dayData.day}_sent_${currentSentenceIdx}`;
          const isNewXp = awardXpOnce(shadowKey, 15, "ممارسة التظليل الصوتي (Shadowing)", startBtn);
          if (isNewXp) {
            if (feedback) {
              feedback.classList.remove("hidden");
              feedback.innerHTML = `
                <div class="speed-wpm-badge" style="background:rgba(56, 189, 248, 0.15); color:#38bdf8; border:1px solid #38bdf8; display:inline-block; padding:8px 16px;">
                  👏 محاكاة رائعة للجملة! حصلت على <strong>+15 XP</strong>
                </div>
              `;
            }
            showToastNotification("🗣️ تظليل رائع!", `أكملت محاكاة الجملة رقم ${currentSentenceIdx + 1} بنجاح (+15 XP)`, "🌟");
          } else {
            if (feedback) {
              feedback.classList.remove("hidden");
              feedback.innerHTML = `
                <div class="speed-wpm-badge" style="background:rgba(56, 189, 248, 0.15); color:#38bdf8; border:1px solid #38bdf8; display:inline-block; padding:8px 16px;">
                  👏 محاكاة رائعة للجملة!
                </div>
              `;
            }
            showToastNotification("🗣️ تظليل رائع!", `أكملت محاكاة الجملة رقم ${currentSentenceIdx + 1} بنجاح`, "🌟");
          }
        };

        window.speechSynthesis.speak(utt);
      };
    }
  };

  renderShadowingContent();
}

/* --------------------------------------------------------------------------
   Game Mode 8: Find the Mistake (اكتشف الخطأ في القصة)
   -------------------------------------------------------------------------- */
function renderFindMistakeMode(container, dayData) {
  // Replace target word with a mistake word
  const targetW = dayData.target_words[0] || "school";
  const alteredStoryHtml = prepareStoryWordsHtml(dayData.story, dayData.dictionary)
    .replace(new RegExp(targetW, "gi"), `<span class="mistake-word-btn" data-mistake="true">hospital</span>`);
    
  container.innerHTML = `
    <div class="arena-card-title">
      <span>❌</span> <span>اكتشف الخطأ وتصحيحه (Find the Mistake)</span>
    </div>
    <p class="arena-card-desc">تحتوي القصة أدناه على كلمة خاطئة ومعدلة عما قرأته! انقر على الكلمة الخاطئة لتصحيحها.</p>
    
    <div class="story-board-wrapper">
      <article class="story-container" id="mistake-story-view">
        ${alteredStoryHtml}
      </article>
    </div>
  `;
  
  container.querySelectorAll(".mistake-word-btn").forEach(btn => {
    btn.onclick = (e) => {
      btn.classList.add("corrected");
      btn.innerText = targetW;
      const mistakeKey = `find_mistake_day_${dayData.day}`;
      const isNewXp = awardXpOnce(mistakeKey, 25, "تصحيح الخطأ في القصة", e.target);
      if (isNewXp) {
        showToast(`❌ تم تصحيح الخطأ بنجاح! الكلمة الصحيحة هي: ${targetW} (+25 XP)`);
      } else {
        showToast(`❌ تم تصحيح الخطأ بنجاح! الكلمة الصحيحة هي: ${targetW}`);
      }
    };
  });
}

/* --------------------------------------------------------------------------
   Game Mode 9: Choose Your Ending (اختر النهاية)
   -------------------------------------------------------------------------- */
function renderChooseEndingMode(container, dayData) {
  const sentences = dayData.story.split(/(?<=[.!?])\s+/);
  const bodyText = sentences.slice(0, -1).join(" ");
  const originalEnding = sentences[sentences.length - 1] || "We are very happy!";
  
  const endings = [
    { text: originalEnding, correct: true },
    { text: "We decided to go to sleep immediately.", correct: false },
    { text: "We lost our books in the rain.", correct: false }
  ].sort(() => Math.random() - 0.5);
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🔮</span> <span>اختر نهاية القصة (Choose Your Ending)</span>
    </div>
    <p class="arena-card-desc">توقفت الأحداث قبل النهاية! اختر النهاية المنطقية الصحيحة للأحداث.</p>
    
    <div class="story-board-wrapper">
      <article class="story-container">
        ${prepareStoryWordsHtml(bodyText, dayData.dictionary)}
        <span style="color:#e06045; font-weight:800;"> [...]</span>
      </article>
    </div>
    
    <div class="detective-case-box">
      <div class="detective-badge">توقعات النهاية 🔮</div>
      <div class="detective-options-grid">
        ${endings.map((end, i) => `
          <button class="detective-opt-btn end-opt" data-correct="${end.correct}">
            ${i + 1}. ${end.text}
          </button>
        `).join('')}
      </div>
    </div>
  `;
  
  container.querySelectorAll(".end-opt").forEach(btn => {
    btn.onclick = (e) => {
      if (btn.getAttribute("data-correct") === "true") {
        btn.classList.add("correct");
        playCorrectAnswerSound();
        const endingKey = `choose_ending_day_${dayData.day}`;
        const isNewXp = awardXpOnce(endingKey, 25, "توقع النهاية الصحيحة", e.target);
        if (isNewXp) {
          showToast("🔮 أحسنت! هذه هي النهاية الأصلية للقصة! (+25 XP)");
        } else {
          showToast("🔮 أحسنت! هذه هي النهاية الأصلية للقصة!");
        }
      } else {
        btn.classList.add("wrong");
        playIncorrectAnswerSound();
      }
    };
  });
}

/* --------------------------------------------------------------------------
   Game Mode 10: Read Aloud Challenge (تحدي القراءة الجهرية والنطق)
   -------------------------------------------------------------------------- */
function renderReadAloudMode(container, dayData) {
  let speechRecInstance = null;
  let isListeningSpeech = false;
  let spokenWordsCount = 0;
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🎙️</span> <span>نمط القراءة الجهرية (Reading Aloud Mode)</span>
    </div>
    <p class="arena-card-desc">استمع للطق الصحيح أولاً، ثم اضغط على الميكروفون واقرأ القصة بصوتك ليتعرف النظام على كلماتك ويقيم طلاقتك بالنطق!</p>
    
    <div class="mic-recorder-box">
      <div style="display:flex; gap:12px; justify-content:center; align-items:center; flex-wrap:wrap; margin-bottom:12px;">
        <button class="btn-secondary" id="btn-readaloud-listen" style="font-size:0.9rem; padding:8px 16px;">
          <span>🔊 استمع لنطق القصة أولاً</span>
        </button>
        <button class="btn-primary" id="btn-readaloud-rec" style="font-size:0.95rem; padding:8px 20px; background:#e11d48;">
          <span>🎙️ ابدأ القراءة الجهرية الان</span>
        </button>
      </div>
      
      <div style="font-family:var(--font-arabic); font-weight:700; color:var(--rh-ink); margin-top:8px;" id="mic-status-label">
        اضغط "تحدث الان" واقرأ النص باللغة الإنجليزية
      </div>
      
      <div class="mic-wave-container" id="mic-wave-visualizer" style="margin-top:10px;">
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
        <div class="mic-wave-bar"></div>
      </div>
      
      <div id="mic-live-transcript" class="hidden" style="margin-top:12px; background:rgba(255,255,255,0.06); padding:10px 14px; border-radius:var(--radius-sm); font-family:var(--font-body); font-size:0.92rem; color:#64748b;">
        <span style="font-weight:700; color:#38bdf8;">الكلمات المسموعة: </span><span id="transcript-words-text">...</span>
      </div>

      <div id="mic-score-result" class="hidden" style="margin-top:14px;"></div>
    </div>
    
    <div class="story-board-wrapper" style="margin-top:20px;">
      <div class="reader-toolbar">
        <span class="toolbar-tip">📜 النص المطلوب قراءته بصوتك (الكلمات المعرف عليها تظهر باللون الأخضر):</span>
      </div>
      <article class="story-container" id="readaloud-story-view">
        ${prepareStoryWordsHtml(dayData.story, dayData.dictionary)}
      </article>
    </div>
  `;
  
  const listenBtn = container.querySelector("#btn-readaloud-listen");
  const recBtn = container.querySelector("#btn-readaloud-rec");
  const statusLabel = container.querySelector("#mic-status-label");
  const wave = container.querySelector("#mic-wave-visualizer");
  const transcriptBox = container.querySelector("#mic-live-transcript");
  const transcriptText = container.querySelector("#transcript-words-text");
  const scoreResult = container.querySelector("#mic-score-result");
  const storyView = container.querySelector("#readaloud-story-view");

  // Listen to TTS
  if (listenBtn) {
    listenBtn.onclick = () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(correctTextForSpeech(dayData.story));
        utt.lang = 'en-US';
        utt.rate = 0.85;
        wave.classList.add("active");
        statusLabel.innerText = "🔊 جاري تشغيل الصوت النقي للقصة...";
        utt.onend = () => {
          wave.classList.remove("active");
          statusLabel.innerText = "اكتمل الاستماع! الان دورك في القراءة الجهرية 🎙️";
        };
        window.speechSynthesis.speak(utt);
      }
    };
  }

  // Live Speech Recognition setup
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

  const stopListening = () => {
    isListeningSpeech = false;
    wave.classList.remove("active");
    recBtn.style.background = "#e11d48";
    recBtn.innerHTML = "<span>🎙️ ابدأ القراءة الجهرية الان</span>";
    statusLabel.innerText = "انتهت القراءة الجهرية!";

    if (speechRecInstance) {
      try { speechRecInstance.stop(); } catch(e) {}
    }
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      try { mediaRecorder.stop(); } catch(e) {}
    }

    // Evaluate result
    const storyWords = dayData.story.toLowerCase().split(/\s+/).filter(w => w.trim().length > 0);
    const score = Math.min(100, Math.max(70, Math.round((spokenWordsCount / Math.max(1, storyWords.length)) * 100) + 20));
    
    scoreResult.classList.remove("hidden");
    const readAloudKey = `read_aloud_day_${dayData.day}`;
    const isNewXp = awardXpOnce(readAloudKey, 25, "إكمال القراءة الجهرية", recBtn);
    if (isNewXp) {
      scoreResult.innerHTML = `
        <div class="speed-wpm-badge" style="background:rgba(34, 197, 94, 0.2); color:#4ade80; border:1px solid #4ade80; padding:10px 18px; font-size:1rem;">
          🌟 تقييم القراءة الجهرية: <strong>${score}%</strong> طلاقة ووضوح نطق ممتاز! (+25 XP)
        </div>
      `;
      showToastNotification("🎙️ إنجاز مذهل!", `أنهيت القراءة الجهرية بنجاح وتقييم طلاقة ${score}% (+25 XP)`, "🌟");
    } else {
      scoreResult.innerHTML = `
        <div class="speed-wpm-badge" style="background:rgba(34, 197, 94, 0.2); color:#4ade80; border:1px solid #4ade80; padding:10px 18px; font-size:1rem;">
          🌟 تقييم القراءة الجهرية: <strong>${score}%</strong> طلاقة ووضوح نطق ممتاز!
        </div>
      `;
      showToastNotification("🎙️ إنجاز مذهل!", `أنهيت القراءة الجهرية بنجاح وتقييم طلاقة ${score}%`, "🌟");
    }
    triggerConfetti();
  };

  const startListening = async () => {
    isListeningSpeech = true;
    spokenWordsCount = 0;
    wave.classList.add("active");
    recBtn.style.background = "#15803d";
    recBtn.innerHTML = "<span>⏹️ إنهاء القراءة الجهرية</span>";
    statusLabel.innerText = "🎙️ الميكروفون يستمع الان... اقرأ النص بصوت مرتفع وواضح!";
    transcriptBox.classList.remove("hidden");
    transcriptText.innerText = "جاري الاستماع للنطق...";

    // Try SpeechRecognition API
    if (SpeechRec) {
      try {
        speechRecInstance = new SpeechRec();
        speechRecInstance.continuous = true;
        speechRecInstance.interimResults = true;
        speechRecInstance.lang = 'en-US';

        speechRecInstance.onresult = (event) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript.toLowerCase() + " ";
          }
          
          if (transcriptText) transcriptText.innerText = currentTranscript.trim();

          // Highlight words in story
          const spokenTokens = currentTranscript.toLowerCase().replace(/[^a-z\s]/g, "").split(/\s+/);
          storyView.querySelectorAll(".story-word, .untranslated-word").forEach(node => {
            const cleanWord = node.innerText.toLowerCase().replace(/[^a-z]/g, "");
            if (cleanWord && spokenTokens.includes(cleanWord)) {
              if (!node.classList.contains("detective-found-clue")) {
                node.classList.add("detective-found-clue");
                spokenWordsCount++;
              }
            }
          });
        };

        speechRecInstance.onerror = (err) => {
          console.log("Speech recognition notice:", err);
        };

        speechRecInstance.start();
      } catch(e) {
        console.log("SpeechRecognition start fallback:", e);
      }
    }

    // Also record audio mic stream if available
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder = new MediaRecorder(stream);
      recordedAudioChunks = [];
      mediaRecorder.ondataavailable = e => recordedAudioChunks.push(e.data);
      mediaRecorder.start();
    } catch(err) {
      // Audio stream fallback simulation
      setTimeout(() => {
        if (isListeningSpeech) {
          // Simulate word highlights over time if mic is simulated
          const wordNodes = Array.from(storyView.querySelectorAll(".story-word, .untranslated-word"));
          let idx = 0;
          const simInterval = setInterval(() => {
            if (!isListeningSpeech || idx >= wordNodes.length) {
              clearInterval(simInterval);
              return;
            }
            wordNodes[idx].classList.add("detective-found-clue");
            spokenWordsCount++;
            if (transcriptText) transcriptText.innerText = `Reading aloud simulation (${spokenWordsCount} words)...`;
            idx++;
          }, 400);
        }
      }, 500);
    }
  };

  recBtn.onclick = () => {
    if (!isListeningSpeech) {
      startListening();
    } else {
      stopListening();
    }
  };
}

/* --------------------------------------------------------------------------
   Game Mode 11: Memory Reading (القراءة من الذاكرة)
   -------------------------------------------------------------------------- */
function renderMemoryMode(container, dayData) {
  const targetWords = dayData.target_words;
  let textWithInputs = dayData.story;
  
  targetWords.forEach(tw => {
    const reg = new RegExp(`\\b${tw}\\b`, "gi");
    textWithInputs = textWithInputs.replace(reg, `<input type="text" class="cloze-input-field" data-ans="${tw}" style="width:90px; padding:2px 6px; border:1.5px solid #3b82f6; border-radius:4px; font-weight:700; text-align:center;">`);
  });
  
  container.innerHTML = `
    <div class="arena-card-title">
      <span>🧠</span> <span>القراءة واسترجاع الذاكرة (Memory Recall)</span>
    </div>
    <p class="arena-card-desc">تم إخفاء الكلمات المفتاحية في القصة! اكتب الكلمات الصحيحة في الفراغات التالية بناءً على ذاكرتك.</p>
    
    <div class="story-board-wrapper">
      <article class="story-container">
        ${textWithInputs}
      </article>
      <button class="btn-primary" id="btn-check-memory" style="margin-top:16px;">
        <span>تحقق من الإجابات 🎯</span>
      </button>
    </div>
  `;
  
  container.querySelector("#btn-check-memory").onclick = (e) => {
    const inputs = container.querySelectorAll(".cloze-input-field");
    let allRight = true;
    
    inputs.forEach(inp => {
      const val = inp.value.trim().toLowerCase();
      const ans = inp.getAttribute("data-ans").toLowerCase();
      
      if (val === ans) {
        inp.style.background = "#dcfce7";
        inp.style.borderColor = "#22c55e";
      } else {
        inp.style.background = "#fee2e2";
        inp.style.borderColor = "#ef4444";
        allRight = false;
      }
    });
    
    if (allRight) {
      playCorrectAnswerSound();
      const memoryKey = `memory_recall_day_${dayData.day}`;
      const isNewXp = awardXpOnce(memoryKey, 30, "استرجاع الكلمات من الذاكرة", e.target);
      if (isNewXp) {
        showToast("🧠 رائع! استرجعت جميع الكلمات بنجاح من الذاكرة! (+30 XP)");
      } else {
        showToast("🧠 رائع! استرجعت جميع الكلمات بنجاح من الذاكرة!");
      }
    } else {
      playIncorrectAnswerSound();
      showToast("❌ هناك فراغات تحتاج تصحيح، تفقّد الفراغات باللون الأحمر.");
    }
  };
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// 3. String Word Tokenizer Builder
function prepareStoryWordsHtml(storyText, dictionary) {
  if (!storyText) return "";
  
  // Sort dictionary keys by length in descending order to match multi-word phrases first
  const sortedKeys = Object.keys(dictionary || {}).sort((a, b) => b.length - a.length);
  const multiWordKeys = sortedKeys.filter(k => k.includes(' ')).map(k => k.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  
  let regexStr = '\\b[\\w\'-]+\\b';
  if (multiWordKeys.length > 0) {
    regexStr = '\\b(?:' + multiWordKeys.join('|') + '|[\\w\'-]+)\\b';
  }
  
  const regex = new RegExp(regexStr, 'gi');
  
  let resultHtml = "";
  let lastIndex = 0;
  let match;
  
  while ((match = regex.exec(storyText)) !== null) {
    const start = match.index;
    const end = regex.lastIndex;
    const matchedText = match[0];
    
    // Append preceding raw text (punctuation, spaces, line breaks)
    if (start > lastIndex) {
      resultHtml += escapeHtml(storyText.substring(lastIndex, start));
    }
    
    const lowerMatch = matchedText.toLowerCase();
    const exactKey = Object.keys(dictionary || {}).find(k => k.toLowerCase() === lowerMatch);
    const translation = exactKey ? dictionary[exactKey] : (dictionary ? (dictionary[lowerMatch] || dictionary[matchedText]) : null);
    const isTranslated = Boolean(translation && typeof translation === 'string' && translation.trim() !== "" && translation !== "مترجم قريباً");
    
    if (isTranslated) {
      const keyToUse = exactKey || matchedText;
      resultHtml += `<span class="story-word" data-word="${keyToUse.replace(/"/g, '&quot;')}" data-start="${start}" data-end="${end}">${escapeHtml(matchedText)}</span>`;
    } else {
      resultHtml += `<span class="untranslated-word" data-start="${start}" data-end="${end}">${escapeHtml(matchedText)}</span>`;
    }
    
    lastIndex = end;
  }
  
  if (lastIndex < storyText.length) {
    resultHtml += escapeHtml(storyText.substring(lastIndex));
  }
  
  return resultHtml;
}

// Helper: Get accurate translation for any word with fallbacks and stemming
function getTranslationForWord(word, dictionary) {
  if (!word) return "مترجم";
  const dict = dictionary || {};
  const lower = word.trim().toLowerCase();
  
  // 1. Direct case-insensitive match
  const exactKey = Object.keys(dict).find(k => k.toLowerCase() === lower);
  if (exactKey && dict[exactKey]) return dict[exactKey];

  // 2. Stemming variations (plural / singular)
  const singular = lower.replace(/s$/, "").replace(/ies$/, "y");
  const singularKey = Object.keys(dict).find(k => k.toLowerCase() === singular);
  if (singularKey && dict[singularKey]) return dict[singularKey];

  const plural = lower + "s";
  const pluralKey = Object.keys(dict).find(k => k.toLowerCase() === plural);
  if (pluralKey && dict[pluralKey]) return dict[pluralKey];

  // 3. Global fallback search across curriculum
  if (typeof challengeData !== 'undefined' && Array.isArray(challengeData)) {
    for (const dayObj of challengeData) {
      if (dayObj && dayObj.dictionary) {
        const foundKey = Object.keys(dayObj.dictionary).find(k => k.toLowerCase() === lower || k.toLowerCase() === singular);
        if (foundKey && dayObj.dictionary[foundKey]) return dayObj.dictionary[foundKey];
      }
    }
  }

  return dict[word] || "مترجم";
}

// 4. Render Target Words Badges
function renderTargetWords(targetWords, dictionary) {
  targetWordsContainer.innerHTML = "";
  
  targetWords.forEach(word => {
    const translation = getTranslationForWord(word, dictionary);
    const isSaved = isWordSaved(word);
    
    const card = document.createElement("div");
    card.className = "word-badge-card";
    
    card.innerHTML = `
      <div class="word-info">
        <span class="word-eng-text">${escapeHtml(word)}</span>
        <span class="word-arb-text">${escapeHtml(translation)}</span>
      </div>
      <button class="save-word-badge-btn ${isSaved ? 'saved' : ''}" data-word="${escapeHtml(word)}" data-translation="${escapeHtml(translation)}" title="حفظ إلى محفظة المفردات">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="star-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
      </button>
    `;
    
    // Bookmark save listener
    const saveBtn = card.querySelector(".save-word-badge-btn");
    saveBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      toggleWordSave(word, translation, "target");
    });
    
    targetWordsContainer.appendChild(card);
  });
}

// 5. Render Comprehension Quiz
function renderQuiz(quizArray) {
  quizQuestionsContainer.innerHTML = "";
  
  if (!quizArray || quizArray.length === 0) return;
  
  quizArray.forEach((q, qIdx) => {
    const questionCard = document.createElement("div");
    questionCard.className = "quiz-question-item";
    
    const optionsHtml = q.options.map((option, optIdx) => {
      const optionLetter = String.fromCharCode(65 + optIdx); // A, B, C...
      return `
        <button class="quiz-option quiz-option-btn" data-qidx="${qIdx}" data-optidx="${optIdx}">
          <div class="option-content">
            <span class="option-prefix">${optionLetter}</span>
            <span class="option-text">${option}</span>
          </div>
          <span class="option-status-icon"></span>
        </button>
      `;
    }).join('');
    
    questionCard.innerHTML = `
      <div class="quiz-q-header">
        <span class="quiz-q-badge">السؤال ${qIdx + 1} من ${quizArray.length}</span>
      </div>
      <p class="quiz-q-text">${q.question}</p>
      <div class="quiz-options-grid">
        ${optionsHtml}
      </div>
    `;
    
    // Bind click events to options
    const optionBtns = questionCard.querySelectorAll(".quiz-option");
    optionBtns.forEach(btn => {
      btn.addEventListener("click", () => {
        const activeQuizObj = challengeData[currentDayIndex].quiz[qIdx];
        const correctIdx = activeQuizObj.answer;
        const currentSelected = parseInt(btn.getAttribute("data-optidx"), 10);
        
        // Disable other clicking once answered
        const siblingButtons = questionCard.querySelectorAll(".quiz-option");
        siblingButtons.forEach(sb => {
          sb.classList.remove("selected", "correct", "incorrect", "wrong");
          const iconSpan = sb.querySelector(".option-status-icon");
          if (iconSpan) iconSpan.innerHTML = "";
        });
        
        const firstTimeAnswering = selectedQuizAnswers[qIdx] === undefined;
        selectedQuizAnswers[qIdx] = currentSelected;
        
        // Grade option immediately
        if (currentSelected === correctIdx) {
          btn.classList.add("correct");
          playCorrectAnswerSound();
          const iconSpan = btn.querySelector(".option-status-icon");
          if (iconSpan) {
            iconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
          }
          const quizQKey = `quiz_q_day_${challengeData[currentDayIndex].day}_q_${qIdx}`;
          awardXpOnce(quizQKey, 25, "إجابة اختبار صحيحة", btn);
        } else {
          btn.classList.add("incorrect", "wrong");
          playIncorrectAnswerSound();
          const wrongIconSpan = btn.querySelector(".option-status-icon");
          if (wrongIconSpan) {
            wrongIconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#e06045" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
          }
          // Visual guide highlighting correct answer
          if (siblingButtons[correctIdx]) {
            siblingButtons[correctIdx].classList.add("correct");
            const correctIconSpan = siblingButtons[correctIdx].querySelector(".option-status-icon");
            if (correctIconSpan) {
              correctIconSpan.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#10b981" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`;
            }
          }
        }

        // Check if all questions are answered and all are correct
        const totalQ = quizArray.length;
        if (Object.keys(selectedQuizAnswers).length === totalQ) {
          let allCorrect = true;
          quizArray.forEach((qItem, idx) => {
            if (selectedQuizAnswers[idx] !== qItem.answer) {
              allCorrect = false;
            }
          });
          if (allCorrect && firstTimeAnswering) {
            perfectQuizCount++;
            saveStateToStorage();
            checkBadgesUnlock();
          }
        }
      });
    });
    
    quizQuestionsContainer.appendChild(questionCard);
  });
}

// 6. Vocabulary Wallet (My Saved Words List) Renderer
function renderWalletItems() {
  if (!savedWordsContainer) return;
  savedWordsContainer.innerHTML = "";
  
  const searchQuery = walletSearchBar ? walletSearchBar.value.toLowerCase().trim() : "";
  const activeFilterChip = document.querySelector(".filter-chip.active");
  const activeFilter = activeFilterChip ? activeFilterChip.getAttribute("data-filter") : "all";
  
  // Filter saved words array
  const filtered = savedWords.filter(item => {
    if (!item || !item.word) return false;
    const wordText = item.word.toLowerCase();
    const transText = (item.translation || "").toLowerCase();
    
    // Search query filter
    const matchesSearch = wordText.includes(searchQuery) || transText.includes(searchQuery);
    
    // Filter chip constraints
    let matchesType = true;
    if (activeFilter === "saved") {
      matchesType = item.source === "click-saved";
    } else if (activeFilter === "target") {
      matchesType = item.source === "target";
    }
    
    return matchesSearch && matchesType;
  });
  
  if (filtered.length === 0) {
    savedWordsContainer.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 48px 12px; color: var(--color-text-muted);">
        <p>لم يتم العثور على أي كلمات تطابق معايير البحث أو التصفية الحالية.</p>
      </div>
    `;
    return;
  }
  
  filtered.forEach(item => {
    const card = document.createElement("div");
    card.className = "wallet-word-card";
    
    const sourceLabel = item.source === "target" ? "كلمة مستهدفة" : "محفوظة يدوياً";
    const sourceClass = item.source === "target" ? "target-saved" : "manually-saved";
    
    card.innerHTML = `
      <div class="wallet-word-card-header">
        <span class="wallet-card-term">${escapeHtml(item.word)}</span>
        <span class="wallet-card-meta ${sourceClass}">${sourceLabel}</span>
      </div>
      <div class="wallet-card-body">
        <span class="wallet-card-translation">${escapeHtml(item.translation || "مترجم")}</span>
        <span class="wallet-card-source">محفوظة من قصص اليوم ${item.day || 1}</span>
      </div>
      <div class="wallet-card-actions">
        <button class="wallet-action-btn btn-speak" title="الاستماع للكلمة">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M11 5 6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
        </button>
        <button class="wallet-action-btn btn-delete" title="حذف الكلمة من المحفظة">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
        </button>
      </div>
    `;
    
    // Audio trigger
    card.querySelector(".btn-speak").addEventListener("click", () => {
      speakWord(item.word);
    });
    
    // Delete word trigger
    card.querySelector(".btn-delete").addEventListener("click", () => {
      toggleWordSave(item.word, item.translation, item.source);
    });
    
    savedWordsContainer.appendChild(card);
  });
}


/* ==========================================================================
   Interactive Handlers & Event Binding
   ========================================================================== */

function bindStaticListeners() {
  
  // Navigation Tabs Switching
  tabChallengeBtn.addEventListener("click", () => {
    switchTab("challenge");
  });
  
  tabWalletBtn.addEventListener("click", () => {
    switchTab("wallet");
  });
  
  if (tabAchievementsBtn) {
    tabAchievementsBtn.addEventListener("click", () => {
      switchTab("achievements");
    });
  }
  
  logoHome.addEventListener("click", () => {
    switchTab("challenge");
  });
  
  btnWalletGoReading.addEventListener("click", () => {
    switchTab("challenge");
  });
  
  // Interactive Word Click Detection inside Story Board
  storyTextView.addEventListener("click", (e) => {
    const targetWordNode = e.target.closest(".story-word");
    if (!targetWordNode) {
      closeTooltip();
      return;
    }
    
    e.stopPropagation();
    openTooltip(targetWordNode);
  });
  
  // Click outside to close Tooltip popup
  document.addEventListener("click", (e) => {
    if (!dictTooltip.contains(e.target) && !e.target.closest(".story-word")) {
      closeTooltip();
    }
  });
  
  // Audio Narrator Event
  btnListen.addEventListener("click", () => {
    toggleVoiceStory();
  });
  
  // Complete Day Action Button
  btnCompleteDay.addEventListener("click", () => {
    completeDayChallenge();
  });
  
  // Next Day Transition action
  btnNextDay.addEventListener("click", () => {
    transitionToNextDay();
  });
  
  // Search vocabulary wallet live updates
  walletSearchBar.addEventListener("input", () => {
    renderWalletItems();
  });
  
  // Vocabulary Wallet Filters
  filterChips.forEach(chip => {
    chip.addEventListener("click", () => {
      filterChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      renderWalletItems();
    });
  });
  
  // Helper for Custom Confirmation Modal
  function openConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById("reset-confirm-modal");
    const modalTitle = document.getElementById("reset-modal-title");
    const modalDesc = document.getElementById("reset-modal-desc");
    const confirmBtn = document.getElementById("btn-confirm-reset");
    const cancelBtn = document.getElementById("btn-cancel-reset");

    if (!modal) return;
    if (modalTitle) modalTitle.innerText = title;
    if (modalDesc) modalDesc.innerHTML = message;

    modal.classList.remove("hidden");

    if (confirmBtn) {
      const newConfirmBtn = confirmBtn.cloneNode(true);
      confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

      newConfirmBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
        if (typeof onConfirm === "function") {
          onConfirm();
        }
      });
    }

    if (cancelBtn) {
      const newCancelBtn = cancelBtn.cloneNode(true);
      cancelBtn.parentNode.replaceChild(newCancelBtn, cancelBtn);
      newCancelBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }
  }

  // Reset whole course / localStorage
  const btnResetCourse = document.getElementById("reset-course-btn");
  if (btnResetCourse) {
    btnResetCourse.addEventListener("click", () => {
      openConfirmModal(
        "إعادة بدء الدورة",
        "هل أنت متأكد من رغبتك في إعادة بدء الدورة؟<br>سيتم مسح جميع الإنجازات والكلمات المحفوظة ونقاط الخبرة وتتبع الأيام والبدء من اليوم الأول.",
        () => {
          localStorage.clear();

          // Reset state variables
          currentDayIndex = 0;
          completedDays = [];
          savedWords = [];
          streakCount = 1;
          userXp = 0;
          unlockedBadges = [];
          perfectQuizCount = 0;
          audioListenedDays = [];
          awardedXpKeys = [];

          // Re-initialize UI
          initializeApp();
          renderWalletItems();

          try {
            window.location.reload();
          } catch(e) {
            console.log("Reload bypassed");
          }
        }
      );
    });
  }

  // Wallet clear/reset list
  if (btnClearWallet) {
    btnClearWallet.addEventListener("click", () => {
      openConfirmModal(
        "تفريغ محفظة المفردات",
        "هل أنت متأكد من رغبتك في إعادة ضبط محفظة المفردات؟ سيتم حذف جميع الكلمات المحفوظة.",
        () => {
          savedWords = [];
          localStorage.setItem("itqan_vocab_wallet", JSON.stringify([]));
          updateWalletCountBadge();
          renderWalletItems();
          loadActiveDayContent();
        }
      );
    });
  }
  
  // Close dictionary popups manually
  tooltipCloseBtn.addEventListener("click", () => {
    closeTooltip();
  });
  
  // Tooltip Audio triggers
  tooltipAudioBtn.addEventListener("click", () => {
    speakWord(tooltipEng.innerText);
  });
  
  // Milestone modal Continue button
  btnCelebrationContinue.addEventListener("click", () => {
    celebrationModal.classList.add("hidden");
    transitionToNextDay();
  });
}

function switchTab(target) {
  activeTab = target;
  
  // Reset all tabs active status
  tabChallengeBtn.classList.remove("active");
  tabWalletBtn.classList.remove("active");
  if (tabAchievementsBtn) tabAchievementsBtn.classList.remove("active");
  
  panelChallenge.classList.remove("active");
  panelWallet.classList.remove("active");
  if (panelAchievements) panelAchievements.classList.remove("active");
  
  if (activeTab === "challenge") {
    tabChallengeBtn.classList.add("active");
    panelChallenge.classList.add("active");
  } else if (activeTab === "wallet") {
    tabWalletBtn.classList.add("active");
    panelWallet.classList.add("active");
    renderWalletItems();
  } else if (activeTab === "achievements") {
    if (tabAchievementsBtn) tabAchievementsBtn.classList.add("active");
    if (panelAchievements) panelAchievements.classList.add("active");
    renderAchievementsPanel();
  }
  
  // Pause any voice active during transitions
  stopVoice();
}


/* ==========================================================================
   Part of Speech Detection Core
   ========================================================================== */
function getPartOfSpeech(word) {
  const clean = word.toLowerCase().trim().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"");
  
  // Custom exact overrides for specific words from our curriculum:
  const posMap = {
    // Verbs
    "start": "verb / فعل",
    "starts": "verb / فعل",
    "brewing": "verb / فعل",
    "learning": "verb / فعل",
    "select": "verb / فعل",
    "roast": "verb / فعل",
    "release": "verb / فعل",
    "remains": "verb / فعل",
    "survive": "verb / فعل",
    "adapted": "verb / فعل",
    "encourage": "verb / فعل",
    "reduce": "verb / فعل",
    "protect": "verb / فعل",
    "prevent": "verb / فعل",
    "improves": "verb / فعل",
    "boosting": "verb / فعل",
    "invented": "verb / فعل",
    "communicated": "verb / فعل",
    "emerged": "verb / فعل",
    "utilized": "verb / فعل",
    "record": "verb / فعل",
    "enabling": "verb / فعل",
    "expand": "verb / فعل",
    "looking for": "phrase / عبارة فعلية",
    "manage": "verb / فعل",
    "utilize": "verb / فعل",
    "monitor": "verb / فعل",
    "optimize": "verb / فعل",
    "perform": "verb / فعل",
    "fly": "verb / فعل",
    "searching": "verb / فعل",
    "transport": "verb / فعل",
    "allows": "verb / فعل",
    "reproduce": "verb / فعل",
    "produce": "verb / فعل",
    "generate": "verb / فعل",
    "run out": "phrase / عبارة فعلية",
    "consolidates": "verb / فعل",
    "repairs": "verb / فعل",
    "strengthens": "verb / فعل",
    "maintain": "verb / فعل",
    "consumed": "verb / فعل",
    "surpassed": "verb / فعل",
    "discovered": "verb / فعل",
    "noticed": "verb / فعل",
    "located": "verb / فعل",
    "consists": "verb / فعل",
    "arranged": "verb / فعل",
    "debated": "verb / فعل",
    "transported": "verb / فعل",
    "feel": "verb / فعل",
    "seeks": "verb / فعل",
    "save": "verb / فعل",
    "identifying": "verb / فعل",
    "rewarding": "verb / فعل",
    "build": "verb / فعل",
    "creates": "verb / فعل",
    "wearing": "verb / فعل",
    "explore": "verb / فعل",
    "training": "verb / فعل",
    "simulating": "verb / فعل",
    "stretching": "verb / فعل",
    "pose": "verb / فعل",
    "confined": "verb / فعل",
    "recommend": "verb / فعل",
    "predict": "verb / فعل",
    "filter": "verb / فعل",
    "answer": "verb / فعل",
    "struggled": "verb / فعل",
    "halting": "verb / فعل",
    "employs": "verb / فعل",
    "extend": "verb / فعل",
    "spanned": "verb / فعل",
    "originating": "verb / فعل",
    "marked": "verb / فعل",
    "focused": "verb / فعل",
    "possess": "verb / فعل",
    "convey": "verb / فعل",
    "evokes": "verb / فعل",
    "stimulates": "verb / فعل",
    "coexist": "verb / فعل",
    "depend": "verb / فعل",
    "disrupt": "verb / فعل",
    "transformed": "verb / فعل",
    "began": "verb / فعل",
    "share": "verb / فعل",
    "transmit": "verb / فعل",
    "traded": "verb / فعل",
    "rely": "verb / فعل",
    "escape": "verb / فعل",
    "erupts": "verb / فعل",
    "originates": "verb / فعل",
    "enrich": "verb / فعل",
    "running": "noun/verb / اسم أو فعل",
    "train": "verb / فعل",
    "avoid": "verb / فعل",
    "reaching": "verb / فعل",
    "finish": "verb / فعل",
    "exploring": "verb / فعل",
    "deployed": "verb / فعل",
    "analyze": "verb / فعل",
    "search": "verb / فعل",
    "submit": "verb / فعل",
    "scan": "verb / فعل",
    "visit": "verb / فعل",
    "index": "verb / فعل",
    "evaluate": "verb / فعل",
    "dating back": "phrase / عبارة فعلية",
    "simulated": "verb / فعل",
    "taught": "verb / فعل",
    "become": "verb / فعل",
    "overwhelmed": "adjective/verb / صفة أو فعل",
    "focusing": "verb / فعل",
    "suggest": "verb / فعل",
    "reduces": "verb / فعل",
    "enhances": "verb / فعل",
    "appear": "verb / فعل",
    "connected": "adjective/verb / صفة أو فعل",
    "exchange": "verb / فعل",
    "attacked": "verb / فعل",
    "signal": "verb / فعل",
    "prepare": "verb / فعل",
    "promotes": "verb / فعل",
    "bonding": "noun/verb / اسم أو فعل",
    "alleviate": "verb / فعل",
    "lower": "verb / فعل",
    "stimulating": "verb / فعل",
    "understand": "verb / فعل",
    "create": "verb / فعل",
    "save": "verb / فعل",
    "invest": "verb / فعل",
    "accumulate": "verb / فعل",

    // Adjectives
    "hot": "adjective / صفة",
    "complicated": "adjective / صفة",
    "finest": "adjective / صفة",
    "exact": "adjective / صفة",
    "deep": "adjective / صفة",
    "mysterious": "adjective / صفة",
    "unexplored": "adjective / صفة",
    "extreme": "adjective / صفة",
    "freezing": "adjective / صفة",
    "strange": "adjective / صفة",
    "marine": "adjective / صفة",
    "harsh": "adjective / صفة",
    "electric": "adjective / صفة",
    "popular": "adjective / صفة",
    "traditional": "adjective / صفة",
    "primary": "adjective / صفة",
    "greenhouse": "adjective / صفة",
    "regular": "adjective / صفة",
    "physical": "adjective / صفة",
    "essential": "adjective / صفة",
    "good": "adjective / صفة",
    "chronic": "adjective / صفة",
    "mental": "adjective / صفة",
    "spoken": "adjective / صفة",
    "earliest": "adjective / صفة",
    "ancient": "adjective / صفة",
    "clay": "adjective / صفة",
    "complex": "adjective / صفة",
    "urban": "adjective / صفة",
    "innovative": "adjective / صفة",
    "smart": "adjective / صفة",
    "digital": "adjective / صفة",
    "fossil": "adjective / صفة",
    "limited": "adjective / صفة",
    "significant": "adjective / صفة",
    "renewable": "adjective / صفة",
    "solar": "adjective / صفة",
    "wind": "adjective / صفة",
    "crucial": "adjective / صفة",
    "global": "adjective / صفة",
    "active": "adjective / صفة",
    "damaged": "adjective / صفة",
    "immune": "adjective / صفة",
    "overall": "adjective / صفة",
    "second": "adjective / صفة",
    "boiling": "adjective / صفة",
    "wonderful": "adjective / صفة",
    "pleasant": "adjective / صفة",
    "famous": "adjective / صفة",
    "prehistoric": "adjective / صفة",
    "massive": "adjective / صفة",
    "standing": "adjective / صفة",
    "circular": "adjective / صفة",
    "heavy": "adjective / صفة",
    "conscious": "adjective / صفة",
    "automatic": "adjective / صفة",
    "positive": "adjective / صفة",
    "constructive": "adjective / صفة",
    "virtual": "adjective / صفة",
    "immersive": "adjective / صفة",
    "interactive": "adjective / صفة",
    "specialized": "adjective / صفة",
    "medical": "adjective / صفة",
    "largest": "adjective / صفة",
    "living": "adjective / صفة",
    "spectacular": "adjective / صفة",
    "tiny": "adjective / صفة",
    "rising": "adjective / صفة",
    "major": "adjective / صفة",
    "natural": "adjective / صفة",
    "intelligent": "adjective / صفة",
    "voice-activated": "adjective / صفة",
    "fresh": "adjective / صفة",
    "modern": "adjective / صفة",
    "vacuum": "adjective / صفة",
    "influential": "adjective / صفة",
    "cultural": "adjective / صفة",
    "classical": "adjective / صفة",
    "iconic": "adjective / صفة",
    "powerful": "adjective / صفة",
    "psychological": "adjective / صفة",
    "specific": "adjective / صفة",
    "diverse": "adjective / صفة",
    "single": "adjective / صفة",
    "extinct": "adjective / صفة",
    "entire": "adjective / صفة",
    "ecological": "adjective / صفة",
    "healthy": "adjective / صفة",
    "late": "adjective / صفة",
    "military": "adjective / صفة",
    "subsequent": "adjective / صفة",
    "beloved": "adjective / صفة",
    "developing": "adjective / صفة",
    "unstable": "adjective / صفة",
    "molten": "adjective / صفة",
    "dangerous": "adjective / صفة",
    "surrounding": "adjective / صفة",
    "fertile": "adjective / صفة",
    "supreme": "adjective / صفة",
    "distant": "adjective / صفة",
    "close": "adjective / صفة",
    "advanced": "adjective / صفة",
    "robotic": "adjective / صفة",
    "microbial": "adjective / صفة",
    "fast-paced": "adjective / صفة",
    "present": "adjective / صفة",
    "scientific": "adjective / صفة",
    "emotional": "adjective / صفة",
    "isolated": "adjective / صفة",
    "vast": "adjective / صفة",
    "critical": "adjective / صفة",
    "emergency": "adjective / صفة",
    "oxygen-rich": "adjective / صفة",
    "universal": "adjective / صفة",
    "human": "adjective / صفة",
    "social": "adjective / صفة",
    "financial": "adjective / صفة",
    "balanced": "adjective / صفة",
    "long-term": "adjective / صفة",

    // Adverbs
    "however": "adverb / ظرف",
    "perfectly": "adverb / ظرف",
    "completely": "adverb / ظرف",
    "increasingly": "adverb / ظرف",
    "regularly": "adverb / ظرف",
    "furthermore": "adverb / ظرف",
    "solely": "adverb / ظرف",
    "rapidly": "adverb / ظرف",
    "efficiently": "adverb / ظرف",
    "never": "adverb / ظرف",
    "merely": "adverb / ظرف",
    "meanwhile": "adverb / ظرف",
    "only": "adverb / ظرف",
    "actually": "adverb / ظرف",
    "constantly": "adverb / ظرف",
    "successfully": "adverb / ظرف",
    "sadly": "adverb / ظرف",
    "instantly": "adverb / ظرف",
    "carefully": "adverb / ظرف",
    "originally": "adverb / ظرف",
    "seamlessly": "adverb / ظرف",
    "heavily": "adverb / ظرف",
    "highly": "adverb / ظرف",
    "diligently": "adverb / ظرف",
    "deeply": "adverb / ظرف",
    "entirely": "adverb / ظرف",
    "effectively": "adverb / ظرف",
    "wisely": "adverb / ظرف",

    // Prepositions / Conjunctions
    "before": "preposition/conjunction / حرف جر أو عطف",
    "within": "preposition / حرف جر",
    "without": "preposition / حرف جر",
    "beneath": "preposition / حرف جر",
    "since": "preposition/conjunction / حرف جر أو عطف",
    "although": "conjunction / حرف ربط",
    "unlike": "preposition / حرف جر",
    "yet": "conjunction / حرف عطف"
  };

  if (posMap[clean]) {
    return posMap[clean];
  }

  // Common plurals to singular lookup
  if (clean.endsWith("s")) {
    const singular = clean.slice(0, -1);
    if (posMap[singular]) {
      return posMap[singular];
    }
  }
  // Try looking up clean version ending in "es"
  if (clean.endsWith("es")) {
    const singular = clean.slice(0, -2);
    if (posMap[singular]) {
      return posMap[singular];
    }
  }
  // Try past tense mapping
  if (clean.endsWith("ed")) {
    const present = clean.slice(0, -2);
    if (posMap[present]) {
      return posMap[present];
    }
    const presentWithE = clean.slice(0, -1);
    if (posMap[presentWithE]) {
      return posMap[presentWithE];
    }
  }
  // Try gerund mapping
  if (clean.endsWith("ing")) {
    const base = clean.slice(0, -3);
    if (posMap[base]) {
      return posMap[base];
    }
    const baseWithE = clean.slice(0, -3) + "e";
    if (posMap[baseWithE]) {
      return posMap[baseWithE];
    }
  }

  // Heuristics based on word endings
  if (clean.endsWith("ly")) {
    return "adverb / ظرف";
  }
  if (clean.endsWith("tion") || clean.endsWith("ity") || clean.endsWith("ness") || clean.endsWith("ment") || clean.endsWith("er") || clean.endsWith("or") || clean.endsWith("ist")) {
    return "noun / اسم";
  }
  if (clean.endsWith("ful") || clean.endsWith("ous") || clean.endsWith("al") || clean.endsWith("ive") || clean.endsWith("ic") || clean.endsWith("able") || clean.endsWith("ible")) {
    return "adjective / صفة";
  }

  // Fallback to noun
  return "noun / اسم";
}

/* ==========================================================================
   Interactive Tooltip Popup Core Logic
   ========================================================================== */

function openTooltip(wordElement) {
  const originalWord = wordElement.getAttribute("data-word");
  const displayWord = wordElement.innerText;
  const currentDayData = challengeData[currentDayIndex];
  
  // Get translation from Dictionary mapping (fallback to lowercase word)
  let translation = currentDayData.dictionary[originalWord.toLowerCase()] || 
                    currentDayData.dictionary[originalWord] || 
                    currentDayData.dictionary[displayWord.toLowerCase()] || 
                    "مترجم قريباً";
  
  tooltipEng.innerText = displayWord;
  tooltipArb.innerText = translation;
  if (tooltipPos) {
    tooltipPos.innerText = getPartOfSpeech(displayWord);
  }
  
  // Setup Tooltip star save state
  const isSaved = isWordSaved(displayWord);
  if (isSaved) {
    tooltipSaveBtn.classList.add("saved");
    tooltipSaveText.innerText = "Word Saved";
  } else {
    tooltipSaveBtn.classList.remove("saved");
    tooltipSaveText.innerText = "Save Word";
  }
  
  // Set Tooltip Dynamic absolute coordinates relative to clicked word bounding client rect
  dictTooltip.classList.remove("hidden");
  
  const rect = wordElement.getBoundingClientRect();
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
  const scrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
  
  const tooltipHeight = dictTooltip.offsetHeight;
  const tooltipWidth = dictTooltip.offsetWidth;
  const arrowNode = dictTooltip.querySelector(".tooltip-arrow");
  
  // Calculate centers
  let top = rect.top + scrollTop - tooltipHeight - 12; // 12px gap
  let left = rect.left + scrollLeft + (rect.width / 2) - (tooltipWidth / 2);
  
  // Vertical boundary check: if the tooltip goes off the top screen boundary, display below the word
  let showBelow = false;
  if (top < scrollTop) {
    top = rect.bottom + scrollTop + 12;
    showBelow = true;
  }
  
  // Horizontal boundary checks
  const viewportPadding = 12;
  const maxLeft = window.innerWidth - tooltipWidth - viewportPadding;
  
  if (left < viewportPadding) {
    left = viewportPadding;
  } else if (left > maxLeft) {
    left = maxLeft;
  }
  
  dictTooltip.style.top = `${top}px`;
  dictTooltip.style.left = `${left}px`;
  
  // Reposition arrow relative to tooltip box to align precisely with clicked word
  const relativeWordCenter = rect.left + scrollLeft + (rect.width / 2) - left;
  arrowNode.style.left = `${relativeWordCenter}px`;
  
  if (showBelow) {
    arrowNode.style.top = "-6px";
    arrowNode.style.borderBottom = "none";
    arrowNode.style.borderRight = "none";
    arrowNode.style.borderTop = "1px solid var(--color-primary)";
    arrowNode.style.borderLeft = "1px solid var(--color-primary)";
  } else {
    arrowNode.style.top = "auto";
    arrowNode.style.bottom = "-6px";
    arrowNode.style.borderTop = "none";
    arrowNode.style.borderLeft = "none";
    arrowNode.style.borderBottom = "1px solid var(--color-primary)";
    arrowNode.style.borderRight = "1px solid var(--color-primary)";
  }
  
  // Re-bind Save event listener to this specific word/translation
  tooltipSaveBtn.onclick = (e) => {
    e.stopPropagation();
    toggleWordSave(displayWord, translation, "click-saved");
    const nowSaved = isWordSaved(displayWord);
    
    if (nowSaved) {
      tooltipSaveBtn.classList.add("saved");
      tooltipSaveText.innerText = "تم حفظ الكلمة";
    } else {
      tooltipSaveBtn.classList.remove("saved");
      tooltipSaveText.innerText = "حفظ الكلمة";
    }
    
    updateWalletCountBadge();
    loadActiveDayContent(); // visual refresh target word highlights
  };
}

function closeTooltip() {
  dictTooltip.classList.add("hidden");
}


/* ==========================================================================
   Word Save/Delete Operations
   ========================================================================== */

function isWordSaved(word) {
  if (!word) return false;
  const clean = word.trim().toLowerCase();
  return savedWords.some(item => item && item.word && item.word.trim().toLowerCase() === clean);
}

function toggleWordSave(word, translation, source) {
  if (!word) return;
  const cleanWord = word.trim();
  const cleanTrans = (translation || "مترجم").trim();
  const index = savedWords.findIndex(item => item && item.word && item.word.trim().toLowerCase() === cleanWord.toLowerCase());
  
  if (index > -1) {
    // Already saved, remove it
    savedWords.splice(index, 1);
    if (typeof showToast === 'function') {
      showToast(`🗑️ تم إزالة "${cleanWord}" من محفظة المفردات.`);
    }
  } else {
    // Add to wallet array
    savedWords.push({
      word: cleanWord,
      translation: cleanTrans,
      day: currentDayIndex + 1,
      source: source || "target" // click-saved | target
    });
    const wordKey = `word_save_${cleanWord.toLowerCase()}`;
    const isNewXp = awardXpOnce(wordKey, 10, "حفظ كلمة جديدة");
    if (typeof showToast === 'function') {
      if (isNewXp) {
        showToast(`⭐ تم حفظ "${cleanWord}" إلى محفظة المفردات! (+10 XP)`);
      } else {
        showToast(`⭐ تم حفظ "${cleanWord}" إلى محفظة المفردات!`);
      }
    }
  }
  
  saveStateToStorage();
  updateWalletCountBadge();
  refreshAllWordSaveStates();
}

function refreshAllWordSaveStates() {
  // 1. Update target words buttons in main card
  if (targetWordsContainer) {
    const btns = targetWordsContainer.querySelectorAll(".save-word-badge-btn");
    btns.forEach(btn => {
      const word = btn.getAttribute("data-word");
      if (word) {
        if (isWordSaved(word)) {
          btn.classList.add("saved");
        } else {
          btn.classList.remove("saved");
        }
      }
    });
  }

  // 2. Update focus mode target words chips if open
  const focusTargetWordsGrid = document.getElementById("focus-target-words-grid");
  if (focusTargetWordsGrid) {
    const btns = focusTargetWordsGrid.querySelectorAll("[data-focus-save]");
    btns.forEach(btn => {
      const word = btn.getAttribute("data-focus-save");
      if (word) {
        if (isWordSaved(word)) {
          btn.classList.add("saved");
        } else {
          btn.classList.remove("saved");
        }
      }
    });
  }

  // 3. Update tooltip save button if open
  if (typeof tooltipEng !== 'undefined' && tooltipEng && typeof dictTooltip !== 'undefined' && dictTooltip && !dictTooltip.classList.contains("hidden")) {
    const word = tooltipEng.innerText;
    if (word) {
      if (isWordSaved(word)) {
        tooltipSaveBtn.classList.add("saved");
        if (typeof tooltipSaveText !== 'undefined' && tooltipSaveText) tooltipSaveText.innerText = "تم حفظ الكلمة";
      } else {
        tooltipSaveBtn.classList.remove("saved");
        if (typeof tooltipSaveText !== 'undefined' && tooltipSaveText) tooltipSaveText.innerText = "حفظ الكلمة";
      }
    }
  }
}


/* ==========================================================================
   Native Browser Text-To-Speech (Speech Synthesis)
   ========================================================================== */

function correctTextForSpeech(text) {
  if (!text) return "";
  // Fix verb heteronym 'lives' (/lɪvz/ = يعيش) vs noun 'lives' (/laɪvz/ = حيوات) for SpeechSynthesis
  return text.replace(/\blives\b/gi, (m) => (m[0] === 'L' ? 'Livs' : 'livs'));
}

function speakWord(word) {
  if (!synth) return;
  
  // Stop active synthesis
  synth.cancel();
  
  const utterance = new SpeechSynthesisUtterance(correctTextForSpeech(word));
  utterance.lang = 'en-US';
  utterance.rate = 0.85; // slightly slower for learners
  utterance.pitch = 1.0;
  
  synth.speak(utterance);
}

function toggleVoiceStory() {
  if (!synth) {
    alert("خاصية النطق الصوتي غير مدعومة في هذا المتصفح.");
    return;
  }
  
  if (synth.speaking) {
    stopVoice();
  } else {
    playVoiceStory();
  }
}

function playVoiceStory() {
  const currentDayData = challengeData[currentDayIndex];
  
  if (!audioListenedDays.includes(currentDayData.day)) {
    audioListenedDays.push(currentDayData.day);
  }
  const audioKey = `audio_listen_day_${currentDayData.day}`;
  awardXpOnce(audioKey, 15, "الاستماع بالصوت", btnListen);
  
  btnListen.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon animation-speaking-pulse"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
    <span>إيقاف القراءة</span>
  `;
  btnListen.classList.add("voice-active");
  
  currentUtterance = new SpeechSynthesisUtterance(correctTextForSpeech(currentDayData.story));
  currentUtterance.lang = 'en-US';
  currentUtterance.rate = 0.85; // Comfortable listening pace
  
  // Highlight words boundary callback
  currentUtterance.onboundary = function(event) {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      const spans = storyTextView.querySelectorAll(".story-word, .untranslated-word");
      
      let matchedSpan = null;
      let minDistance = Infinity;
      
      spans.forEach(span => {
        const start = parseInt(span.getAttribute("data-start"), 10);
        const end = parseInt(span.getAttribute("data-end"), 10);
        
        if (!isNaN(start) && !isNaN(end)) {
          if (charIndex >= start && charIndex < end) {
            matchedSpan = span;
          } else {
            const dist = Math.abs(start - charIndex);
            if (dist < minDistance) {
              minDistance = dist;
              if (!matchedSpan && dist <= 3) {
                matchedSpan = span;
              }
            }
          }
        }
      });
      
      if (matchedSpan) {
        spans.forEach(span => {
          if (span === matchedSpan) {
            span.classList.add("active-speaking");
            span.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
          } else {
            span.classList.remove("active-speaking");
          }
        });
      }
    }
  };
  
  currentUtterance.onend = function() {
    stopVoice();
  };
  
  currentUtterance.onerror = function() {
    stopVoice();
  };
  
  synth.speak(currentUtterance);
}

function stopVoice() {
  if (!synth) return;
  synth.cancel();
  
  btnListen.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon"><path d="M11 5 6 9H2v6h4l5 4V5z"></path><path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14"></path></svg>
    <span>الاستماع للقصة</span>
  `;
  btnListen.classList.remove("voice-active");
  
  // Remove speaking/highlight style classes on completion
  document.querySelectorAll("#story-text-view .story-word").forEach(span => {
    span.classList.remove("active-speaking", "highlight", "active-word");
  });
}


/* ==========================================================================
   Milestone Navigation & Completion
   ========================================================================== */

function completeDayChallenge() {
  const currentDayData = challengeData[currentDayIndex];
  
  // Ensure the quiz has been fully graded first before enabling complete triggers
  const totalQuestions = currentDayData.quiz.length;
  const totalAnswered = Object.keys(selectedQuizAnswers).length;
  
  if (totalAnswered < totalQuestions) {
    alert("يرجى الإجابة على جميع أسئلة الاختبار أولاً!");
    return;
  }
  
  // Add to completed array if not already present
  const isNewCompletion = !completedDays.includes(currentDayData.day);
  if (isNewCompletion) {
    completedDays.push(currentDayData.day);
  }
  
  // Streak records
  recordActivityForStreak();
  saveStateToStorage();
  
  // Award XP for completion
  const dayCompleteKey = `day_complete_${currentDayData.day}`;
  const isNewDayXp = awardXpOnce(dayCompleteKey, 100, "إكمال تحدي اليوم", btnCompleteDay);
  if (isNewDayXp && streakCount > 1) {
    const streakKey = `streak_bonus_day_${currentDayData.day}`;
    awardXpOnce(streakKey, 50, "مكافأة السلسلة المتتالية");
  }
  
  // Progress Bar updates
  updateHeaderStats();
  renderSidebarDays();
  
  // Trigger Celebration modal & Confetti
  showCelebrationModal();
  triggerConfetti();
  
  // UI Switch
  btnCompleteDay.classList.add("hidden");
  if (currentDayIndex < 29) {
    btnNextDay.classList.remove("hidden");
  }
}

function showCelebrationModal() {
  statCompletedDays.innerText = `${completedDays.length}/30`;
  statStreakDays.innerText = streakCount.toString();
  
  const rewardsRow = document.getElementById("modal-rewards-row");
  if (rewardsRow) {
    rewardsRow.innerHTML = `
      <div class="reward-pill xp-pill">+100 XP ⭐</div>
      ${streakCount > 1 ? `<div class="reward-pill streak-pill">+50 XP bonus 🔥</div>` : ''}
    `;
  }
  
  const currentDayData = challengeData[currentDayIndex];
  const isFinalDay = currentDayData.day === 30;
  
  if (isFinalDay) {
    document.getElementById("celebration-title").innerText = "تهانينا العظيمة! 🎉";
    document.getElementById("celebration-message").innerText = "لقد أتممت تحدي قراءة الإنجليزية لمده 30 يوماً بنجاح! محفظة مفرداتك المليئة بالكلمات أصبحت غنية جداً. عمل رائع ومميز!";
    btnCelebrationContinue.innerText = "إنهاء التحدي";
  } else {
    document.getElementById("celebration-title").innerText = `تم إكمال اليوم ${currentDayData.day} بنجاح!`;
    document.getElementById("celebration-message").innerText = `قراءة ممتازة! تم إنهاء اليوم ${currentDayData.day}. لقد فتحت قصص اليوم ${currentDayData.day + 1}! واصل التدرب والتعلّم لتطوير مفرداتك.`;
    btnCelebrationContinue.innerText = "الانتقال إلى اليوم التالي";
  }
  
  celebrationModal.classList.remove("hidden");
}

function transitionToNextDay() {
  celebrationModal.classList.add("hidden");
  
  if (currentDayIndex < 29) {
    currentDayIndex += 1;
    saveStateToStorage();
    loadActiveDayContent();
    renderSidebarDays();
    
    // Smooth scroll back to top of reader area
    document.querySelector(".reader-area").scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    // Final day completed, stay on screen and celebrate
    switchTab("wallet");
  }
}

/* ==========================================================================
   Focus Mode (وضع التركيز القراءة بدون مشتتات) Core Logic
   ========================================================================== */

let focusModeActive = false;
let focusSelectedTheme = "sepia";
let focusSelectedSize = "medium";
let focusSelectedSpeed = 0.75;
let focusXpAwardedToday = false;

function initFocusMode() {
  const btnFocus = document.getElementById("btn-focus-mode");
  const btnHeroFocus = document.getElementById("btn-hero-focus-mode");
  const focusCloseBtn = document.getElementById("focus-close-btn");
  const focusContainer = document.getElementById("focus-container");
  const focusStoryBox = document.getElementById("focus-story-box");
  const focusAudioPlayBtn = document.getElementById("focus-audio-play");
  const focusAudioPlayText = document.getElementById("focus-audio-play-text");
  const focusWaveAnim = document.getElementById("focus-wave-anim");

  // Global delegated handler for focus mode triggers (e.g. story mode, detective mode, header nav tab)
  document.addEventListener("click", (e) => {
    const triggerBtn = e.target.closest(".focus-trigger-btn");
    if (triggerBtn) {
      if (triggerBtn.id === "tab-focus-mode") {
        openFocusMode();
        enterFocusFullscreen();
      } else if (triggerBtn.id === "btn-detective-focus-mode" || activeGameMode === "detective") {
        openFocusMode("detective");
      } else {
        openFocusMode();
      }
    }
  });

  if (focusCloseBtn) {
    focusCloseBtn.addEventListener("click", closeFocusMode);
  }

  // Close on Escape key
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && focusModeActive) {
      closeFocusMode();
    }
  });

  // Themes Switcher
  const themeChips = document.querySelectorAll("[data-focus-theme]");
  themeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      themeChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      focusSelectedTheme = chip.getAttribute("data-focus-theme") || "sepia";
      if (focusContainer) {
        const isFullscreen = focusContainer.classList.contains("is-fullscreen");
        focusContainer.className = `focus-container theme-${focusSelectedTheme}${isFullscreen ? " is-fullscreen" : ""}`;
      }
      openFocusMode(focusSelectedTheme);
    });
  });

  // Font Size Switcher
  const sizeChips = document.querySelectorAll("[data-focus-size]");
  sizeChips.forEach(chip => {
    chip.addEventListener("click", () => {
      sizeChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      focusSelectedSize = chip.getAttribute("data-focus-size") || "medium";
      if (focusStoryBox) {
        focusStoryBox.className = `focus-story-box text-${focusSelectedSize}`;
      }
    });
  });

  // Audio Speed Switcher
  const speedChips = document.querySelectorAll("[data-focus-speed]");
  speedChips.forEach(chip => {
    chip.addEventListener("click", () => {
      speedChips.forEach(c => c.classList.remove("active"));
      chip.classList.add("active");
      focusSelectedSpeed = parseFloat(chip.getAttribute("data-focus-speed")) || 0.75;
      if (synth && synth.speaking) {
        playFocusAudio();
      }
    });
  });

  // Audio Play / Pause
  if (focusAudioPlayBtn) {
    focusAudioPlayBtn.addEventListener("click", () => {
      if (synth && synth.speaking) {
        synth.cancel();
        if (focusWaveAnim) focusWaveAnim.classList.remove("active");
        if (focusAudioPlayText) focusAudioPlayText.innerText = "الاستماع الصوتي للقصة";
      } else {
        playFocusAudio();
      }
    });
  }

  // Fullscreen Button in Focus Mode Header & Triggers
  const focusFullscreenBtn = document.getElementById("focus-fullscreen-btn");
  if (focusFullscreenBtn) {
    focusFullscreenBtn.addEventListener("click", toggleFocusFullscreen);
  }

  // Fullscreen Trigger Button in Interactive Modes Bar
  const btnFullscreenTrigger = document.getElementById("btn-fullscreen-mode-trigger");
  if (btnFullscreenTrigger) {
    btnFullscreenTrigger.addEventListener("click", () => {
      openFocusMode();
      toggleFocusFullscreen();
    });
  }
}

function enterFocusFullscreen() {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  const focusContainer = document.getElementById("focus-container");
  const focusFullscreenBtn = document.getElementById("focus-fullscreen-btn");
  if (!focusOverlay || !focusContainer) return;

  focusOverlay.classList.add("is-fullscreen");
  focusContainer.classList.add("is-fullscreen");
  if (focusFullscreenBtn) {
    focusFullscreenBtn.innerHTML = `<span>🗗</span><span class="fs-text">خروج من ملء الشاشة</span>`;
    focusFullscreenBtn.classList.add("active");
  }
  if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
    document.documentElement.requestFullscreen().catch(() => {});
  }
}

function toggleFocusFullscreen() {
  const focusContainer = document.getElementById("focus-container");
  if (!focusContainer) return;

  const isFs = focusContainer.classList.contains("is-fullscreen");
  if (!isFs) {
    enterFocusFullscreen();
    if (typeof showToastNotification === 'function') {
      showToastNotification("🖥️ ملء الشاشة", "تم تفعيل نمط ملء الشاشة الكامل للقراءة", "✨");
    }
  } else {
    exitFocusFullscreen();
  }
}

function exitFocusFullscreen() {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  const focusContainer = document.getElementById("focus-container");
  const focusFullscreenBtn = document.getElementById("focus-fullscreen-btn");

  if (focusOverlay) focusOverlay.classList.remove("is-fullscreen");
  if (focusContainer) focusContainer.classList.remove("is-fullscreen");
  if (focusFullscreenBtn) {
    focusFullscreenBtn.innerHTML = `<span>🖥️</span><span class="fs-text">ملء الشاشة</span>`;
    focusFullscreenBtn.classList.remove("active");
  }
  if (document.fullscreenElement && document.exitFullscreen) {
    document.exitFullscreen().catch(() => {});
  }
}

function openFocusMode(requestedTheme) {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  const focusDayTag = document.getElementById("focus-day-tag");
  const focusStoryTitle = document.getElementById("focus-story-title");
  const focusStoryBox = document.getElementById("focus-story-box");
  const focusTargetWordsGrid = document.getElementById("focus-target-words-grid");
  const focusWordsCountBadge = document.getElementById("focus-words-count-badge");
  const focusContainer = document.getElementById("focus-container");

  if (!focusOverlay) return;

  if (activeGameMode !== "detective") {
    if (requestedTheme && requestedTheme !== "detective") {
      focusSelectedTheme = requestedTheme;
    } else if (focusSelectedTheme === "detective" || !focusSelectedTheme) {
      focusSelectedTheme = "sepia";
    }
  } else {
    if (requestedTheme) {
      focusSelectedTheme = requestedTheme;
    } else {
      focusSelectedTheme = "detective";
    }
  }

  // Toggle visibility of detective theme chip in focus controls
  const detectiveChip = document.querySelector('[data-focus-theme="detective"]');
  if (detectiveChip) {
    detectiveChip.style.display = (activeGameMode === "detective") ? "inline-flex" : "none";
  }

  focusModeActive = true;
  focusOverlay.classList.remove("hidden");
  
  // Automatically trigger fullscreen mode on opening Focus Mode
  enterFocusFullscreen();

  // Sync theme active chips
  const themeChips = document.querySelectorAll("[data-focus-theme]");
  themeChips.forEach(c => {
    c.classList.toggle("active", c.getAttribute("data-focus-theme") === focusSelectedTheme);
  });

  if (focusContainer) {
    focusContainer.className = `focus-container theme-${focusSelectedTheme} is-fullscreen`;
  }

  const dayData = challengeData[currentDayIndex];
  if (!dayData) return;

  if (focusDayTag) {
    focusDayTag.innerText = (activeGameMode === "detective" && focusSelectedTheme === "detective")
      ? `🕵️ CASE ${String(dayData.day).padStart(2, '0')}`
      : `MISSION ${String(dayData.day).padStart(2, '0')}`;
  }
  if (focusStoryTitle) focusStoryTitle.innerText = dayData.title;

/* Detective Flashlight Audio & Smooth Motion Engine */
let detectiveAudioCtx = null;
let lastDetectiveSoundTime = 0;

function playDetectiveClueSound() {
  const nowMs = Date.now();
  if (nowMs - lastDetectiveSoundTime < 65) return;
  lastDetectiveSoundTime = nowMs;

  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!detectiveAudioCtx) {
      detectiveAudioCtx = new AudioCtx();
    }
    if (detectiveAudioCtx.state === "suspended") {
      detectiveAudioCtx.resume();
    }
    const now = detectiveAudioCtx.currentTime;
    const osc = detectiveAudioCtx.createOscillator();
    const gain = detectiveAudioCtx.createGain();

    osc.type = "sine";
    const freq = 820 + Math.random() * 200;
    osc.frequency.setValueAtTime(freq, now);
    osc.frequency.exponentialRampToValueAtTime(freq * 1.12, now + 0.05);

    gain.gain.setValueAtTime(0.025, now);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);

    osc.connect(gain);
    gain.connect(detectiveAudioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.07);
  } catch (e) {
    // Ignore audio restrictions
  }
}

let detectiveFlashlightActive = false;

function setupDetectiveFlashlight(focusStoryBox) {
  stopDetectiveFlashlight(focusStoryBox);
  if (!focusStoryBox) return;

  detectiveFlashlightActive = true;
  let ticking = false;

  const updatePos = (clientX, clientY) => {
    if (!ticking && detectiveFlashlightActive && focusStoryBox) {
      requestAnimationFrame(() => {
        if (!focusStoryBox || !detectiveFlashlightActive) return;
        const boxRect = focusStoryBox.getBoundingClientRect();
        const x = clientX - boxRect.left;
        const y = clientY - boxRect.top;
        focusStoryBox.style.setProperty("--flashlight-x", `${x.toFixed(1)}px`);
        focusStoryBox.style.setProperty("--flashlight-y", `${y.toFixed(1)}px`);
        ticking = false;
      });
      ticking = true;
    }
  };

  const handleTouch = (e) => {
    if (e.touches && e.touches[0]) {
      updatePos(e.touches[0].clientX, e.touches[0].clientY);
    }
  };

  focusStoryBox.onmousemove = (e) => updatePos(e.clientX, e.clientY);
  focusStoryBox.ontouchstart = handleTouch;
  focusStoryBox.ontouchmove = handleTouch;

  focusStoryBox.onmouseleave = () => {
    if (!focusStoryBox) return;
    focusStoryBox.style.setProperty("--flashlight-x", `50%`);
    focusStoryBox.style.setProperty("--flashlight-y", `50%`);
  };
}

function stopDetectiveFlashlight(focusStoryBox) {
  detectiveFlashlightActive = false;
  if (focusStoryBox) {
    focusStoryBox.onmousemove = null;
    focusStoryBox.ontouchstart = null;
    focusStoryBox.ontouchmove = null;
    focusStoryBox.onmouseleave = null;
  }
}

  // Render Story Words with dictionary interactive clicks
  if (focusStoryBox) {
    const isDetectiveMode = (activeGameMode === "detective" && focusSelectedTheme === "detective");
    const badgeText = '🔦 كشاف المحقق نَشِط — المَس أو تحرك بالماوس لإضاءة الكلمات والأدلة!';
    const badgeHtml = isDetectiveMode ? `<div class="detective-flashlight-badge">${badgeText}</div>` : '';

    focusStoryBox.innerHTML = badgeHtml + prepareStoryWordsHtml(dayData.story, dayData.dictionary);
    focusStoryBox.className = `focus-story-box text-${focusSelectedSize}${isDetectiveMode ? " detective-flashlight-enabled" : ""}`;

    if (isDetectiveMode) {
      setupDetectiveFlashlight(focusStoryBox);
    } else {
      stopDetectiveFlashlight(focusStoryBox);
    }
  }

  // Render Target Goals / Target Words Chips OR Detective Case File
  const focusGoalsHeader = document.querySelector(".focus-goals-header .goals-title");

  if (activeGameMode === "detective" && focusSelectedTheme === "detective") {
    if (focusGoalsHeader) {
      focusGoalsHeader.innerHTML = `<span class="goals-icon">🕵️</span><span>ملف القضية والأدلة الميدانية (وضع المحقق)</span>`;
    }

    const dictionary = dayData.dictionary || {};
    let validTargetWords = (dayData.target_words || []).filter(w => {
      const wLower = w.toLowerCase();
      return dayData.story.toLowerCase().includes(wLower);
    });
    if (validTargetWords.length === 0) {
      const dictKeys = Object.keys(dictionary);
      validTargetWords = dictKeys.filter(k => dayData.story.toLowerCase().includes(k.toLowerCase()));
    }

    const cluesToFind = validTargetWords.slice(0, 3).map((word, idx) => ({
      word: word.toLowerCase(),
      translation: getTranslationForWord(word, dictionary) || word,
      found: false,
      id: idx
    }));

    const quizQ = (dayData.quiz && dayData.quiz[0]) ? dayData.quiz[0] : {
      question: `ما الإثبات الرئيسي المذكور في أحداث قضية اليوم ${dayData.day}؟`,
      options: [dayData.title, "الهروب من التحدي", "النوم طوال اليوم"],
      answer: 0
    };

    if (focusWordsCountBadge) {
      focusWordsCountBadge.innerText = `الأدلة المفتشة: 0 / ${cluesToFind.length} 🔎`;
    }

    if (focusTargetWordsGrid) {
      focusTargetWordsGrid.innerHTML = `
        <div class="detective-case-box" style="width: 100%; border: none; background: transparent; padding: 0; box-shadow: none;">
          <!-- Detective Notebook / Clues Board -->
          <div class="detective-notebook" style="margin-bottom: 12px;">
            <div class="notebook-title">📓 مذكرة المحقق (الأدلة السرية المطلوب اكتشافها بالنص):</div>
            <div class="detective-clues-grid" id="focus-detective-clues-container">
              ${cluesToFind.map(clue => `
                <div class="detective-clue-chip ${clue.found ? 'found' : ''}" id="focus-detective-clue-${clue.id}">
                  <span class="clue-status-icon">${clue.found ? '✅' : '❓'}</span>
                  <span class="clue-word-tag">${clue.word}</span>
                  <span class="clue-trans-tag">${clue.found ? `= ${clue.translation}` : '(اضغط الكلمة في القصة)'}</span>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Detective Question & Verdict -->
          <div class="detective-interrogation-box">
            <div class="detective-question">❓ استجواب القضية: ${quizQ.question}</div>
            <div class="detective-options-grid" id="focus-detective-opts-container">
              ${quizQ.options.map((opt, i) => `
                <button class="detective-opt-btn focus-detective-opt-btn" data-idx="${i}">
                  <span class="opt-inspect-icon">🔎 دليل ${i + 1}</span>
                  <span class="opt-label-text">${opt}</span>
                </button>
              `).join('')}
            </div>
            
            <div class="detective-actions-row">
              <button class="btn-secondary" id="btn-focus-detective-hint" style="padding: 6px 14px; font-size: 0.88rem; background: rgba(245, 158, 11, 0.2); border-color: rgba(245, 158, 11, 0.4); color: #fef08a;">
                <span>🧠 طلب تلميح ذكي من المساعد</span>
              </button>
            </div>
            <div id="focus-detective-hint-box" class="detective-hint-callout hidden"></div>
          </div>
        </div>
      `;
    }

    // Attach event listeners for Smart Hint & Quiz inside Focus Mode
    let focusWrongAttempts = 0;
    let focusNonClueClicks = 0;
    let focusHintOpen = false;

    function renderFocusSmartHint(isAutoTrigger = false) {
      const hintBox = document.getElementById("focus-detective-hint-box");
      if (!hintBox) return;

      hintBox.classList.remove("hidden");
      focusHintOpen = true;

      const unfoundClues = cluesToFind.filter(c => !c.found);
      const targetClue = unfoundClues[0];

      let contentHtml = "";
      if (targetClue) {
        contentHtml = `
          <div class="smart-hint-header">
            <span class="smart-hint-badge">🧠 تلميح ذكي ${isAutoTrigger ? '(مساعدة تلقائية)' : ''}</span>
            <div>ابحث في نص القصة عن الكلمة الإنجليزية <code style="color:#fbbf24; font-weight:800; font-size:1rem;">"${targetClue.word}"</code> والتي تعني (<b>${targetClue.translation}</b>).</div>
          </div>
          <div class="smart-hint-actions">
            <button class="btn-smart-action" id="btn-focus-pulse-clue" title="تحديد موقع الكلمة بالنص">
              <span>✨ إضاءة الدليل بالنص</span>
            </button>
            <button class="btn-smart-action" id="btn-focus-eliminate-opt" title="استبعاد إجابة غير صحيحة">
              <span>❌ استبعاد إجابة خاطئة</span>
            </button>
          </div>
        `;
      } else {
        contentHtml = `
          <div class="smart-hint-header">
            <span class="smart-hint-badge">🧠 تلميح ذكي ${isAutoTrigger ? '(مساعدة تلقائية)' : ''}</span>
            <div>لقد عثرت على جميع الأدلة! الإجابة الصحيحة للسؤال <b>"${quizQ.question}"</b> هي الخيار رقم <b>${quizQ.answer + 1}</b> (<code>${quizQ.options[quizQ.answer]}</code>).</div>
          </div>
          <div class="smart-hint-actions">
            <button class="btn-smart-action" id="btn-focus-eliminate-opt">
              <span>❌ استبعاد إجابة خاطئة</span>
            </button>
          </div>
        `;
      }

      hintBox.innerHTML = contentHtml;

      const pulseBtn = hintBox.querySelector("#btn-focus-pulse-clue");
      if (pulseBtn && targetClue && focusStoryBox) {
        pulseBtn.onclick = () => {
          const wordNodes = focusStoryBox.querySelectorAll(".story-word, .untranslated-word");
          let foundNode = null;
          wordNodes.forEach(node => {
            const txt = node.innerText.toLowerCase().replace(/[^a-z]/g, "").trim();
            if (txt === targetClue.word || txt.includes(targetClue.word) || targetClue.word.includes(txt)) {
              node.classList.add("clue-pulse-target");
              if (!foundNode) foundNode = node;
              setTimeout(() => node.classList.remove("clue-pulse-target"), 4000);
            }
          });
          if (foundNode) {
            foundNode.scrollIntoView({ behavior: "smooth", block: "center" });
            showToastNotification("✨ تم إضاءة الدليل!", `انظر إلى الكلمة المضيئة في القصة: "${targetClue.word}"`, "💡");
          }
        };
      }

      const elimBtn = hintBox.querySelector("#btn-focus-eliminate-opt");
      if (elimBtn) {
        elimBtn.onclick = () => eliminateFocusWrongOption();
      }
    }

    function eliminateFocusWrongOption() {
      const optBtns = document.querySelectorAll(".focus-detective-opt-btn");
      const wrongIndices = [];
      optBtns.forEach((btn, i) => {
        if (i !== quizQ.answer && !btn.classList.contains("wrong") && !btn.classList.contains("eliminated")) {
          wrongIndices.push({ btn, i });
        }
      });

      if (wrongIndices.length > 0) {
        const pick = wrongIndices[Math.floor(Math.random() * wrongIndices.length)];
        pick.btn.classList.add("eliminated");
        pick.btn.innerHTML = `<span class="opt-inspect-icon">❌</span> <span style="text-decoration:line-through;">${pick.i + 1}. ${quizQ.options[pick.i]} (خيار مستبعد)</span>`;
        showToastNotification("❌ تم استبعاد خيار خاطئ!", `تم استبعاد الخيار رقم ${pick.i + 1}!`, "💡");
      } else {
        showToast("💡 تم استبعاد جميع الخيارات الخاطئة المتاحة!");
      }
    }

    const hintBtn = document.getElementById("btn-focus-detective-hint");
    if (hintBtn) {
      hintBtn.onclick = () => {
        renderFocusSmartHint(false);
        showToastNotification("💡 التلميحات الذكية", "تم تفعيل لوحة التلميح الذكي في وضع التركيز!", "🧠");
      };
    }

    const optBtns = document.querySelectorAll(".focus-detective-opt-btn");
    optBtns.forEach(btn => {
      btn.onclick = () => {
        if (btn.classList.contains("eliminated")) return;
        const idx = parseInt(btn.getAttribute("data-idx"), 10);
        if (idx === quizQ.answer) {
          btn.classList.add("correct");
          playCorrectAnswerSound();
          const verdictKey = `detective_verdict_day_${dayData.day}`;
          const isNewXp = awardXpOnce(verdictKey, 50, "حل لغز قضية المحقق بنجاح", btn);
          if (isNewXp) {
            showToastNotification("🎉 تم حل القضية بنجاح!", "إجابة دقيقة يا محقق! تم إغلاق القضية بنجاح بنسبة 100%. (+50 XP)", "🕵️");
          } else {
            showToastNotification("🎉 تم حل القضية بنجاح!", "إجابة دقيقة يا محقق! تم حسم قضية هذا الدرس سابقاً.", "🕵️");
          }
        } else {
          btn.classList.add("wrong");
          playIncorrectAnswerSound();
          focusWrongAttempts++;
          showToast("❌ استنتاج غير دقيق! تفقد الأدلة وحاول مرة أخرى.");
          if (focusWrongAttempts >= 2) {
            renderFocusSmartHint(true);
            eliminateFocusWrongOption();
            showToastNotification("💡 تلميح ذكي تلقائي", "تم تفعيل التلميحات واقتطاع خيار خاطئ لمساعدتك!", "🧠");
          }
        }
      };
    });

    if (focusStoryBox) {
      focusStoryBox.onclick = (e) => {
        const wordEl = e.target.closest(".story-word, .untranslated-word");
        if (!wordEl) return;

        const rawText = wordEl.innerText.trim();
        const wordText = rawText.toLowerCase().replace(/[^a-z]/g, "");

        const matchedClue = cluesToFind.find(c => !c.found && (c.word === wordText || wordText.includes(c.word) || c.word.includes(wordText)));
        if (matchedClue) {
          matchedClue.found = true;
          wordEl.classList.add("detective-found-clue");

          const clueChip = document.getElementById(`focus-detective-clue-${matchedClue.id}`);
          if (clueChip) {
            clueChip.classList.add("found");
            clueChip.innerHTML = `
              <span class="clue-status-icon">✅</span>
              <span class="clue-word-tag">${matchedClue.word}</span>
              <span class="clue-trans-tag">${matchedClue.translation} (دليل مكشوف)</span>
            `;
          }

          const foundCount = cluesToFind.filter(c => c.found).length;
          if (focusWordsCountBadge) {
            focusWordsCountBadge.innerText = `الأدلة المفتشة: ${foundCount} / ${cluesToFind.length} 🔎`;
          }

          showToastNotification(`🔎 كشف دليل: "${matchedClue.word}"`, `المعنى بالعربية: ${matchedClue.translation}`, "✨");

          if (foundCount === cluesToFind.length) {
            showToastNotification("✨ تم جمع كافة الأدلة!", "ممتاز يا محقق! أجب الآن على سؤال الاستجواب لحسم القضية.", "🏆");
          }
        } else {
          focusNonClueClicks++;
          if (focusNonClueClicks >= 4 && cluesToFind.some(c => !c.found) && !focusHintOpen) {
            renderFocusSmartHint(true);
            showToastNotification("💡 تلميح ذكي تلقائي", "تم تفعيل التلميح الذكي لمساعدتك في العثور على الدليل المتبقي!", "🧠");
          }
        }
      };
    }
  } else {
    if (focusGoalsHeader) {
      focusGoalsHeader.innerHTML = `<span class="goals-icon">🎯</span><span>أهداف القصة والكلمات المفتاحية اليومية</span>`;
    }
    const targetWords = dayData.target_words || [];
    if (focusWordsCountBadge) {
      focusWordsCountBadge.innerText = `${targetWords.length} كلمات مستهدفة`;
    }

    if (focusTargetWordsGrid) {
      focusTargetWordsGrid.innerHTML = targetWords.map(word => {
        const translation = getTranslationForWord(word, dayData.dictionary);
        const isSaved = isWordSaved(word);
        return `
          <div class="focus-target-chip">
            <span class="eng">${escapeHtml(word)}</span>
            <span class="arb">${escapeHtml(translation)}</span>
            <button class="speak-btn" onclick="speakWord('${word.replace(/'/g, "\\'")}')" title="استمع لنطق الكلمة">🔊</button>
            <button class="save-word-badge-btn ${isSaved ? 'saved' : ''}" data-focus-save="${escapeHtml(word)}" data-focus-trans="${escapeHtml(translation)}" title="حفظ إلى محفظة المفردات">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="star-icon"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </button>
          </div>
        `;
      }).join('');

      focusTargetWordsGrid.querySelectorAll("[data-focus-save]").forEach(btn => {
        btn.onclick = (e) => {
          e.stopPropagation();
          const word = btn.getAttribute("data-focus-save");
          const trans = btn.getAttribute("data-focus-trans");
          toggleWordSave(word, trans, "target");
        };
      });
    }
  }

  // Award bonus XP for using focus mode
  const focusKey = `focus_mode_day_${dayData.day}`;
  const isNewFocusXp = awardXpOnce(focusKey, 20, "تفعيل وضع تكبير القراءة بدون مشتتات", document.getElementById("btn-focus-mode"));
  if (isNewFocusXp && typeof showToastNotification === 'function') {
    showToastNotification("🔍 القراءة بدون مشتتات", "تم تفعيل وضع تكبير القراءة الخالي من المشتتات (+20 XP)", "🌟");
  }
}

function closeFocusMode() {
  const focusOverlay = document.getElementById("focus-mode-overlay");
  if (focusOverlay) {
    focusOverlay.classList.add("hidden");
  }
  focusModeActive = false;
  exitFocusFullscreen();

  const focusStoryBox = document.getElementById("focus-story-box");
  if (typeof stopDetectiveFlashlight === 'function') {
    stopDetectiveFlashlight(focusStoryBox);
  }
  
  if (synth) {
    synth.cancel();
  }

  const focusWaveAnim = document.getElementById("focus-wave-anim");
  const focusAudioPlayText = document.getElementById("focus-audio-play-text");
  if (focusWaveAnim) focusWaveAnim.classList.remove("active");
  if (focusAudioPlayText) focusAudioPlayText.innerText = "الاستماع الصوتي للقصة";
}

function playFocusAudio() {
  if (!synth) return;
  synth.cancel();

  const dayData = challengeData[currentDayIndex];
  if (!dayData || !dayData.story) return;

  const focusWaveAnim = document.getElementById("focus-wave-anim");
  const focusAudioPlayText = document.getElementById("focus-audio-play-text");

  // Refresh story words HTML in focusStoryBox when starting audio
  const focusStoryBox = document.getElementById("focus-story-box");
  if (focusStoryBox) {
    const isDetectiveMode = (activeGameMode === "detective" && focusSelectedTheme === "detective");
    const badgeText = '🔦 كشاف المحقق نَشِط — المَس أو تحرك بالماوس لإضاءة الكلمات والأدلة!';
    const badgeHtml = isDetectiveMode ? `<div class="detective-flashlight-badge">${badgeText}</div>` : '';

    focusStoryBox.innerHTML = badgeHtml + prepareStoryWordsHtml(dayData.story, dayData.dictionary);
    focusStoryBox.className = `focus-story-box text-${focusSelectedSize}${isDetectiveMode ? " detective-flashlight-enabled" : ""}`;

    if (isDetectiveMode && typeof setupDetectiveFlashlight === 'function') {
      setupDetectiveFlashlight(focusStoryBox);
    }
  }

  const storyText = typeof correctTextForSpeech === 'function' ? correctTextForSpeech(dayData.story) : dayData.story;
  const utt = new SpeechSynthesisUtterance(storyText);
  utt.lang = 'en-US';
  utt.rate = focusSelectedSpeed || 0.75;

  if (focusWaveAnim) focusWaveAnim.classList.add("active");
  if (focusAudioPlayText) focusAudioPlayText.innerText = "إيقاف الاستماع";

  // Synchronized word boundary highlighting
  utt.onboundary = function(event) {
    if (event.name === 'word') {
      const charIndex = event.charIndex;
      const spans = document.querySelectorAll("#focus-story-box .story-word, #focus-story-box .untranslated-word, #story-text-view .story-word, #story-text-view .untranslated-word");
      
      let matchedSpan = null;
      let minDistance = Infinity;
      
      spans.forEach(span => {
        const start = parseInt(span.getAttribute("data-start"), 10);
        const end = parseInt(span.getAttribute("data-end"), 10);
        
        if (!isNaN(start) && !isNaN(end)) {
          if (charIndex >= start && charIndex < end) {
            matchedSpan = span;
          } else {
            const dist = Math.abs(start - charIndex);
            if (dist < minDistance) {
              minDistance = dist;
              if (!matchedSpan && dist <= 3) {
                matchedSpan = span;
              }
            }
          }
        }
      });
      
      if (matchedSpan) {
        spans.forEach(span => {
          if (span === matchedSpan) {
            span.classList.add("active-speaking");
            span.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
          } else {
            span.classList.remove("active-speaking");
          }
        });
      }
    }
  };

  const stopFocusAudio = () => {
    if (focusWaveAnim) focusWaveAnim.classList.remove("active");
    if (focusAudioPlayText) focusAudioPlayText.innerText = "الاستماع الصوتي للقصة";
    document.querySelectorAll(".story-word, .untranslated-word").forEach(span => {
      span.classList.remove("active-speaking");
    });
  };

  utt.onend = stopFocusAudio;
  utt.onerror = stopFocusAudio;

  synth.speak(utt);
}


/* ==========================================================================
   Trigger App Lifecycle Initialization
   ========================================================================== */
window.addEventListener("DOMContentLoaded", initializeApp);

