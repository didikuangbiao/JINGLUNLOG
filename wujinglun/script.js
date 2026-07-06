const canvas = document.querySelector("#pixel-field");
const ctx = canvas.getContext("2d");
const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = [...document.querySelectorAll(".nav-links a")];
const buttons = [...document.querySelectorAll(".pixel-button")];
const sections = [...document.querySelectorAll("main section[id]")];
const wechatTrigger = document.querySelector(".wechat-trigger");
const wechatModal = document.querySelector("#wechatModal");
const wechatModalClose = wechatModal?.querySelector(".wechat-modal__close");
const wechatCloseTargets = [...document.querySelectorAll("[data-close-wechat]")];
const randomSaveTrigger = document.querySelector("#random-save-trigger");
const randomSaveModal = document.querySelector("#random-save-modal");
const randomSaveContent = document.querySelector("#random-save-content");
const randomSaveReroll = document.querySelector("#random-save-reroll");
const randomSaveViewDay = document.querySelector("#random-save-view-day");
const randomSaveCloseTargets = [...document.querySelectorAll("[data-close-random]")];
const archiveGate = document.querySelector("#archive-gate");
const archiveGatePanel = archiveGate?.querySelector(".archive-gate__panel");
const archiveLoginPanel = document.querySelector("#archive-login-panel");
const archiveRecoveryPanel = document.querySelector("#archive-recovery-panel");
const archiveLoginForm = document.querySelector("#archive-login-form");
const archivePasswordInput = document.querySelector("#archive-password");
const archiveGateMessage = document.querySelector("#archive-gate-message");
const archiveForgot = document.querySelector("#archive-forgot");
const archiveRecoveryForm = document.querySelector("#archive-recovery-form");
const archiveRecoveryKeyInput = document.querySelector("#archive-recovery-key");
const archiveResetForm = document.querySelector("#archive-reset-form");
const archiveNewPassword = document.querySelector("#archive-new-password");
const archiveConfirmPassword = document.querySelector("#archive-confirm-password");
const archiveBackLogin = document.querySelector("#archive-back-login");
const archiveRecoveryMessage = document.querySelector("#archive-recovery-message");
const archiveLock = document.querySelector("#archive-lock");

// Pure front-end access protection for a private local site.
// Default password is 20010904; after recovery reset, the local password in
// localStorage is used instead. This is not real encryption or strong security.
const DEFAULT_ARCHIVE_PASSWORD = "20010904";
const PASSWORD_STORAGE_KEY = "pixelArchivePassword";
const UNLOCK_STORAGE_KEY = "pixelArchiveUnlocked";
const ARCHIVE_RECOVERY_KEY = "LEIJIE-0509";

let width = 0;
let height = 0;
let pixels = [];
let mouse = { x: 0.5, y: 0.5 };
let wechatLastFocus = null;
const colors = ["#00f0ff", "#ff3df2", "#5dff8f", "#ffe66d", "#8b5cff"];

// Rebuild the particle field whenever the viewport changes.
function resizeCanvas() {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = window.innerWidth;
  height = window.innerHeight;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const count = Math.min(120, Math.floor((width * height) / 10500));
  pixels = Array.from({ length: count }, () => createPixel(true));
}

function createPixel(randomY = false) {
  const size = 3 + Math.floor(Math.random() * 4) * 3;
  return {
    x: Math.random() * width,
    y: randomY ? Math.random() * height : -size,
    size,
    speed: 0.28 + Math.random() * 1.2,
    drift: -0.35 + Math.random() * 0.7,
    color: colors[Math.floor(Math.random() * colors.length)],
    alpha: 0.24 + Math.random() * 0.54
  };
}

// Tiny glowing blocks create the starfield / matrix-rain hybrid.
function drawPixelField() {
  ctx.clearRect(0, 0, width, height);

  for (const pixel of pixels) {
    const pullX = (mouse.x - 0.5) * 1.4;
    const pullY = (mouse.y - 0.5) * 0.8;
    pixel.x += pixel.drift + pullX;
    pixel.y += pixel.speed + pullY;

    if (pixel.y > height + 20 || pixel.x < -40 || pixel.x > width + 40) {
      Object.assign(pixel, createPixel(false));
    }

    ctx.globalAlpha = pixel.alpha;
    ctx.fillStyle = pixel.color;
    ctx.fillRect(Math.round(pixel.x), Math.round(pixel.y), pixel.size, pixel.size);

    ctx.globalAlpha = pixel.alpha * 0.18;
    ctx.fillRect(Math.round(pixel.x - pixel.size), Math.round(pixel.y - pixel.size), pixel.size * 3, pixel.size * 3);
  }

  ctx.globalAlpha = 1;
  requestAnimationFrame(drawPixelField);
}

// Mobile navigation and active-section highlighting.
function closeMobileNav() {
  navLinks.classList.remove("open");
  navToggle.setAttribute("aria-expanded", "false");
}

navToggle.addEventListener("click", () => {
  const isOpen = navLinks.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navItems.forEach((item) => {
  item.addEventListener("click", closeMobileNav);
});

buttons.forEach((button) => {
  button.addEventListener("pointerdown", () => button.classList.add("is-pressed"));
  button.addEventListener("pointerup", () => button.classList.remove("is-pressed"));
  button.addEventListener("pointerleave", () => button.classList.remove("is-pressed"));
});

window.addEventListener("mousemove", (event) => {
  mouse = {
    x: event.clientX / Math.max(width, 1),
    y: event.clientY / Math.max(height, 1)
  };
  document.documentElement.style.setProperty("--px", (mouse.x - 0.5).toFixed(3));
  document.documentElement.style.setProperty("--py", (mouse.y - 0.5).toFixed(3));
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    navItems.forEach((item) => {
      item.classList.toggle("active", item.getAttribute("href") === `#${entry.target.id}`);
    });
  });
}, { rootMargin: "-45% 0px -50% 0px", threshold: 0.01 });

sections.forEach((section) => observer.observe(section));

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
drawPixelField();

function getArchivePassword() {
  return localStorage.getItem(PASSWORD_STORAGE_KEY) || DEFAULT_ARCHIVE_PASSWORD;
}

function setArchiveMessage(target, text = "", type = "") {
  if (!target) return;
  target.textContent = text;
  target.classList.toggle("is-error", type === "error");
  target.classList.toggle("is-success", type === "success");
}

function pulseArchivePanel(className) {
  if (!archiveGatePanel) return;
  archiveGatePanel.classList.remove(className);
  void archiveGatePanel.offsetWidth;
  archiveGatePanel.classList.add(className);
  window.setTimeout(() => archiveGatePanel.classList.remove(className), 560);
}

function showArchiveLogin(message = "", type = "") {
  if (archiveLoginPanel) archiveLoginPanel.hidden = false;
  if (archiveRecoveryPanel) archiveRecoveryPanel.hidden = true;
  if (archiveResetForm) archiveResetForm.hidden = true;
  archiveRecoveryForm?.reset();
  archiveResetForm?.reset();
  setArchiveMessage(archiveRecoveryMessage, "");
  setArchiveMessage(archiveGateMessage, message, type);
  archivePasswordInput?.focus();
}

function showArchiveRecovery() {
  if (archiveLoginPanel) archiveLoginPanel.hidden = true;
  if (archiveRecoveryPanel) archiveRecoveryPanel.hidden = false;
  if (archiveResetForm) archiveResetForm.hidden = true;
  archiveRecoveryForm?.reset();
  archiveResetForm?.reset();
  setArchiveMessage(archiveGateMessage, "");
  setArchiveMessage(archiveRecoveryMessage, "");
  archiveRecoveryKeyInput?.focus();
}

function openArchiveGate(message = "", type = "") {
  if (!archiveGate) return;
  archiveGate.classList.add("is-open");
  archiveGate.setAttribute("aria-hidden", "false");
  document.body.classList.add("archive-locked");
  showArchiveLogin(message, type);
}

function closeArchiveGate() {
  if (!archiveGate) return;
  archiveGate.classList.remove("is-open");
  archiveGate.setAttribute("aria-hidden", "true");
  document.body.classList.remove("archive-locked");
  archiveLoginForm?.reset();
  archiveRecoveryForm?.reset();
  archiveResetForm?.reset();
  setArchiveMessage(archiveGateMessage, "");
  setArchiveMessage(archiveRecoveryMessage, "");
}

function unlockArchive() {
  sessionStorage.setItem(UNLOCK_STORAGE_KEY, "true");
  closeArchiveGate();
}

function lockArchive() {
  sessionStorage.removeItem(UNLOCK_STORAGE_KEY);
  closeWechatModal();
  if (typeof closePixelWorld === "function") {
    closePixelWorld();
  }
  openArchiveGate("存档已锁定，请重新输入访问密钥。", "success");
}

function initializeArchiveGate() {
  if (sessionStorage.getItem(UNLOCK_STORAGE_KEY) === "true") {
    closeArchiveGate();
    return;
  }
  openArchiveGate();
}

archiveLoginForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const password = archivePasswordInput?.value || "";
  if (password === getArchivePassword()) {
    unlockArchive();
    return;
  }
  setArchiveMessage(archiveGateMessage, "访问密钥错误，无法读取存档权限。", "error");
  pulseArchivePanel("is-error");
  archivePasswordInput?.select();
});

archiveForgot?.addEventListener("click", showArchiveRecovery);

archiveRecoveryForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const recoveryKey = archiveRecoveryKeyInput?.value.trim() || "";
  if (recoveryKey !== ARCHIVE_RECOVERY_KEY) {
    setArchiveMessage(archiveRecoveryMessage, "恢复密钥错误，无法读取存档权限。", "error");
    pulseArchivePanel("is-error");
    archiveRecoveryKeyInput?.select();
    return;
  }

  if (archiveResetForm) archiveResetForm.hidden = false;
  setArchiveMessage(archiveRecoveryMessage, "恢复密钥正确，请设置新的访问密钥。", "success");
  pulseArchivePanel("is-success");
  archiveNewPassword?.focus();
});

