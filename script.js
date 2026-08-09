'use strict';

/* =========================================================
   FRIDAY — trợ lý ảo cá nhân
   Chat AI (OpenAI-compatible) + Việc cần làm + Nhắc nhở + Ghi chú
   Toàn bộ dữ liệu lưu trong localStorage, chạy 100% phía client.
   ========================================================= */

const KEYS = {
  settings: 'friday_settings_v1',
  profile: 'friday_profile_v1',
  chat: 'friday_chat_v1',
  tasks: 'friday_tasks_v1',
  reminders: 'friday_reminders_v1',
  notes: 'friday_notes_v1',
};

const DEFAULT_SETTINGS = {
  baseUrl: 'https://gen.pollinations.ai/v1',
  apiKey: '',
  model: 'openai',
};

const DEFAULT_PROFILE = {
  userName: 'Quang Vinh',
  dob: '20/11/2000',
  zodiac: 'Thiên Yết (Scorpio)',
  school: 'Đại học Quốc Tế (IU) - ĐHQG TP.HCM',
};

/* ---------------- state ---------------- */
let settings = load(KEYS.settings, DEFAULT_SETTINGS);
let profile = load(KEYS.profile, DEFAULT_PROFILE);
let chatMessages = load(KEYS.chat, []);
let tasks = load(KEYS.tasks, []);
let reminders = load(KEYS.reminders, []);
let notes = load(KEYS.notes, []);
let isSending = false;

/* ---------------- dom ---------------- */
const $ = (id) => document.getElementById(id);
const orb = $('orb');
const greeting = $('greeting');

/* ---------------- init ---------------- */
init();

function init() {
  renderGreeting();
  setInterval(renderGreeting, 60000);

  setupTabs();
  setupChat();
  setupTasks();
  setupReminders();
  setupNotes();
  setupSettingsModal();

  renderChatIntro();
  renderTasks();
  renderReminders();
  renderNotes();

  requestNotifPermission();
  setInterval(checkDueReminders, 20000);
  checkDueReminders();

  if (!settings.baseUrl) {
    setTimeout(openSettings, 400);
  }
}

/* ---------------- storage helpers ---------------- */
function load(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return Array.isArray(fallback) ? [] : { ...fallback };
    const parsed = JSON.parse(raw);
    return Array.isArray(fallback) ? parsed : { ...fallback, ...parsed };
  } catch {
    return Array.isArray(fallback) ? [] : { ...fallback };
  }
}
function save(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------------- greeting ---------------- */
function renderGreeting() {
  const h = new Date().getHours();
  let text;
  if (h < 5) text = 'Cậu Chủ vẫn còn thức à, giữ sức khoẻ nha 🌙';
  else if (h < 11) text = 'Chào buổi sáng Cậu Chủ Quang Vinh ☀️';
  else if (h < 14) text = 'Trưa rồi, Cậu Chủ ăn cơm chưa đó~ 🍚';
  else if (h < 18) text = 'Chào buổi chiều Cậu Chủ nè 🌤️';
  else if (h < 23) text = 'Buổi tối rồi, có gì cần FRIDAY giúp không? 🌆';
  else text = 'Khuya rồi đó Cậu Chủ ơi, ngủ sớm nha 😴';
  greeting.textContent = text;
}

/* ---------------- tabs ---------------- */
function setupTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach((btn) => {
    btn.addEventListener('click', () => {
      tabs.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
      $('panel-' + btn.dataset.tab).classList.add('active');
    });
  });
}

/* =========================================================
   CHAT
   ========================================================= */
const chatWindow = $('chatWindow');
const chatIntro = $('chatIntro');
const composerForm = $('composerForm');
const messageInput = $('messageInput');
const sendBtn = $('sendBtn');

