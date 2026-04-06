/**
 * Story OS v0.1 — UI skeleton
 * No backend, no build step. Pure DOM manipulation.
 */

// ── Mock data ──────────────────────────────────────────────────
const ENTITIES = {
  ch1:      { type: 'Chapter',   name: 'Chapter 1',           desc: 'Детектив прибывает в особняк после звонка о пропаже.' },
  ch2:      { type: 'Chapter',   name: 'Chapter 2',           desc: 'Допросы свидетелей. Появляется подозреваемый.' },
  ch3:      { type: 'Chapter',   name: 'Chapter 3',           desc: 'Новая улика меняет всю картину.' },
  char1:    { type: 'Character', name: 'Алексей Воронов',     desc: 'Хозяин особняка. 58 лет. Вдовец. Владеет крупным архивным бизнесом.' },
  char2:    { type: 'Character', name: 'Марина Соколова',     desc: 'Секретарь Воронова. 34 года. Хранит личный дневник.' },
  char3:    { type: 'Character', name: 'Иван Черных',         desc: 'Нотариус семьи Вороновых. Под подозрением.' },
  loc1:     { type: 'Location',  name: 'Особняк Вороновых',   desc: 'Трёхэтажный особняк 1910 года постройки. Закрытый двор.' },
  loc2:     { type: 'Location',  name: 'Старый архив',        desc: 'Городской архив в подвале административного здания.' },
  ev1:      { type: 'Event',     name: 'Убийство в особняке', desc: 'Ночь 14 февраля. Тело найдено в библиотеке. Орудие — тяжёлый предмет.' },
  ev2:      { type: 'Event',     name: 'Пропажа документов',  desc: 'Из сейфа Воронова исчезли завещание и доверенность.' },
  clue1:    { type: 'Clue',      name: 'Письмо без подписи',  desc: 'Найдено в кармане жертвы. Написано от руки. Упоминает «сделку».' },
  'char-all': { type: 'Category', name: 'Characters (12)',    desc: '12 персонажей: главные, второстепенные, упомянутые.' },
  'loc-all':  { type: 'Category', name: 'Locations (8)',      desc: '8 локаций: 3 ключевых, 5 фоновых.' },
  'ev-all':   { type: 'Category', name: 'Events (37)',        desc: '37 событий охватывают трёхлетний период до убийства.' },
  'rel-all':  { type: 'Category', name: 'Relations (24)',     desc: '24 связи между персонажами и организациями.' },
  'clue-all': { type: 'Category', name: 'Clues (15)',         desc: '15 улик: найдены, предполагаемые, опровергнутые.' },
};

// ── State ──────────────────────────────────────────────────────
let selectedId = null;

// ── Helpers ────────────────────────────────────────────────────
function selectItem(id) {
  // Deselect all
  document.querySelectorAll('.tree-item.selected, .stat-card.selected, .table-row.selected')
    .forEach(el => el.classList.remove('selected'));

  selectedId = id;

  // Highlight matching elements
  document.querySelectorAll(`[data-id="${id}"]`)
    .forEach(el => el.classList.add('selected'));

  updateSelectionPanel(id);
  updateEntityDetails(id);
}

function updateSelectionPanel(id) {
  const panel = document.getElementById('current-selection');
  if (!panel) return;

  const entity = ENTITIES[id];
  if (!entity) {
    panel.innerHTML = '<span class="placeholder-text">Nothing selected</span>';
    return;
  }

  panel.innerHTML = `
    <div class="entity-detail">
      <div class="entity-detail-name">${entity.name}</div>
      <div class="entity-detail-meta">${entity.type}</div>
      <div class="entity-detail-desc">${entity.desc}</div>
    </div>
  `;
}

function updateEntityDetails(id) {
  const block = document.getElementById('entity-details-content');
  if (!block) return;

  const entity = ENTITIES[id];
  if (!entity) {
    block.innerHTML = '<span class="placeholder-text">Select an entity from the tree or table to see details here.</span>';
    return;
  }

  block.innerHTML = `
    <div class="entity-detail">
      <div class="entity-detail-name">${entity.name}</div>
      <div class="entity-detail-meta">${entity.type}</div>
      <div class="entity-detail-desc">${entity.desc}</div>
    </div>
  `;
}

// ── Tab switching ──────────────────────────────────────────────
function initTabs() {
  const tabs = document.querySelectorAll('.tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Deactivate all
      tabs.forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));

      // Activate selected
      tab.classList.add('active');
      const target = document.getElementById('tab-' + tab.dataset.tab);
      if (target) target.classList.add('active');
    });
  });
}

// ── Mode switcher ──────────────────────────────────────────────
function initModeSwitcher() {
  const btns = document.querySelectorAll('.mode-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      // stub: mode switching has no UI effect in v0.1
    });
  });
}

// ── Tree toggles (collapse/expand) ─────────────────────────────
function initTreeToggles() {
  document.querySelectorAll('.tree-toggle').forEach(toggle => {
    toggle.addEventListener('click', () => {
      const targetId = toggle.dataset.target;
      const children = document.getElementById(targetId);
      if (!children) return;
      const isCollapsed = toggle.classList.toggle('collapsed');
      children.classList.toggle('hidden', isCollapsed);
    });
  });
}

// ── Selectable items (tree items + stat cards + table rows) ────
function initSelectables() {
  document.querySelectorAll('.tree-item, .stat-card, .table-row').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (id) selectItem(id);
    });
  });
}

// ── AI chat stub ───────────────────────────────────────────────
const STUB_REPLIES = [
  'Это интересный вопрос. Давайте посмотрим на связи между персонажами.',
  'В хронологии есть несоответствие. Событие 3 должно быть раньше.',
  'У этого персонажа слабо прописана мотивация. Хотите разобрать?',
  'Локация «Старый архив» упоминается в главе 2, но не связана с уликами.',
  'Обратите внимание: у Воронова нет алиби на вечер 14 февраля.',
];

let replyIndex = 0;

function initChat() {
  const input = document.getElementById('chat-input');
  const sendBtn = document.getElementById('chat-send');
  const messages = document.getElementById('chat-messages');

  function sendMessage() {
    const text = input.value.trim();
    if (!text) return;

    // User message
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg chat-msg--user';
    userMsg.innerHTML = `
      <span class="chat-sender">You</span>
      <span class="chat-text">${escapeHtml(text)}</span>
    `;
    messages.appendChild(userMsg);
    input.value = '';

    // Stub reply
    setTimeout(() => {
      const reply = STUB_REPLIES[replyIndex % STUB_REPLIES.length];
      replyIndex++;

      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'chat-msg chat-msg--assistant';
      assistantMsg.innerHTML = `
        <span class="chat-sender">Zina</span>
        <span class="chat-text">${reply}</span>
      `;
      messages.appendChild(assistantMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 400);

    messages.scrollTop = messages.scrollHeight;
  }

  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendMessage();
  });
}

function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ── Boot ───────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModeSwitcher();
  initTreeToggles();
  initSelectables();
  initChat();
});