archiveResetForm?.addEventListener("submit", (event) => {
  event.preventDefault();
  const newPassword = archiveNewPassword?.value || "";
  const confirmPassword = archiveConfirmPassword?.value || "";

  if (newPassword.length < 4) {
    setArchiveMessage(archiveRecoveryMessage, "访问密钥至少需要 4 位。", "error");
    pulseArchivePanel("is-error");
    archiveNewPassword?.focus();
    return;
  }

  if (newPassword !== confirmPassword) {
    setArchiveMessage(archiveRecoveryMessage, "两次输入不一致。", "error");
    pulseArchivePanel("is-error");
    archiveConfirmPassword?.select();
    return;
  }

  localStorage.setItem(PASSWORD_STORAGE_KEY, newPassword);
  if (archivePasswordInput) archivePasswordInput.value = "";
  pulseArchivePanel("is-success");
  showArchiveLogin("访问密钥已更新。", "success");
});

archiveBackLogin?.addEventListener("click", () => {
  showArchiveLogin();
});

archiveLock?.addEventListener("click", lockArchive);
initializeArchiveGate();

function openWechatModal() {
  if (!wechatModal) return;
  wechatLastFocus = document.activeElement;
  wechatModal.classList.add("is-open");
  wechatModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  wechatModalClose?.focus();
}

function closeWechatModal() {
  if (!wechatModal || !wechatModal.classList.contains("is-open")) return;
  wechatModal.classList.remove("is-open");
  wechatModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (wechatLastFocus instanceof HTMLElement) {
    wechatLastFocus.focus();
  }
}

wechatTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  openWechatModal();
});

wechatCloseTargets.forEach((target) => {
  target.addEventListener("click", closeWechatModal);
});

window.addEventListener("keydown", (event) => {
  if (event.key === "Escape" && diaryImportModal?.classList.contains("is-open")) {
    event.preventDefault();
    closeImportModal();
  }

  if (event.key === "Escape" && wechatModal?.classList.contains("is-open")) {
    event.preventDefault();
    closeWechatModal();
  }

  if (event.key === "Escape" && randomSaveModal?.classList.contains("is-open")) {
    event.preventDefault();
    closeRandomSaveModal();
  }
});

// Local diary archive: entries are saved only in this browser via localStorage.
const diaryForm = document.querySelector("#diary-form");
const diaryTitle = document.querySelector("#diary-title");
const diaryMood = document.querySelector("#diary-mood");
const diaryTags = document.querySelector("#diary-tags");
const diaryContent = document.querySelector("#diary-content");
const diaryList = document.querySelector("#diary-list");
const diarySearch = document.querySelector("#diary-search");
const diaryCount = document.querySelector("#diary-count");
const diaryClear = document.querySelector("#diary-clear");
const diaryExport = document.querySelector("#diary-export");
const diaryImport = document.querySelector("#diary-import");
const diaryImportFile = document.querySelector("#diary-import-file");
const diaryImportModal = document.querySelector("#diary-import-modal");
const diaryImportSummary = document.querySelector("#import-modal-summary");
const diaryImportMerge = document.querySelector("#import-merge");
const diaryImportOverwrite = document.querySelector("#import-overwrite");
const diaryImportCloseTargets = [...document.querySelectorAll("[data-close-import]")];
const saveFeedback = document.querySelector("#save-feedback");
const hudTodayWritten = document.querySelector("#hud-today-written");
const hudRecentMood = document.querySelector("#hud-recent-mood");
const hudTotalCount = document.querySelector("#hud-total-count");
const hudLastSave = document.querySelector("#hud-last-save");
const hudCurrentSpecies = document.querySelector("#hud-current-species");
const DIARY_STORAGE_KEY = "jinglun_pixel_diaries";
const LEGACY_DIARY_STORAGE_KEYS = [
  "jinglun-pixel-diary-v1",
  "pixelDiaryEntries",
  "diaryEntries",
  "pixel_diary_entries"
];
let pendingImportEntries = [];
let saveFeedbackTimer = null;

function parseDiaryEntries(value, key) {
  if (!value) return [];
  try {
    const entries = JSON.parse(value);
    return Array.isArray(entries) ? entries : [];
  } catch (error) {
    console.warn("日记存档读取失败", key, error);
    return [];
  }
}

function escapeHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatTime(dateString) {
  const date = dateString ? new Date(dateString) : new Date();
  if (Number.isNaN(date.getTime())) {
    return "未知时间";
  }
  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  }).format(date);
}