function setupChat() {
  composerForm.addEventListener('submit', onSubmitMessage);
  messageInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composerForm.requestSubmit();
    }
  });
  messageInput.addEventListener('input', () => {
    messageInput.style.height = 'auto';
    messageInput.style.height = Math.min(messageInput.scrollHeight, 140) + 'px';
  });
  renderChatMessages();
}

function renderChatIntro() {
  chatIntro.innerHTML =
    `Hiii, FRIDAY đây! 🎀 Là trợ lý ảo riêng của <b>Cậu Chủ ${escapeHtml(profile.userName)}</b>. ` +
    `Cứ nhắn gì cũng được — hỏi bài, tám chuyện, nhờ FRIDAY nhắc việc đều oke hết á. Bắt đầu chat thử xem nào~`;
}

function renderChatMessages() {
  chatWindow.querySelectorAll('.msg').forEach((el) => el.remove());
  for (const msg of chatMessages) {
    chatWindow.appendChild(buildMessageEl(msg));
  }
  scrollChatToBottom();
}

function buildMessageEl(msg) {
  const wrap = document.createElement('div');
  wrap.className = `msg ${msg.role === 'user' ? 'user' : msg.role === 'error' ? 'error' : 'bot'}`;
  const label = document.createElement('div');
  label.className = 'msg-label';
  label.textContent = msg.role === 'user' ? 'Cậu Chủ' : msg.role === 'error' ? 'Lỗi' : 'FRIDAY';
  const bubble = document.createElement('div');
  bubble.className = 'bubble';
  bubble.innerHTML = renderMarkdownLite(msg.content);
  wrap.appendChild(label);
  wrap.appendChild(bubble);
  return wrap;
}

async function onSubmitMessage(e) {
  e.preventDefault();
  const text = messageInput.value.trim();
  if (!text || isSending) return;

  if (!settings.baseUrl) {
    openSettings();
    return;
  }

  chatMessages.push({ role: 'user', content: text });
  save(KEYS.chat, chatMessages);
  renderChatMessages();
  messageInput.value = '';
  messageInput.style.height = 'auto';
  setSending(true);
  orb.classList.add('thinking');

  const typingEl = buildTypingEl();
  chatWindow.appendChild(typingEl);
  scrollChatToBottom();

  try {
    const apiMessages = buildApiMessages();
    const reply = await callChatAPI(settings, apiMessages);
    chatMessages.push({ role: 'assistant', content: reply });
    save(KEYS.chat, chatMessages);
  } catch (err) {
    chatMessages.push({ role: 'error', content: 'FRIDAY chưa trả lời được: ' + shortError(err) });
    save(KEYS.chat, chatMessages);
  } finally {
    typingEl.remove();
    setSending(false);
    orb.classList.remove('thinking');
    renderChatMessages();
  }
}

function buildSystemPrompt() {
  const pendingTasks = tasks.filter((t) => !t.done);
  const upcomingReminders = reminders
    .filter((r) => new Date(r.datetime).getTime() > Date.now())
    .sort((a, b) => new Date(a.datetime) - new Date(b.datetime))
    .slice(0, 3);

  let ctx = '';
  if (pendingTasks.length) {
    ctx += `\nViệc đang chưa xong của Cậu Chủ: ${pendingTasks.slice(0, 6).map((t) => t.text).join('; ')}.`;
  }
  if (upcomingReminders.length) {
    ctx += `\nNhắc nhở sắp tới: ${upcomingReminders.map((r) => `"${r.text}" lúc ${formatDateTime(r.datetime)}`).join('; ')}.`;
  }

  return (
    `Bạn tên là FRIDAY, một trợ lý ảo cá nhân dễ thương, thân thiện, nói chuyện theo phong cách genz Việt Nam ` +
    `(dùng từ ngữ tự nhiên, thoải mái, thỉnh thoảng chêm icon/từ lóng nhẹ nhàng, nhưng vẫn lịch sự, không thô tục). ` +
    `Bạn luôn gọi người dùng là "Cậu Chủ ${profile.userName}". ` +
    `Thông tin về Cậu Chủ: sinh ngày ${profile.dob}, cung hoàng đạo ${profile.zodiac}, hiện học/làm tại ${profile.school}. ` +
    `Bạn có thể chủ động đùa vui, thể hiện cá tính riêng, không cần lúc nào cũng gò bó theo khuôn mẫu — ` +
    `miễn là vẫn giữ sự ấm áp, quan tâm và hữu ích cho Cậu Chủ. Trả lời ngắn gọn, tự nhiên như nhắn tin, trừ khi câu hỏi cần giải thích dài.` +
    ctx
  );
}