function createDiaryId() {
  return window.crypto?.randomUUID ? window.crypto.randomUUID() : `diary-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function normalizeDiaryTags(tags) {
  if (Array.isArray(tags)) {
    return tags.map((tag) => String(tag).trim()).filter(Boolean);
  }
  if (typeof tags === "string") {
    return tags.split(/[,，#\s]+/).map((tag) => tag.trim()).filter(Boolean);
  }
  return [];
}

function normalizeDiaryEntry(entry, index = 0) {
  const source = entry && typeof entry === "object" ? entry : {};
  const createdAt = source.createdAt || source.date || source.time || source.savedAt || new Date().toISOString();
  return {
    id: source.id || `${createdAt}-${index}-${createDiaryId()}`,
    title: source.title || source.name || "未命名存档",
    mood: source.mood || source.feeling || "未标记",
    tags: normalizeDiaryTags(source.tags),
    content: source.content || source.text || source.body || source.note || "",
    createdAt,
    updatedAt: source.updatedAt || source.modifiedAt || source.editedAt || createdAt
  };
}

function saveDiaryEntries(entries) {
  const normalizedEntries = Array.isArray(entries) ? entries.map(normalizeDiaryEntry) : [];
  localStorage.setItem(DIARY_STORAGE_KEY, JSON.stringify(normalizedEntries));
  return normalizedEntries;
}

function getDiaryEntries() {
  const currentRaw = localStorage.getItem(DIARY_STORAGE_KEY);
  let sourceKey = DIARY_STORAGE_KEY;
  let rawValue = currentRaw;

  if (rawValue === null) {
    const legacyKey = LEGACY_DIARY_STORAGE_KEYS.find((key) => localStorage.getItem(key) !== null);
    if (legacyKey) {
      sourceKey = legacyKey;
      rawValue = localStorage.getItem(legacyKey);
    }
  }

  const rawEntries = parseDiaryEntries(rawValue, sourceKey);
  const normalizedEntries = rawEntries.map(normalizeDiaryEntry);
  const normalizedJSON = JSON.stringify(normalizedEntries);

  if (sourceKey !== DIARY_STORAGE_KEY || (rawValue !== null && rawValue !== normalizedJSON)) {
    localStorage.setItem(DIARY_STORAGE_KEY, normalizedJSON);
  }

  console.log("当前日记 key:", DIARY_STORAGE_KEY);
  console.log("读取到的日记数量:", normalizedEntries.length);
  return normalizedEntries;
}

function createDiaryEntry(data) {
  const now = new Date().toISOString();
  return normalizeDiaryEntry({
    ...data,
    id: data?.id || createDiaryId(),
    createdAt: data?.createdAt || now,
    updatedAt: data?.updatedAt || now
  });
}

function readDiaryEntries() {
  return getDiaryEntries();
}

function writeDiaryEntries(entries) {
  return saveDiaryEntries(entries);
}

function getNormalizedDiaryEntries() {
  return getDiaryEntries();
}

function isSameLocalDay(dateString, referenceDate = new Date()) {
  const date = dateString ? new Date(dateString) : null;
  if (!date || Number.isNaN(date.getTime())) return false;
  return date.getFullYear() === referenceDate.getFullYear()
    && date.getMonth() === referenceDate.getMonth()
    && date.getDate() === referenceDate.getDate();
}

function getLatestDiaryEntry(entries) {
  return [...entries].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt || 0).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt || 0).getTime();
    return timeB - timeA;
  })[0] || null;
}

function renderDiaryHud() {
  if (!hudTodayWritten || !hudRecentMood || !hudTotalCount || !hudLastSave || !hudCurrentSpecies) return;

  const entries = getDiaryEntries();
  const latestEntry = getLatestDiaryEntry(entries);
  const hasTodayEntry = entries.some((entry) => isSameLocalDay(entry.createdAt));
  const latestMood = latestEntry?.mood || "未记录";
  const species = latestEntry ? getSpeciesForDiaryEntry(latestEntry) : null;

  hudTodayWritten.textContent = hasTodayEntry ? "今日已写入" : "今日未写入";
  hudRecentMood.textContent = latestMood;
  hudTotalCount.textContent = String(entries.length);
  hudLastSave.textContent = latestEntry ? formatTime(latestEntry.updatedAt || latestEntry.createdAt) : "暂无存档";
  hudCurrentSpecies.textContent = species ? `${species.name} ${species.englishName}` : "等待收录";
}

function refreshDiaryViews() {
  renderDiaryEntries();
  if (typeof renderDiaryHud === "function") renderDiaryHud();
  if (typeof renderDiaryHUD === "function") renderDiaryHUD();
  if (typeof updateDiaryHud === "function") updateDiaryHud();
  if (typeof updateDiaryHUD === "function") updateDiaryHUD();
  if (typeof renderDiaryCalendar === "function") renderDiaryCalendar();
  if (typeof renderCalendar === "function") renderCalendar();
  if (typeof renderArchiveMap === "function") renderArchiveMap();
}

// ===== Archive Map / 存档星图 =====
const ARCHIVE_MAP_MOOD_COLORS = {
  "开心": "#5dff8f",
  "烦躁": "#ff3d5a",
  "低落": "#5aa7ff",
  "兴奋": "#ffe66d",
  "思考中": "#8b5cff",
  "平静": "#00f0ff",
  "加载中": "#a07ab8"
};
const ARCHIVE_MAP_DEFAULT_COLOR = "#5dff8f";

const archivePrevMonthBtn = document.querySelector("#archive-prev-month");
const archiveNextMonthBtn = document.querySelector("#archive-next-month");
const archiveCalendarGrid = document.querySelector("#archive-calendar-grid");
const archiveCalendarTitle = document.querySelector("#archive-calendar-title");
const archiveDayDetail = document.querySelector("#archive-day-detail");

let archiveMapYear = new Date().getFullYear();
let archiveMapMonth = new Date().getMonth();
let archiveMapSelectedKey = null;

function padArchiveNumber(value) {
  return String(value).padStart(2, "0");
}

function getArchiveDateKey(date) {
  return `${date.getFullYear()}-${padArchiveNumber(date.getMonth() + 1)}-${padArchiveNumber(date.getDate())}`;
}

function getArchiveEntryDateKey(entry) {
  const ts = entry?.createdAt || entry?.date || entry?.savedAt || entry?.updatedAt;
  const parsed = ts ? new Date(ts) : new Date();
  if (Number.isNaN(parsed.getTime())) return null;
  return getArchiveDateKey(parsed);
}

function getArchiveTodayKey() {
  return getArchiveDateKey(new Date());
}

function getArchiveMoodColor(mood) {
  return ARCHIVE_MAP_MOOD_COLORS[mood] || ARCHIVE_MAP_DEFAULT_COLOR;
}

function summarizeArchiveContent(content, limit = 80) {
  const compact = String(content || "").replace(/\s+/g, " ").trim();
  if (!compact) return "这篇存档暂时没有内容。";
  return compact.length > limit ? `${compact.slice(0, limit)}…` : compact;
}

function getArchiveMapIndex() {
  const groups = {};
  for (const entry of getDiaryEntries()) {
    const key = getArchiveEntryDateKey(entry);
    if (!key) continue;
    if (!groups[key]) {
      groups[key] = { entries: [], count: 0 };
    }
    groups[key].entries.push(entry);
    groups[key].count += 1;
  }
  for (const key of Object.keys(groups)) {
    const sorted = groups[key].entries
      .slice()
      .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));
    const latestEntry = sorted[0];
    groups[key].latestEntry = latestEntry;
    groups[key].latestMood = latestEntry?.mood || "未标记";
    groups[key].color = getArchiveMoodColor(groups[key].latestMood);
  }
  return groups;
}

function renderArchiveMap() {
  if (!archiveCalendarGrid || !archiveCalendarTitle) return;

  const today = new Date();
  if (!archiveMapSelectedKey || !archiveMapSelectedKey.startsWith(`${archiveMapYear}-${padArchiveNumber(archiveMapMonth + 1)}-`)) {
    archiveMapSelectedKey = null;
  }

  const groups = getArchiveMapIndex();
  const todayKey = getArchiveTodayKey();

  archiveCalendarTitle.textContent = `${archiveMapYear} / ${padArchiveNumber(archiveMapMonth + 1)}`;

  const firstDay = new Date(archiveMapYear, archiveMapMonth, 1);
  const startWeekday = firstDay.getDay();
  const daysInMonth = new Date(archiveMapYear, archiveMapMonth + 1, 0).getDate();

  const cells = [];

  for (let i = 0; i < startWeekday; i += 1) {
    cells.push(`<div class="archive-calendar-day is-empty" aria-hidden="true"></div>`);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const key = `${archiveMapYear}-${padArchiveNumber(archiveMapMonth + 1)}-${padArchiveNumber(day)}`;
    const group = groups[key];
    const isToday = key === todayKey;
    const isSelected = key === archiveMapSelectedKey;
    const hasEntry = !!group;
    const moodColor = group?.color || ARCHIVE_MAP_DEFAULT_COLOR;
    const count = group?.count || 0;

    const classes = ["archive-calendar-day"];
    if (hasEntry) classes.push("has-entry");
    if (isToday) classes.push("is-today");
    if (isSelected) classes.push("is-selected");

    cells.push(`
      <button type="button"
              class="${classes.join(' ')}"
              data-date-key="${key}"
              style="--day-color: ${moodColor};"
              aria-label="${archiveMapYear}年${parseInt(key.slice(5,7), 10)}月${parseInt(key.slice(8,10), 10)}日${hasEntry ? `，${count}篇存档` : '，无存档'}">
        <span class="archive-calendar-day__num">${day}</span>
        ${count > 1 ? `<span class="archive-calendar-day__count">x${count}</span>` : ''}
      </button>
    `);
  }

  archiveCalendarGrid.innerHTML = cells.join("");

  archiveCalendarGrid.querySelectorAll(".archive-calendar-day").forEach((cell) => {
    cell.addEventListener("click", () => {
      const key = cell.dataset.dateKey;
      if (key) selectArchiveDate(key);
    });
  });

  renderArchiveDayDetail(groups);
}

function selectArchiveDate(dateKey) {
  if (!dateKey) return;
  archiveMapSelectedKey = archiveMapSelectedKey === dateKey ? null : dateKey;
  renderArchiveMap();
}

function renderArchiveDayDetail(groups) {
  if (!archiveDayDetail) return;

  if (!archiveMapSelectedKey) {
    archiveDayDetail.innerHTML = `
      <div class="archive-day-detail__placeholder">
        <span class="archive-day-detail__led" aria-hidden="true"></span>
        <p>点击左侧日期，查看当天存档。</p>
        <p class="archive-day-detail__hint">发光的日期 = 写过日记；暗色日期 = 还没存档。</p>
      </div>`;
    return;
  }

  const [year, monthRaw, dayRaw] = archiveMapSelectedKey.split("-");
  const monthNum = parseInt(monthRaw, 10);
  const dayNum = parseInt(dayRaw, 10);
  const headingDate = `${year} 年 ${monthNum} 月 ${dayNum} 日`;
  const group = groups[archiveMapSelectedKey];

  if (!group) {
    archiveDayDetail.innerHTML = `
      <header class="archive-day-detail__header">
        <p class="eyebrow">DAY VIEW</p>
        <h3>${headingDate}</h3>
      </header>
      <div class="archive-day-detail__empty">
        <p>这一天还没有存档。</p>
        <button class="pixel-button primary" type="button" data-archive-write="${archiveMapSelectedKey}">写下这一天</button>
      </div>`;
    bindArchiveWriteButton();
    return;
  }

  const entries = group.entries
    .slice()
    .sort((a, b) => new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0));

  const cards = entries.map((entry) => `
    <article class="archive-day-entry" style="--entry-color: ${getArchiveMoodColor(entry.mood)};">
      <header>
        <h4>${escapeHTML(entry.title)}</h4>
        <span class="archive-day-entry__mood">${escapeHTML(entry.mood)}</span>
      </header>
      <time datetime="${entry.createdAt}">${formatTime(entry.createdAt)}</time>
      ${renderDiaryTags(entry.tags)}
      <p>${escapeHTML(summarizeArchiveContent(entry.content, 80))}</p>
    </article>
  `).join("");

  archiveDayDetail.innerHTML = `
    <header class="archive-day-detail__header">
      <p class="eyebrow">DAY VIEW</p>
      <h3>${headingDate}</h3>
      <p class="archive-day-detail__meta">
        <span style="--entry-color: ${group.color};">${group.count} 篇存档</span>
        <span>主要心情：${escapeHTML(group.latestMood)}</span>
      </p>
    </header>
    <div class="archive-day-detail__list">${cards}</div>
  `;
}

function bindArchiveWriteButton() {
  const btn = archiveDayDetail?.querySelector("[data-archive-write]");
  if (!btn) return;
  btn.addEventListener("click", () => {
    const key = btn.dataset.archiveWrite;
    if (key) startWritingForArchiveDay(key);
  });
}

function startWritingForArchiveDay(dateKey) {
  if (!dateKey) return;
  const titleInput = document.querySelector("#diary-title");
  if (titleInput) {
    titleInput.value = `${dateKey} 的存档`;
    titleInput.focus();
    try {
      titleInput.setSelectionRange(titleInput.value.length, titleInput.value.length);
    } catch (error) {
      /* ignore unsupported selection */
    }
  }
  document.querySelector("#diary")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function shiftArchiveMapMonth(delta) {
  archiveMapMonth += delta;
  if (archiveMapMonth > 11) {
    archiveMapMonth = 0;
    archiveMapYear += 1;
  } else if (archiveMapMonth < 0) {
    archiveMapMonth = 11;
    archiveMapYear -= 1;
  }
  archiveMapSelectedKey = null;
  renderArchiveMap();
}

archivePrevMonthBtn?.addEventListener("click", () => shiftArchiveMapMonth(-1));
archiveNextMonthBtn?.addEventListener("click", () => shiftArchiveMapMonth(1));

function renderDiaryTags(tags) {
  const normalizedTags = normalizeDiaryTags(tags);
  if (!normalizedTags.length) return "";
  return `
    <div class="diary-entry-tags" aria-label="日记标签">
      ${normalizedTags.map((tag) => `<span>${escapeHTML(tag)}</span>`).join("")}
    </div>
  `;
}

function showSaveFeedback() {
  if (!saveFeedback) return;
  window.clearTimeout(saveFeedbackTimer);
  saveFeedback.classList.add("is-open");
  saveFeedback.setAttribute("aria-hidden", "false");
  saveFeedbackTimer = window.setTimeout(() => {
    saveFeedback.classList.remove("is-open");
    saveFeedback.setAttribute("aria-hidden", "true");
  }, 2000);
}

function getSpeciesForMood(mood) {
  const moodText = String(mood || "");
  return emotionSpecies.find((species) => (
    species.keywords.some((keyword) => moodText.includes(keyword))
  )) || emotionSpecies.find((species) => species.id === "thoughtling");
}

function getDiarySpeciesText(entry) {
  const tags = normalizeDiaryTags(entry?.tags).join(" ");
  return `${entry?.mood || ""} ${tags}`.trim();
}

function getSpeciesForDiaryEntry(entry) {
  const text = getDiarySpeciesText(entry);
  if (!text) return emotionSpecies.find((species) => species.id === "thoughtling");
  return emotionSpecies.find((species) => (
    species.keywords.some((keyword) => text.includes(keyword))
  )) || emotionSpecies.find((species) => species.id === "thoughtling");
}

function getSpeciesEvolution(count) {
  if (count >= 15) {
    return { level: 4, status: "完全体", threshold: 15 };
  }
  if (count >= 7) {
    return { level: 3, status: "进化形态", threshold: 7 };
  }
  if (count >= 3) {
    return { level: 2, status: "成长中", threshold: 3 };
  }
  if (count >= 1) {
    return { level: 1, status: "已捕获", threshold: 1 };
  }
  return { level: 0, status: "未发现", threshold: 0 };
}

function getEmotionSpeciesStats() {
  const stats = Object.fromEntries(emotionSpecies.map((species) => [
    species.id,
    {
      species,
      count: 0,
      evolution: getSpeciesEvolution(0)
    }
  ]));

  getDiaryEntries().forEach((entry) => {
    const species = getSpeciesForDiaryEntry(entry);
    if (species && stats[species.id]) {
      stats[species.id].count += 1;
      stats[species.id].evolution = getSpeciesEvolution(stats[species.id].count);
    }
  });

  return stats;
}

function getDiariesForSpecies(speciesId) {
  return getDiaryEntries().filter((entry) => getSpeciesForDiaryEntry(entry)?.id === speciesId);
}

function getEmotionSpeciesCounts() {
  const stats = getEmotionSpeciesStats();
  return Object.fromEntries(emotionSpecies.map((species) => [species.id, stats[species.id]?.count || 0]));
}

function renderEmotionCodexStatus() {
  if (!emotionCodexStatus) return;
  const stats = getEmotionSpeciesStats();
  emotionCodexStatus.innerHTML = emotionSpecies.map((species) => `
    <article class="codex-chip codex-species-card" style="--species-color: ${species.color};">
      <div class="codex-species-card__head">
        <i></i>
        <span>${species.name}</span>
        <em>${species.englishName}</em>
      </div>
      <div class="codex-species-card__meta">
        <span>数量 ${stats[species.id]?.count || 0}</span>
        <span>LV.${stats[species.id]?.evolution.level ?? 0}</span>
      </div>
      <strong>${stats[species.id]?.evolution.status || "未发现"}</strong>
    </article>
  `).join("");
}

function renderDiaryEntries() {
  if (!diaryList) return;

  const keyword = (diarySearch?.value || "").trim().toLowerCase();
  const entries = getDiaryEntries();
  const filtered = entries.filter((entry) => {
    const text = `${entry.title} ${entry.mood} ${entry.content} ${normalizeDiaryTags(entry.tags).join(" ")}`.toLowerCase();
    return text.includes(keyword);
  });

  if (diaryCount) {
    diaryCount.textContent = `${entries.length} 个存档`;
  }

  renderEmotionCodexStatus();

  if (!filtered.length) {
    diaryList.innerHTML = `<div class="empty-vault">暂无匹配存档。写一篇，给今天打个像素补丁。</div>`;
    return;
  }

  diaryList.innerHTML = filtered.map((entry) => `
    <article class="diary-entry">
      <h3>${escapeHTML(entry.title)}</h3>
      <time datetime="${entry.createdAt}">${formatTime(entry.createdAt)}</time>
      <span class="mood">心情：${escapeHTML(entry.mood)}</span>
      ${renderDiaryTags(entry.tags)}
      <p>${escapeHTML(entry.content)}</p>
      <button class="pixel-button ghost diary-delete" type="button" data-id="${entry.id}">删除存档</button>
    </article>
  `).join("");
}

function extractImportedDiaryEntries(payload) {
  if (Array.isArray(payload)) return payload;
  if (!payload || typeof payload !== "object") return [];

  const candidateKeys = ["entries", "diaries", "diaryEntries", "data", "saves"];
  for (const key of candidateKeys) {
    if (Array.isArray(payload[key])) return payload[key];
  }

  return [];
}

function openImportModal(entries) {
  if (!diaryImportModal) return;
  pendingImportEntries = entries.map(normalizeDiaryEntry);
  if (diaryImportSummary) {
    diaryImportSummary.textContent = `检测到 ${pendingImportEntries.length} 篇日记。请选择导入方式。`;
  }
  diaryImportModal.classList.add("is-open");
  diaryImportModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  diaryImportMerge?.focus();
}

function closeImportModal() {
  if (!diaryImportModal) return;
  diaryImportModal.classList.remove("is-open");
  diaryImportModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  pendingImportEntries = [];
  if (diaryImportFile) diaryImportFile.value = "";
}

function mergeDiaryEntriesById(currentEntries, importedEntries) {
  const mergedById = new Map();
  currentEntries.forEach((entry) => {
    const normalized = normalizeDiaryEntry(entry);
    mergedById.set(normalized.id, normalized);
  });
  importedEntries.forEach((entry) => {
    const normalized = normalizeDiaryEntry(entry);
    mergedById.set(normalized.id, normalized);
  });
  return [...mergedById.values()].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function applyDiaryImport(mode) {
  if (!pendingImportEntries.length) return;
  const normalizedImport = pendingImportEntries.map(normalizeDiaryEntry);
  const nextEntries = mode === "overwrite"
    ? normalizedImport
    : mergeDiaryEntriesById(getDiaryEntries(), normalizedImport);

  saveDiaryEntries(nextEntries);
  closeImportModal();
  refreshDiaryViews();
}

if (diaryForm) {
  diaryForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = diaryTitle.value.trim();
    const mood = diaryMood.value;
    const tags = normalizeDiaryTags(diaryTags?.value || "");
    const content = diaryContent.value.trim();
    if (!title || !content) return;

    const entries = getDiaryEntries();
    entries.unshift(createDiaryEntry({
      title,
      mood,
      content,
      tags
    }));
    saveDiaryEntries(entries);
    diaryForm.reset();
    refreshDiaryViews();
    showSaveFeedback();
  });
}

if (diaryClear) {
  diaryClear.addEventListener("click", () => {
    diaryForm?.reset();
    diaryTitle?.focus();
  });
}

if (diarySearch) {
  diarySearch.addEventListener("input", renderDiaryEntries);
}

if (diaryList) {
  diaryList.addEventListener("click", (event) => {
    const deleteButton = event.target.closest(".diary-delete");
    if (!deleteButton) return;

    const id = deleteButton.dataset.id;
    const entries = getDiaryEntries().filter((entry) => entry.id !== id);
    saveDiaryEntries(entries);
    refreshDiaryViews();
  });
}

if (diaryExport) {
  diaryExport.addEventListener("click", () => {
    const entries = saveDiaryEntries(getDiaryEntries());
    const exportPayload = {
      schemaVersion: 2,
      exportedAt: new Date().toISOString(),
      storageKey: DIARY_STORAGE_KEY,
      entryCount: entries.length,
      entries
    };
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `jinglun-diary-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  });
}

diaryImport?.addEventListener("click", () => {
  diaryImportFile?.click();
});

diaryImportFile?.addEventListener("change", async (event) => {
  const file = event.target.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const payload = JSON.parse(text);
    const importedEntries = extractImportedDiaryEntries(payload).map(normalizeDiaryEntry);
    if (!importedEntries.length) {
      window.alert("没有读取到可导入的日记数据。");
      diaryImportFile.value = "";
      return;
    }
    openImportModal(importedEntries);
  } catch (error) {
    console.warn("导入存档读取失败", error);
    window.alert("JSON 存档读取失败，请检查文件格式。");
    diaryImportFile.value = "";
  }
});

diaryImportMerge?.addEventListener("click", () => {
  applyDiaryImport("merge");
});

diaryImportOverwrite?.addEventListener("click", () => {
  applyDiaryImport("overwrite");
});

diaryImportCloseTargets.forEach((target) => {
  target.addEventListener("click", closeImportModal);
});

// ===== Random Save / 随机读取旧日记 =====
function pickRandomDiaryEntry(entries, excludeId) {
  if (!entries.length) return null;
  if (entries.length === 1) return entries[0];
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const pick = entries[Math.floor(Math.random() * entries.length)];
    if (!excludeId || pick.id !== excludeId) return pick;
  }
  return entries[Math.floor(Math.random() * entries.length)];
}

function renderRandomSaveEntry(entry) {
  if (!entry || !randomSaveContent) return;
  randomSaveContent.innerHTML = `
    <article class="random-save-entry">
      <header>
        <h4>${escapeHTML(entry.title)}</h4>
        <span class="random-save-entry__mood">${escapeHTML(entry.mood)}</span>
      </header>
      <div class="random-save-entry__meta">
        <time datetime="${escapeHTML(entry.createdAt)}">${formatTime(entry.createdAt)}</time>
        ${renderDiaryTags(entry.tags)}
      </div>
      <p class="random-save-entry__content">${escapeHTML(entry.content)}</p>
    </article>`;
}

function renderRandomSaveEmpty() {
  if (!randomSaveContent) return;
  randomSaveContent.innerHTML = `
    <div class="random-save-modal__empty">
      <p>还没有旧存档可以读取。</p>
      <p>先写下一篇吧。</p>
    </div>`;
}

function openRandomSaveModal() {
  if (!randomSaveModal) return;
  const entries = getDiaryEntries();

  if (!entries.length) {
    renderRandomSaveEmpty();
    if (randomSaveReroll) randomSaveReroll.hidden = true;
    if (randomSaveViewDay) randomSaveViewDay.hidden = true;
    randomSaveLastEntryId = null;
  } else {
    const pick = pickRandomDiaryEntry(entries, randomSaveLastEntryId);
    randomSaveLastEntryId = pick?.id || null;
    renderRandomSaveEntry(pick);
    if (randomSaveReroll) randomSaveReroll.hidden = false;
    if (randomSaveViewDay) randomSaveViewDay.hidden = entries.length === 0;
  }

  randomSaveLastFocus = document.activeElement;
  randomSaveModal.classList.add("is-open");
  randomSaveModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("modal-open");
  if (randomSaveReroll && !randomSaveReroll.hidden) {
    randomSaveReroll.focus();
  } else {
    randomSaveModal.querySelector(".random-save-modal__close")?.focus();
  }
}

function closeRandomSaveModal() {
  if (!randomSaveModal || !randomSaveModal.classList.contains("is-open")) return;
  randomSaveModal.classList.remove("is-open");
  randomSaveModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("modal-open");
  if (randomSaveLastFocus instanceof HTMLElement) {
    randomSaveLastFocus.focus();
  }
}