function buildApiMessages() {
  const msgs = [{ role: 'system', content: buildSystemPrompt() }];
  for (const m of chatMessages) {
    if (m.role === 'user' || m.role === 'assistant') msgs.push({ role: m.role, content: m.content });
  }
  return msgs;
}

function buildTypingEl() {
  const wrap = document.createElement('div');
  wrap.className = 'msg bot';
  wrap.innerHTML = `<div class="msg-label">FRIDAY</div><div class="bubble typing"><span></span><span></span><span></span></div>`;
  return wrap;
}

function setSending(v) {
  isSending = v;
  sendBtn.disabled = v;
}
function scrollChatToBottom() {
  chatWindow.scrollTop = chatWindow.scrollHeight;
}

/* ---------------- API call ---------------- */
async function callChatAPI(cfg, messages) {
  const url = `${cfg.baseUrl}/chat/completions`;
  const headers = { 'Content-Type': 'application/json' };
  if (cfg.apiKey) headers['Authorization'] = `Bearer ${cfg.apiKey}`;

  const res = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify({ model: cfg.model || 'openai', messages, temperature: 0.9 }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const body = await res.json();
      detail = body?.error?.message || JSON.stringify(body).slice(0, 160);
    } catch {
      detail = await res.text().catch(() => '');
    }
    throw new Error(`HTTP ${res.status}${detail ? ' — ' + detail : ''}`);
  }

  const data = await res.json();
  const content = data?.choices?.[0]?.message?.content;
  if (!content) throw new Error('Phản hồi API không hợp lệ.');
  return content;
}

function shortError(err) {
  const msg = err?.message || String(err);
  return msg.length > 140 ? msg.slice(0, 140) + '…' : msg;
}