randomSaveTrigger?.addEventListener("click", (event) => {
  event.preventDefault();
  openRandomSaveModal();
});

randomSaveCloseTargets.forEach((target) => {
  target.addEventListener("click", closeRandomSaveModal);
});

randomSaveReroll?.addEventListener("click", openRandomSaveModal);

randomSaveViewDay?.addEventListener("click", () => {
  if (!randomSaveLastEntryId) return;
  const entries = getDiaryEntries();
  const entry = entries.find((item) => item.id === randomSaveLastEntryId);
  if (!entry) return;
  const dateKey = getArchiveEntryDateKey(entry);
  if (!dateKey) return;
  closeRandomSaveModal();
  const [year, month] = dateKey.split("-");
  archiveMapYear = parseInt(year, 10);
  archiveMapMonth = parseInt(month, 10) - 1;
  archiveMapSelectedKey = dateKey;
  renderArchiveMap();
  document.querySelector("#archive-map")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

// Pixel world mini-space: a tiny controllable diary room rendered on canvas.
const pixelWorldCard = document.querySelector(".pixel-world-card");
const pixelWorldTrigger = document.querySelector(".pixel-world-trigger");
const pixelWorldStatus = document.querySelector("#pixel-world-status");
const emotionCodexStatus = document.querySelector("#emotion-codex-status");
const pixelWorldOverlay = document.querySelector("#pixel-world-overlay");
const pixelWorldClose = document.querySelector("#pixel-world-close");
const pixelWorldCanvas = document.querySelector("#pixel-world-canvas");
const pixelWorldWindow = document.querySelector(".pixel-world-window");
const worldSystemTitle = document.querySelector("#world-system-title");
const worldSystemScroll = document.querySelector(".world-system-scroll");
const worldDialogueText = document.querySelector("#world-dialogue-text");
const worldDialogueAction = document.querySelector("#world-dialogue-action");
const worldDiaryNav = document.querySelector("#world-diary-nav");
const worldPrevDiary = document.querySelector("#world-prev-diary");
const worldNextDiary = document.querySelector("#world-next-diary");
const worldInspect = document.querySelector("#world-inspect");
const worldHelp = document.querySelector(".world-help");
const dpadButtons = [...document.querySelectorAll(".dpad button")];
const worldCtx = pixelWorldCanvas?.getContext("2d");
const pixelWorldVisitedKey = "pixelWorldVisited";
const lastPixelSaveKey = "lastPixelSave";
const pixelWorldLastElementKey = "pixelWorldLastElement";

const tileSize = 32;
const worldMap = [
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 1, 1, 1, 1, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1],
  [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
  [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
];

const worldThemes = {
  neutral: {
    name: "霓虹待机域",
    systemTitle: "SYSTEM",
    primary: "#00f0ff",
    secondary: "#ff3df2",
    floorA: "#0b1026",
    floorB: "#0d1430",
    grid: "rgba(0, 240, 255, 0.08)",
    wall: "#121936",
    wallEdge: "rgba(255, 61, 242, 0.22)",
    particleColors: ["#00f0ff", "#ff3df2", "#5dff8f", "#ffe66d", "#8b5cff"],
    message: "情绪物种图鉴正在待机。靠近一种生物，按 E 读取它的存档。"
  },
  wood: {
    name: "木之存档域",
    systemTitle: "WOOD FIELD",
    primary: "#5dff8f",
    secondary: "#00f0ff",
    floorA: "#09241a",
    floorB: "#0d3022",
    grid: "rgba(93, 255, 143, 0.18)",
    wall: "#123021",
    wallEdge: "rgba(93, 255, 143, 0.42)",
    particleColors: ["#5dff8f", "#b8ff6d", "#00f0ff"],
    message: "木之领域展开。那些轻轻发亮的小事，正在重新生长。"
  },
  fire: {
    name: "火之存档域",
    systemTitle: "FIRE CORE",
    primary: "#ff3d5a",
    secondary: "#ff9f1c",
    floorA: "#24080d",
    floorB: "#35100b",
    grid: "rgba(255, 159, 28, 0.18)",
    wall: "#351018",
    wallEdge: "rgba(255, 61, 90, 0.52)",
    particleColors: ["#ff3d5a", "#ff9f1c", "#ffe66d"],
    message: "火之领域展开。愤怒不是故障，它正在提醒你检查边界。"
  },
  water: {
    name: "水之存档域",
    systemTitle: "WATER ECHO",
    primary: "#4aa3ff",
    secondary: "#8b5cff",
    floorA: "#071326",
    floorB: "#0a1832",
    grid: "rgba(74, 163, 255, 0.14)",
    wall: "#11183a",
    wallEdge: "rgba(139, 92, 255, 0.44)",
    particleColors: ["#4aa3ff", "#8b5cff", "#00f0ff"],
    message: "水之领域展开。那些没说出口的话，会在这里慢慢沉下来。"
  },
  metal: {
    name: "金之存档域",
    systemTitle: "METAL BEAT",
    primary: "#ffe66d",
    secondary: "#00f0ff",
    floorA: "#191812",
    floorB: "#242218",
    grid: "rgba(255, 230, 109, 0.16)",
    wall: "#2f2d24",
    wallEdge: "rgba(0, 240, 255, 0.42)",
    particleColors: ["#ffe66d", "#00f0ff", "#ff3df2"],
    message: "金之领域展开。灵感像节拍一样出现，短暂，但足够明亮。"
  },
  earth: {
    name: "土之存档域",
    systemTitle: "EARTH ARCHIVE",
    primary: "#d6a85a",
    secondary: "#ffe66d",
    floorA: "#23180c",
    floorB: "#2e2111",
    grid: "rgba(214, 168, 90, 0.18)",
    wall: "#3a2914",
    wallEdge: "rgba(255, 230, 109, 0.32)",
    particleColors: ["#d6a85a", "#ffe66d", "#f4fbff"],
    message: "土之领域展开。混乱的想法正在被整理成可以保存的形状。"
  }
};

const emotionSpecies = [
  {
    id: "joy",
    name: "喜灵",
    englishName: "Joy Sprite",
    mood: "开心 / 满足 / 小确幸",
    color: "#5dff8f",
    accent: "#ffe66d",
    element: "wood",
    keywords: ["开心", "愉快", "满足", "小确幸", "快乐", "高兴"],
    x: 4,
    y: 2,
    message: "喜灵收集那些轻轻发亮的瞬间。不是大事件，也可以被认真保存。"
  },
  {
    id: "rage",
    name: "怒核",
    englishName: "Rage Core",
    mood: "烦躁 / 生气 / 不甘心",
    color: "#ff3d5a",
    accent: "#ff3df2",
    element: "fire",
    keywords: ["烦躁", "生气", "不爽", "不甘心", "愤怒", "火大"],
    x: 16,
    y: 2,
    message: "怒核不是坏东西。它只是提醒你：有些边界正在被触碰。"
  },
  {
    id: "sorrow",
    name: "哀影",
    englishName: "Sorrow Shade",
    mood: "难过 / 低落 / 孤独",
    color: "#5aa7ff",
    accent: "#8b5cff",
    element: "water",
    keywords: ["难过", "低落", "孤独", "伤心", "失落", "疲惫"],
    x: 6,
    y: 5,
    message: "哀影会陪着那些没说出口的话。它不催你变好，只陪你待一会儿。"
  },
  {
    id: "joybeat",
    name: "乐团",
    englishName: "Joybeat",
    mood: "兴奋 / 好玩 / 灵感",
    color: "#00f0ff",
    accent: "#ff3df2",
    element: "metal",
    keywords: ["兴奋", "好玩", "轻松", "灵感", "灵感爆发", "热血"],
    x: 9,
    y: 8,
    message: "乐团喜欢突然冒出来的念头。也许只是一个小想法，但它正在发光。"
  },
  {
    id: "thoughtling",
    name: "思绪兽",
    englishName: "Thoughtling",
    mood: "思考 / 迷茫 / 复盘 / 自我整理",
    color: "#8b5cff",
    accent: "#f4fbff",
    element: "earth",
    keywords: ["平静", "思考", "思考中", "迷茫", "加载中", "复盘", "整理", "焦虑"],
    x: 17,
    y: 9,
    message: "思绪兽会整理混乱的缓存。想不明白也没关系，先把它存下来。"
  }
];

const worldObjects = emotionSpecies.map((species) => ({
  ...species,
  cx: species.x * tileSize + tileSize / 2,
  cy: species.y * tileSize + tileSize / 2
}));

const worldKeys = new Set();
const player = {
  x: tileSize * 2,
  y: tileSize * 2,
  w: 22,
  h: 28,
  speed: 2.25,
  step: 0,
  facing: "down"
};

let worldAnimation = null;
let worldOpen = false;
let lastNearestObject = null;
let worldDiaryIndex = 0;
let activeSpeciesId = null;
let currentWorldElement = "neutral";
let themeShiftTimer = null;
let speciesRevealTimer = null;

function getCurrentWorldTheme() {
  return worldThemes[currentWorldElement] || worldThemes.neutral;
}

function applyWorldTheme(element = "neutral", animate = false) {
  const nextElement = worldThemes[element] ? element : "neutral";
  currentWorldElement = nextElement;
  const theme = getCurrentWorldTheme();

  if (pixelWorldWindow) {
    Object.keys(worldThemes).forEach((key) => {
      pixelWorldWindow.classList.remove(`pixel-world--${key}`);
    });
    if (nextElement !== "neutral") {
      pixelWorldWindow.classList.add(`pixel-world--${nextElement}`);
      localStorage.setItem(pixelWorldLastElementKey, nextElement);
    }

    if (animate) {
      pixelWorldWindow.classList.remove("theme-shifting");
      void pixelWorldWindow.offsetWidth;
      pixelWorldWindow.classList.add("theme-shifting");
      clearTimeout(themeShiftTimer);
      themeShiftTimer = setTimeout(() => {
        pixelWorldWindow.classList.remove("theme-shifting");
      }, 700);
    }
  }

  if (worldSystemTitle) {
    worldSystemTitle.textContent = nextElement === "neutral" ? theme.systemTitle : `${theme.systemTitle} / ${theme.name}`;
  }

  if (worldHelp) {
    worldHelp.innerHTML = `
      <span>${theme.systemTitle} / ${theme.name}</span>
      <span>方向键 / WASD 移动，E 读取</span>
      <span>ESC 返回日记站</span>
    `;
  }

  return theme;
}

function updateWorldStatus() {
  if (!pixelWorldStatus) return;
  const visited = localStorage.getItem(pixelWorldVisitedKey) === "true";
  const lastSave = localStorage.getItem(lastPixelSaveKey);
  pixelWorldStatus.textContent = visited ? "像素世界：已探索" : "像素世界：未探索";
  pixelWorldStatus.title = lastSave ? `最近存档：${formatTime(lastSave)}` : "";
}

function setWorldDialogue(text, showArchiveAction = false) {
  if (worldDialogueText) {
    worldDialogueText.textContent = text;
  }
  if (worldDialogueAction) {
    worldDialogueAction.hidden = !showArchiveAction;
  }
  if (worldDiaryNav) {
    worldDiaryNav.hidden = true;
  }
  if (worldSystemScroll) {
    worldSystemScroll.scrollTop = 0;
  }
}

function setWorldDiaryControls(showControls, showArchiveAction = true) {
  if (worldDiaryNav) {
    worldDiaryNav.hidden = !showControls;
  }
  if (worldDialogueAction) {
    worldDialogueAction.hidden = !showArchiveAction;
  }
}

function summarizeDiaryContent(content, limit = 110) {
  const compact = String(content || "").replace(/\s+/g, " ").trim();
  if (!compact) return "这篇存档暂时没有内容。";
  return compact.length > limit ? `${compact.slice(0, limit)}...` : compact;
}

function formatSpeciesForWorld(species, entry) {
  const theme = worldThemes[species.element] || worldThemes.neutral;
  const stats = getEmotionSpeciesStats()[species.id] || {
    count: 0,
    evolution: getSpeciesEvolution(0)
  };
  const lines = [
    `领域：${theme.systemTitle} / ${theme.name}`,
    theme.message,
    "",
    `物种：${species.name} ${species.englishName}`,
    `情绪：${species.mood}`,
    `数量：${stats.count}`,
    `等级：LV.${stats.evolution.level}`,
    `进化状态：${stats.evolution.status}`,
    "",
    "它说：",
    `“${species.message}”`,
    "",
    "相关日记："
  ];

  if (!entry) {
    lines.push("这个物种还没有收集到对应的日记。下次可以写下一篇属于它的存档。");
    return lines.join("\n");
  }

  lines.push(
    `《${entry.title}》`,
    `心情：${entry.mood}`,
    `时间：${formatTime(entry.createdAt)}`,
    `内容：${summarizeDiaryContent(entry.content)}`
  );
  return lines.join("\n");
}

function showSpeciesDiary(speciesId, index = 0) {
  const species = emotionSpecies.find((item) => item.id === speciesId);
  if (!species) return;

  const diaries = getDiariesForSpecies(species.id);
  activeSpeciesId = species.id;
  worldDiaryIndex = diaries.length ? (index + diaries.length) % diaries.length : 0;

  if (worldDialogueText) {
    worldDialogueText.textContent = formatSpeciesForWorld(species, diaries[worldDiaryIndex]);
  }
  setWorldDiaryControls(diaries.length > 1, true);
  if (worldSystemScroll) {
    worldSystemScroll.scrollTop = 0;
  }
}

function openPixelWorld() {
  if (!pixelWorldOverlay || !worldCtx) return;
  worldOpen = true;
  localStorage.setItem(pixelWorldVisitedKey, "true");
  updateWorldStatus();
  applyWorldTheme(localStorage.getItem(pixelWorldLastElementKey) || "neutral", false);
  pixelWorldOverlay.classList.add("is-open");
  pixelWorldOverlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("pixel-world-open");
  pixelWorldClose?.focus();
  getDiaryEntries();
  renderEmotionCodexStatus();
  const theme = getCurrentWorldTheme();
  setWorldDialogue(theme.message);

  if (!worldAnimation) {
    worldAnimation = requestAnimationFrame(tickPixelWorld);
  }
}

function closePixelWorld() {
  if (!pixelWorldOverlay) return;
  worldOpen = false;
  worldKeys.clear();
  pixelWorldOverlay.classList.remove("is-open");
  pixelWorldOverlay.setAttribute("aria-hidden", "true");
  document.body.classList.remove("pixel-world-open");
  if (worldAnimation) {
    cancelAnimationFrame(worldAnimation);
    worldAnimation = null;
  }
  pixelWorldTrigger?.focus();
}

function tileAtPixel(x, y) {
  const mapX = Math.floor(x / tileSize);
  const mapY = Math.floor(y / tileSize);
  if (mapY < 0 || mapY >= worldMap.length || mapX < 0 || mapX >= worldMap[0].length) {
    return 1;
  }
  return worldMap[mapY][mapX];
}

function isBlockedTile(tile) {
  return tile === 1;
}

function isBlockedBySpecies(nextX, nextY) {
  const playerBox = {
    left: nextX + 1,
    right: nextX + player.w - 1,
    top: nextY + 1,
    bottom: nextY + player.h - 1
  };

  return worldObjects.some((species) => {
    const speciesBox = {
      left: species.x * tileSize + 5,
      right: species.x * tileSize + tileSize - 5,
      top: species.y * tileSize + 5,
      bottom: species.y * tileSize + tileSize - 5
    };
    return !(
      playerBox.right < speciesBox.left ||
      playerBox.left > speciesBox.right ||
      playerBox.bottom < speciesBox.top ||
      playerBox.top > speciesBox.bottom
    );
  });
}

function canMoveTo(nextX, nextY) {
  const pad = 2;
  const points = [
    [nextX + pad, nextY + pad],
    [nextX + player.w - pad, nextY + pad],
    [nextX + pad, nextY + player.h - pad],
    [nextX + player.w - pad, nextY + player.h - pad]
  ];
  return points.every(([x, y]) => !isBlockedTile(tileAtPixel(x, y))) && !isBlockedBySpecies(nextX, nextY);
}

function movePlayer() {
  if (!worldOpen) return;
  let dx = 0;
  let dy = 0;

  if (worldKeys.has("arrowup") || worldKeys.has("w")) dy -= 1;
  if (worldKeys.has("arrowdown") || worldKeys.has("s")) dy += 1;
  if (worldKeys.has("arrowleft") || worldKeys.has("a")) dx -= 1;
  if (worldKeys.has("arrowright") || worldKeys.has("d")) dx += 1;

  if (!dx && !dy) return;

  if (Math.abs(dx) + Math.abs(dy) === 2) {
    dx *= 0.72;
    dy *= 0.72;
  }

  if (Math.abs(dx) > Math.abs(dy)) {
    player.facing = dx > 0 ? "right" : "left";
  } else {
    player.facing = dy > 0 ? "down" : "up";
  }

  const nextX = player.x + dx * player.speed;
  const nextY = player.y + dy * player.speed;
  if (canMoveTo(nextX, player.y)) player.x = nextX;
  if (canMoveTo(player.x, nextY)) player.y = nextY;
  player.step += 1;
}

function nearestWorldObject() {
  const px = player.x + player.w / 2;
  const py = player.y + player.h / 2;
  let nearest = null;
  let nearestDistance = Infinity;

  worldObjects.forEach((object) => {
    const distance = Math.hypot(object.cx - px, object.cy - py);
    if (distance < nearestDistance) {
      nearest = object;
      nearestDistance = distance;
    }
  });

  return nearestDistance <= 58 ? nearest : null;
}

function interactWithWorldObject() {
  if (!worldOpen) return;
  getDiaryEntries();
  const object = nearestWorldObject();
  if (!object) {
    setWorldDialogue("这里暂时只有风声和漂浮的像素。再靠近一点试试。");
    return;
  }

  localStorage.setItem(lastPixelSaveKey, new Date().toISOString());
  updateWorldStatus();
  const theme = applyWorldTheme(object.element, true);
  setWorldDialogue(`正在切换领域……\n${theme.message}`, false);
  clearTimeout(speciesRevealTimer);
  speciesRevealTimer = setTimeout(() => {
    showSpeciesDiary(object.id, 0);
  }, 520);
}

function drawTile(x, y, tile, pulse, time) {
  const theme = getCurrentWorldTheme();
  const px = x * tileSize;
  const py = y * tileSize;
  worldCtx.fillStyle = (x + y) % 2 ? theme.floorA : theme.floorB;
  worldCtx.fillRect(px, py, tileSize, tileSize);
  worldCtx.fillStyle = theme.grid;
  worldCtx.fillRect(px, py, tileSize, 2);
  worldCtx.fillRect(px, py, 2, tileSize);

  if (tile === 1) {
    worldCtx.fillStyle = theme.wall;
    worldCtx.fillRect(px + 2, py + 2, tileSize - 4, tileSize - 4);
    worldCtx.fillStyle = theme.wallEdge;
    worldCtx.fillRect(px + 4, py + 4, tileSize - 8, 4);
    worldCtx.fillStyle = theme.grid;
    worldCtx.fillRect(px + 4, py + tileSize - 8, tileSize - 8, 4);
    if (currentWorldElement === "fire" && (x + y) % 3 === 0) {
      worldCtx.fillStyle = theme.secondary;
      worldCtx.fillRect(px + 10, py + 10, 12, 3);
      worldCtx.fillRect(px + 15, py + 13, 3, 8);
    }
    if (currentWorldElement === "earth" && (x + y) % 4 === 0) {
      worldCtx.fillStyle = theme.secondary;
      worldCtx.fillRect(px + 12, py + 8, 8, 3);
      worldCtx.fillRect(px + 10, py + 13, 12, 2);
    }
    return;
  }

  if (currentWorldElement === "wood" && (x * 3 + y) % 5 === 0) {
    worldCtx.fillStyle = theme.primary;
    worldCtx.fillRect(px + 8, py + 22, 3, 7);
    worldCtx.fillRect(px + 11, py + 18, 7, 3);
    worldCtx.fillStyle = theme.secondary;
    worldCtx.fillRect(px + 21, py + 8 + Math.floor(pulse * 2), 4, 4);
  }

  if (currentWorldElement === "fire" && (x + y * 2) % 4 === 0) {
    worldCtx.fillStyle = theme.secondary;
    worldCtx.fillRect(px + 6, py + 8, 12, 3);
    worldCtx.fillRect(px + 18, py + 11, 3, 10);
    worldCtx.fillStyle = theme.primary;
    worldCtx.fillRect(px + 21, py + 20, 5, 3);
  }

  if (currentWorldElement === "water") {
    worldCtx.globalAlpha = 0.45;
    worldCtx.fillStyle = (x + y + Math.floor(time / 360)) % 2 ? theme.primary : theme.secondary;
    worldCtx.fillRect(px + 6, py + 10 + ((x + y) % 3), 20, 2);
    worldCtx.fillRect(px + 10, py + 20 + ((x + y) % 2), 14, 2);
    worldCtx.globalAlpha = 1;
  }

  if (currentWorldElement === "metal") {
    worldCtx.fillStyle = "rgba(255, 255, 255, 0.12)";
    worldCtx.fillRect(px + 6, py + 6, 3, 3);
    worldCtx.fillRect(px + 23, py + 23, 3, 3);
    if ((x + y + Math.floor(time / 180)) % 6 === 0) {
      worldCtx.fillStyle = theme.secondary;
      worldCtx.fillRect(px + 14, py + 6, 3, 12);
      worldCtx.fillRect(px + 17, py + 6, 7, 3);
    }
  }

  if (currentWorldElement === "earth" && (x * 2 + y) % 5 === 0) {
    worldCtx.fillStyle = theme.primary;
    worldCtx.fillRect(px + 10, py + 9, 12, 16);
    worldCtx.fillStyle = theme.secondary;
    worldCtx.fillRect(px + 13, py + 12, 6, 2);
    worldCtx.fillRect(px + 13, py + 17, 6, 2);
  }
}

function drawWorldObject(object, pulse) {
  const px = object.x * tileSize;
  const py = object.y * tileSize;
  const glow = 4 + Math.floor(pulse * 4);
  const bob = Math.floor(pulse * 3);

  if (object.id === "joy") {
    worldCtx.fillStyle = object.accent;
    worldCtx.fillRect(px + 14, py + 4 - bob, 4, 24);
    worldCtx.fillRect(px + 4, py + 14 - bob, 24, 4);
    worldCtx.fillStyle = object.color;
    worldCtx.fillRect(px + 10, py + 10 - bob, 12, 12);
    worldCtx.fillStyle = "#f4fbff";
    worldCtx.fillRect(px + 13, py + 13 - bob, 3, 3);
    worldCtx.fillRect(px + 18, py + 13 - bob, 3, 3);
  }

  if (object.id === "rage") {
    worldCtx.fillStyle = object.accent;
    worldCtx.fillRect(px + 11, py + 6 - bob, 10, 20);
    worldCtx.fillRect(px + 7, py + 13 - bob, 18, 11);
    worldCtx.fillStyle = object.color;
    worldCtx.fillRect(px + 12, py + 10 - bob, 8, 12);
    worldCtx.fillStyle = "#ffe66d";
    worldCtx.fillRect(px + 14, py + 14 - bob, 4, 6);
  }

  if (object.id === "sorrow") {
    worldCtx.globalAlpha = 0.78;
    worldCtx.fillStyle = object.color;
    worldCtx.fillRect(px + 8, py + 8 - bob, 16, 16);
    worldCtx.fillRect(px + 6, py + 14 - bob, 20, 12);
    worldCtx.fillStyle = object.accent;
    worldCtx.fillRect(px + 10, py + 24 - bob, 4, 5);
    worldCtx.fillRect(px + 18, py + 24 - bob, 4, 5);
    worldCtx.fillStyle = "#03040b";
    worldCtx.fillRect(px + 11, py + 14 - bob, 3, 3);
    worldCtx.fillRect(px + 18, py + 14 - bob, 3, 3);
    worldCtx.globalAlpha = 1;
  }

  if (object.id === "joybeat") {
    worldCtx.fillStyle = object.color;
    worldCtx.fillRect(px + 9, py + 8 - bob, 5, 18);
    worldCtx.fillRect(px + 14, py + 8 - bob, 9, 4);
    worldCtx.fillStyle = object.accent;
    worldCtx.fillRect(px + 5, py + 22 - bob, 10, 6);
    worldCtx.fillRect(px + 20, py + 18 - bob, 7, 7);
    worldCtx.fillStyle = "#ffe66d";
    worldCtx.fillRect(px + 24, py + 7 - bob, 3, 3);
    worldCtx.fillRect(px + 3, py + 10 - bob, 3, 3);
  }

  if (object.id === "thoughtling") {
    worldCtx.fillStyle = object.color;
    worldCtx.fillRect(px + 7, py + 12 - bob, 18, 13);
    worldCtx.fillRect(px + 10, py + 7 - bob, 12, 8);
    worldCtx.fillStyle = object.accent;
    worldCtx.fillRect(px + 11, py + 11 - bob, 3, 3);
    worldCtx.fillRect(px + 18, py + 11 - bob, 3, 3);
    worldCtx.fillStyle = "#00f0ff";
    worldCtx.fillRect(px + 5, py + 9 - bob, 4, 4);
    worldCtx.fillRect(px + 23, py + 9 - bob, 4, 4);
    worldCtx.fillStyle = "#03040b";
    worldCtx.fillRect(px + 13, py + 19 - bob, 6, 2);
  }

  if (currentWorldElement === "metal") {
    worldCtx.globalAlpha = 0.42 + pulse * 0.3;
    worldCtx.strokeStyle = getCurrentWorldTheme().primary;
    worldCtx.lineWidth = 2;
    worldCtx.strokeRect(px + 2 - Math.floor(pulse * 3), py + 2 - Math.floor(pulse * 3), tileSize - 4 + Math.floor(pulse * 6), tileSize - 4 + Math.floor(pulse * 6));
    worldCtx.globalAlpha = 1;
  }

  worldCtx.globalAlpha = 0.24;
  worldCtx.fillStyle = object.color;
  worldCtx.fillRect(px + 4 - glow, py + 4 - glow, tileSize - 8 + glow * 2, tileSize - 8 + glow * 2);
  worldCtx.globalAlpha = 1;
}

function drawThemeDecorations(theme, time, pulse) {
  if (currentWorldElement === "wood") {
    worldCtx.fillStyle = theme.primary;
    for (let y = 1; y < worldMap.length - 1; y += 2) {
      worldCtx.fillRect(32, y * tileSize + 12, 4, 15);
      worldCtx.fillRect(36, y * tileSize + 12, 12, 3);
    }
    for (let i = 0; i < 12; i += 1) {
      const x = (i * 47 + Math.floor(time / 48)) % pixelWorldCanvas.width;
      const y = (i * 29) % pixelWorldCanvas.height;
      worldCtx.fillStyle = i % 2 ? theme.primary : theme.secondary;
      worldCtx.fillRect(x, y, 5, 3);
    }
  }

  if (currentWorldElement === "fire") {
    for (let i = 0; i < 18; i += 1) {
      const x = (i * 37 + Math.floor(time / 14)) % pixelWorldCanvas.width;
      const y = (i * 61 + Math.floor(time / 26)) % pixelWorldCanvas.height;
      worldCtx.fillStyle = i % 2 ? theme.primary : theme.secondary;
      worldCtx.fillRect(x, y, 3 + (i % 3), 3);
    }
  }

  if (currentWorldElement === "water") {
    worldCtx.globalAlpha = 0.18;
    worldCtx.fillStyle = "#000";
    worldCtx.fillRect(0, 0, pixelWorldCanvas.width, pixelWorldCanvas.height);
    worldCtx.globalAlpha = 0.5;
    worldCtx.fillStyle = theme.primary;
    for (let i = 0; i < 24; i += 1) {
      const x = (i * 31) % pixelWorldCanvas.width;
      const y = (i * 53 + Math.floor(time / 9)) % pixelWorldCanvas.height;
      worldCtx.fillRect(x, y, 2, 10);
    }
    worldCtx.globalAlpha = 1;
  }

  if (currentWorldElement === "metal") {
    const beat = pulse > 0.56 ? theme.secondary : theme.primary;
    worldCtx.fillStyle = beat;
    for (let x = 0; x < pixelWorldCanvas.width; x += 40) {
      worldCtx.fillRect(x, 0, 18, 5);
      worldCtx.fillRect(x + 18, pixelWorldCanvas.height - 5, 18, 5);
    }
    for (let i = 0; i < 9; i += 1) {
      const x = 70 + i * 54;
      const y = 32 + ((i % 4) * 74);
      worldCtx.fillRect(x, y, 4, 14);
      worldCtx.fillRect(x + 4, y, 12, 3);
      worldCtx.fillRect(x - 3, y + 12 + Math.floor(pulse * 3), 8, 5);
    }
  }

  if (currentWorldElement === "earth") {
    worldCtx.fillStyle = theme.primary;
    const stones = [
      [3, 9], [7, 2], [11, 10], [15, 5], [18, 7]
    ];
    stones.forEach(([x, y], index) => {
      const px = x * tileSize;
      const py = y * tileSize;
      worldCtx.fillRect(px + 8, py + 5, 16, 22);
      worldCtx.fillStyle = index % 2 ? theme.secondary : "rgba(244, 251, 255, 0.55)";
      worldCtx.fillRect(px + 12, py + 10, 8, 2);
      worldCtx.fillRect(px + 11, py + 16, 10, 2);
      worldCtx.fillStyle = theme.primary;
    });
  }
}

function drawThemeParticles(theme, time) {
  const amount = currentWorldElement === "earth" ? 20 : currentWorldElement === "fire" ? 44 : 34;
  const speed = currentWorldElement === "earth" ? 48 : currentWorldElement === "water" ? 16 : 24;

  for (let i = 0; i < amount; i += 1) {
    const sx = (i * 83 + Math.floor(time / speed)) % pixelWorldCanvas.width;
    const sy = (i * 47 + (currentWorldElement === "water" ? Math.floor(time / 10) : 0)) % 380;
    const palette = theme.particleColors || colors;
    worldCtx.fillStyle = palette[i % palette.length];
    worldCtx.globalAlpha = currentWorldElement === "earth" ? 0.18 : 0.28;
    worldCtx.fillRect(sx, sy, currentWorldElement === "fire" ? 4 : 3, currentWorldElement === "water" ? 7 : 3);
  }
  worldCtx.globalAlpha = 1;
}

function drawPlayer() {
  const x = Math.round(player.x);
  const y = Math.round(player.y - (player.step % 18 < 9 ? 1 : 0));
  const walkFrame = player.step % 18 < 9 ? 0 : 1;
  const faceOffset = player.facing === "left" ? -2 : player.facing === "right" ? 2 : 0;
  const isBack = player.facing === "up";
  const skin = "#f0d8c5";
  const skinShadow = "#cda893";
  const skinSoft = "#ddbda9";
  const hair = "#0b0908";
  const hairLight = "#211715";
  const shirt = "#070a10";

  if (currentWorldElement === "water") {
    worldCtx.globalAlpha = 0.24;
    worldCtx.fillStyle = getCurrentWorldTheme().primary;
    worldCtx.fillRect(x - 4, y + 2, player.w + 8, player.h + 10);
    worldCtx.globalAlpha = 1;
  }

  worldCtx.fillStyle = "rgba(0, 0, 0, 0.35)";
  worldCtx.fillRect(x + 1, y + player.h, player.w + 3, 4);

  worldCtx.fillStyle = hair;
  worldCtx.fillRect(x + 4, y - 3, 15, 8);
  worldCtx.fillRect(x + 3, y + 2, 17, 7);
  worldCtx.fillStyle = hairLight;
  worldCtx.fillRect(x + 13, y - 1, 5, 4);

  worldCtx.fillStyle = "#05070c";
  worldCtx.fillRect(x + 5, y + 21 + walkFrame, 5, 7);
  worldCtx.fillRect(x + 13, y + 21 + (walkFrame ? 0 : 1), 5, 7);
  worldCtx.fillStyle = "#020308";
  worldCtx.fillRect(x + 4, y + 27 + walkFrame, 7, 3);
  worldCtx.fillRect(x + 12, y + 27 + (walkFrame ? 0 : 1), 7, 3);

  worldCtx.fillStyle = shirt;
  worldCtx.fillRect(x + 3, y + 12, 17, 11);
  worldCtx.fillStyle = "#151923";
  worldCtx.fillRect(x + 4, y + 12, 15, 3);
  worldCtx.fillStyle = "#03050a";
  worldCtx.fillRect(x + 17, y + 15, 3, 8);
  worldCtx.fillStyle = "#090c12";
  worldCtx.fillRect(x, y + 14, 5, 8);
  worldCtx.fillRect(x + 18, y + 14, 5, 8);
  worldCtx.fillStyle = "#e6c9b6";
  worldCtx.fillRect(x + 1, y + 21, 4, 3);
  worldCtx.fillStyle = "#caa48f";
  worldCtx.fillRect(x + 18, y + 21, 4, 3);

  if (isBack) {
    worldCtx.fillStyle = hair;
    worldCtx.fillRect(x + 5, y, 13, 12);
    worldCtx.fillStyle = hairLight;
    worldCtx.fillRect(x + 7, y + 2, 10, 4);
    worldCtx.fillStyle = shirt;
    worldCtx.fillRect(x + 6, y + 11, 10, 5);
    return;
  }

  worldCtx.fillStyle = skin;
  worldCtx.fillRect(x + 5, y + 3, 13, 10);
  worldCtx.fillStyle = skinShadow;
  worldCtx.fillRect(x + 16, y + 4, 2, 8);
  worldCtx.fillStyle = skinSoft;
  worldCtx.fillRect(x + 7, y + 11, 9, 2);

  worldCtx.fillStyle = hair;
  worldCtx.fillRect(x + 4, y - 1, 15, 4);
  worldCtx.fillRect(x + 5, y + 2, 5, 4);
  worldCtx.fillRect(x + 11, y + 2, 4, 3);
  worldCtx.fillRect(x + 16, y + 2, 3, 3);
  worldCtx.fillStyle = hairLight;
  worldCtx.fillRect(x + 10, y + 2, 3, 3);

  worldCtx.fillStyle = "#17100f";
  worldCtx.fillRect(x + 8 + faceOffset, y + 8, 2, 2);
  worldCtx.fillRect(x + 14 + faceOffset, y + 8, 2, 2);
  worldCtx.fillStyle = "#39251f";
  worldCtx.fillRect(x + 17 + faceOffset, y + 10, 1, 1);

  worldCtx.fillStyle = "rgba(0, 240, 255, 0.42)";
  worldCtx.fillRect(x + 6, y + 15, 2, 2);
}

function drawPixelWorld() {
  if (!worldCtx) return;
  const time = performance.now();
  const pulse = (Math.sin(time / 260) + 1) / 2;
  const theme = getCurrentWorldTheme();
  const backgroundByElement = {
    neutral: "#050816",
    wood: "#03140d",
    fire: "#150407",
    water: "#030713",
    metal: "#101009",
    earth: "#120c06"
  };

  worldCtx.clearRect(0, 0, pixelWorldCanvas.width, pixelWorldCanvas.height);
  worldCtx.fillStyle = backgroundByElement[currentWorldElement] || backgroundByElement.neutral;
  worldCtx.fillRect(0, 0, pixelWorldCanvas.width, pixelWorldCanvas.height);

  worldMap.forEach((row, y) => {
    row.forEach((tile, x) => drawTile(x, y, tile, pulse, time));
  });

  drawThemeDecorations(theme, time, pulse);
  drawThemeParticles(theme, time);

  worldObjects.forEach((object) => drawWorldObject(object, pulse));
  const nearest = nearestWorldObject();
  if (nearest) {
    worldCtx.strokeStyle = nearest.color;
    worldCtx.lineWidth = 2;
    worldCtx.strokeRect(nearest.x * tileSize + 3, nearest.y * tileSize + 3, tileSize - 6, tileSize - 6);
  }

  drawPlayer();
}

function tickPixelWorld() {
  movePlayer();
  const nearest = nearestWorldObject();
  if (nearest !== lastNearestObject) {
    lastNearestObject = nearest;
    if (nearest) {
      setWorldDialogue(`靠近了：${nearest.name} ${nearest.englishName}，按 E 读取情绪信息。`, false);
    }
  }
  drawPixelWorld();
  worldAnimation = requestAnimationFrame(tickPixelWorld);
}

function normalizeWorldKey(key) {
  return key.toLowerCase();
}

function isWorldControlKey(key) {
  return ["arrowup", "arrowdown", "arrowleft", "arrowright", "w", "a", "s", "d", "e", "escape", " "].includes(key);
}

pixelWorldTrigger?.addEventListener("click", (event) => {
  event.stopPropagation();
  openPixelWorld();
});

pixelWorldCard?.addEventListener("click", (event) => {
  if (event.target.closest("a")) return;
  openPixelWorld();
});

pixelWorldCard?.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") return;
  event.preventDefault();
  openPixelWorld();
});

pixelWorldClose?.addEventListener("click", closePixelWorld);

pixelWorldOverlay?.addEventListener("click", (event) => {
  if (event.target === pixelWorldOverlay) {
    closePixelWorld();
  }
});

window.addEventListener("keydown", (event) => {
  const key = normalizeWorldKey(event.key);
  if (!worldOpen) return;
  if (!isWorldControlKey(key)) return;
  event.preventDefault();

  if (key === "escape") {
    closePixelWorld();
    return;
  }

  if (key === "e" || key === " ") {
    interactWithWorldObject();
    return;
  }

  worldKeys.add(key);
});

window.addEventListener("keyup", (event) => {
  const key = normalizeWorldKey(event.key);
  if (!isWorldControlKey(key)) return;
  worldKeys.delete(key);
});

dpadButtons.forEach((button) => {
  const move = button.dataset.move;
  const keyMap = {
    up: "arrowup",
    down: "arrowdown",
    left: "arrowleft",
    right: "arrowright"
  };
  const key = keyMap[move];

  // touchstart preventDefault avoids the browser intercepting taps for
  // scroll/zoom while keeping the pointerdown path intact.
  button.addEventListener("touchstart", (event) => {
    event.preventDefault();
  }, { passive: false });

  button.addEventListener("contextmenu", (event) => {
    event.preventDefault();
  });

  button.addEventListener("pointerdown", (event) => {
    event.preventDefault();
    worldKeys.add(key);
    button.setPointerCapture?.(event.pointerId);
  });

  ["pointerup", "pointercancel", "pointerleave"].forEach((eventName) => {
    button.addEventListener(eventName, () => {
      worldKeys.delete(key);
    });
  });
});

worldInspect?.addEventListener("click", interactWithWorldObject);

// Block long-press context menu on the inspect button too.
worldInspect?.addEventListener("contextmenu", (event) => event.preventDefault());
worldInspect?.addEventListener("touchstart", (event) => {
  // Allow click to fire; only stop default browser behaviour.
  if (event.cancelable) event.preventDefault();
}, { passive: false });

worldPrevDiary?.addEventListener("click", () => {
  if (activeSpeciesId) {
    showSpeciesDiary(activeSpeciesId, worldDiaryIndex - 1);
  }
});

worldNextDiary?.addEventListener("click", () => {
  if (activeSpeciesId) {
    showSpeciesDiary(activeSpeciesId, worldDiaryIndex + 1);
  }
});

worldDialogueAction?.addEventListener("click", () => {
  closePixelWorld();
  document.querySelector("#diary")?.scrollIntoView({ behavior: "smooth", block: "start" });
});

drawPixelWorld();
updateWorldStatus();
refreshDiaryViews();