/* ---------------- markdown-lite ---------------- */
function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function renderMarkdownLite(raw) {
  let text = escapeHtml(raw);
  text = text.replace(/```([\s\S]*?)```/g, (_, code) => `<pre><code>${code.trim()}</code></pre>`);
  text = text.replace(/`([^`\n]+)`/g, '<code>$1</code>');
  text = text.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
  text = text.replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, '<em>$1</em>');
  return text;
}

/* =========================================================
   TASKS
   ========================================================= */
function setupTasks() {
  $('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('taskInput');
    const dateInput = $('taskDate');
    const text = input.value.trim();
    if (!text) return;
    tasks.unshift({ id: uid(), text, done: false, dueDate: dateInput.value || null });
    save(KEYS.tasks, tasks);
    input.value = '';
    dateInput.value = '';
    renderTasks();
  });
}

function renderTasks() {
  const list = $('taskList');
  const empty = $('taskEmpty');
  const counter = $('taskCounter');
  list.innerHTML = '';
  const pending = tasks.filter((t) => !t.done).length;
  counter.textContent = `${pending} việc chưa xong`;

  if (!tasks.length) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  const sorted = [...tasks].sort((a, b) => a.done - b.done);
  for (const t of sorted) {
    const el = document.createElement('div');
    el.className = 'item' + (t.done ? ' done' : '');
    let metaHtml = '';
    if (t.dueDate) {
      const cls = !t.done && isOverdue(t.dueDate) ? 'overdue' : '';
      metaHtml = `<div class="item-meta ${cls}">hạn: ${t.dueDate}</div>`;
    }
    el.innerHTML = `
      <button class="item-check" data-id="${t.id}">${t.done ? '✓' : ''}</button>
      <div class="item-body"><div class="item-text">${escapeHtml(t.text)}</div>${metaHtml}</div>
      <button class="item-del" data-id="${t.id}">✕</button>
    `;
    el.querySelector('.item-check').addEventListener('click', () => toggleTask(t.id));
    el.querySelector('.item-del').addEventListener('click', () => deleteTask(t.id));
    list.appendChild(el);
  }
}

function toggleTask(id) {
  const t = tasks.find((x) => x.id === id);
  if (t) t.done = !t.done;
  save(KEYS.tasks, tasks);
  renderTasks();
}
function deleteTask(id) {
  tasks = tasks.filter((x) => x.id !== id);
  save(KEYS.tasks, tasks);
  renderTasks();
}
function isOverdue(dateStr) {
  const d = new Date(dateStr + 'T23:59:59');
  return d.getTime() < Date.now();
}

/* =========================================================
   REMINDERS
   ========================================================= */
function setupReminders() {
  $('reminderForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('reminderInput');
    const timeInput = $('reminderTime');
    const text = input.value.trim();
    if (!text || !timeInput.value) return;
    reminders.push({ id: uid(), text, datetime: timeInput.value, notified: false });
    save(KEYS.reminders, reminders);
    input.value = '';
    timeInput.value = '';
    renderReminders();
  });
}

function renderReminders() {
  const list = $('reminderList');
  const empty = $('reminderEmpty');
  const counter = $('reminderCounter');
  list.innerHTML = '';
  const upcoming = reminders.filter((r) => new Date(r.datetime).getTime() > Date.now()).length;
  counter.textContent = `${upcoming} sắp tới`;

  if (!reminders.length) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  const sorted = [...reminders].sort((a, b) => new Date(a.datetime) - new Date(b.datetime));
  for (const r of sorted) {
    const passed = new Date(r.datetime).getTime() < Date.now();
    const el = document.createElement('div');
    el.className = 'item' + (passed ? ' done' : '');
    el.innerHTML = `
      <span style="font-size:16px;">${passed ? '🔕' : '⏰'}</span>
      <div class="item-body">
        <div class="item-text">${escapeHtml(r.text)}</div>
        <div class="item-meta">${formatDateTime(r.datetime)}</div>
      </div>
      <button class="item-del" data-id="${r.id}">✕</button>
    `;
    el.querySelector('.item-del').addEventListener('click', () => deleteReminder(r.id));
    list.appendChild(el);
  }
}

function deleteReminder(id) {
  reminders = reminders.filter((x) => x.id !== id);
  save(KEYS.reminders, reminders);
  renderReminders();
}

function checkDueReminders() {
  const now = Date.now();
  let changed = false;
  for (const r of reminders) {
    if (!r.notified && new Date(r.datetime).getTime() <= now) {
      r.notified = true;
      changed = true;
      fireReminder(r);
    }
  }
  if (changed) {
    save(KEYS.reminders, reminders);
    renderReminders();
  }
}

function fireReminder(r) {
  showToast(`⏰ FRIDAY nhắc Cậu Chủ: ${r.text}`);
  chatMessages.push({ role: 'assistant', content: `⏰ Đến giờ rồi nè Cậu Chủ ${profile.userName} ơi: **${r.text}**` });
  save(KEYS.chat, chatMessages);
  renderChatMessages();
  if (window.Notification && Notification.permission === 'granted') {
    new Notification('FRIDAY nhắc Cậu Chủ', { body: r.text });
  }
}

function requestNotifPermission() {
  if (window.Notification && Notification.permission === 'default') {
    Notification.requestPermission().catch(() => {});
  }
}

function formatDateTime(val) {
  const d = new Date(val);
  if (isNaN(d)) return val;
  return d.toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function showToast(text) {
  const toast = $('reminderToast');
  toast.textContent = text;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 5000);
}

/* =========================================================
   NOTES
   ========================================================= */
function setupNotes() {
  $('noteForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const input = $('noteInput');
    const text = input.value.trim();
    if (!text) return;
    notes.unshift({ id: uid(), text, createdAt: Date.now() });
    save(KEYS.notes, notes);
    input.value = '';
    renderNotes();
  });
}

function renderNotes() {
  const list = $('noteList');
  const empty = $('noteEmpty');
  const counter = $('noteCounter');
  list.innerHTML = '';
  counter.textContent = `${notes.length} ghi chú`;

  if (!notes.length) {
    empty.classList.add('show');
    return;
  }
  empty.classList.remove('show');

  for (const n of notes) {
    const el = document.createElement('div');
    el.className = 'item';
    const date = new Date(n.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
    el.innerHTML = `
      <div class="item-top">
        <div class="item-meta">${date}</div>
        <button class="item-del" data-id="${n.id}">✕</button>
      </div>
      <div class="item-text">${escapeHtml(n.text)}</div>
    `;
    el.querySelector('.item-del').addEventListener('click', () => deleteNote(n.id));
    list.appendChild(el);
  }
}

function deleteNote(id) {
  notes = notes.filter((x) => x.id !== id);
  save(KEYS.notes, notes);
  renderNotes();
}

/* =========================================================
   SETTINGS MODAL
   ========================================================= */
function setupSettingsModal() {
  $('settingsBtn').addEventListener('click', openSettings);
  $('closeModalBtn').addEventListener('click', closeSettings);
  $('modalBackdrop').addEventListener('click', (e) => {
    if (e.target === $('modalBackdrop')) closeSettings();
  });
  $('saveSettingsBtn').addEventListener('click', saveSettingsFromModal);
  $('testConnBtn').addEventListener('click', testConnection);
}

function openSettings() {
  $('baseUrlInput').value = settings.baseUrl;
  $('apiKeyInput').value = settings.apiKey;
  $('modelInput').value = settings.model;
  $('userNameInput').value = profile.userName;
  $('userDobInput').value = profile.dob;
  $('userZodiacInput').value = profile.zodiac;
  $('userSchoolInput').value = profile.school;
  $('modalBackdrop').classList.add('open');
}
function closeSettings() {
  $('modalBackdrop').classList.remove('open');
}

function saveSettingsFromModal() {
  settings.baseUrl = $('baseUrlInput').value.trim().replace(/\/+$/, '');
  settings.apiKey = $('apiKeyInput').value.trim();
  settings.model = $('modelInput').value.trim() || 'openai';
  save(KEYS.settings, settings);

  profile.userName = $('userNameInput').value.trim() || DEFAULT_PROFILE.userName;
  profile.dob = $('userDobInput').value.trim();
  profile.zodiac = $('userZodiacInput').value.trim();
  profile.school = $('userSchoolInput').value.trim();
  save(KEYS.profile, profile);

  renderChatIntro();
  closeSettings();
}

async function testConnection() {
  const btn = $('testConnBtn');
  const original = btn.textContent;
  btn.textContent = 'Đang kiểm tra...';
  btn.disabled = true;
  try {
    await callChatAPI(
      {
        baseUrl: $('baseUrlInput').value.trim().replace(/\/+$/, ''),
        apiKey: $('apiKeyInput').value.trim(),
        model: $('modelInput').value.trim() || 'openai',
      },
      [{ role: 'user', content: 'Trả lời đúng một từ: OK' }]
    );
    btn.textContent = '✓ Kết nối thành công';
  } catch (err) {
    btn.textContent = '✗ Lỗi: ' + shortError(err);
  } finally {
    btn.disabled = false;
    setTimeout(() => (btn.textContent = original), 2600);
  }
}

/* ---------------- util ---------------- */
function uid() {
  return 'id_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}
