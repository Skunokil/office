/**
Story OS v0.1 — domain model + UI logic
No backend, no build step. Pure DOM manipulation.
*/
// ══════════════════════════════════════════════════════════════
// DOMAIN MODEL — mock data
// ══════════════════════════════════════════════════════════════
const mockProject = {
title:       'Детективный роман',
description: 'История об убийстве в особняке Вороновых и исчезновении архивных документов.',
language:    'ru',
createdAt:   '2026-01-10',
};
// ── Entities: character | location | clue | worldRule ──────────
const mockEntities = [
{
id:      'char1',
type:    'character',
name:    'Алексей Воронов',
summary: 'Хозяин особняка. 58 лет. Вдовец. Владеет крупным архивным бизнесом. Под подозрением.',
tags:    ['главный', 'подозреваемый', 'аристократия'],
status:  'active',
},
{
id:      'char2',
type:    'character',
name:    'Марина Соколова',
summary: 'Секретарь Воронова. 34 года. Хранит личный дневник с записями о странных событиях.',
tags:    ['второстепенный', 'свидетель'],
status:  'active',
},
{
id:      'char3',
type:    'character',
name:    'Иван Черных',
summary: 'Нотариус семьи Вороновых. Последний, кто видел жертву живой.',
tags:    ['второстепенный', 'подозреваемый'],
status:  'active',
},
{
id:      'char4',
type:    'character',
name:    'Следователь Громов',
summary: 'Ведёт расследование. Опытный, циничный. Скрывает прошлое знакомство с Вороновым.',
tags:    ['протагонист', 'следователь'],
status:  'active',
},
{
id:      'loc1',
type:    'location',
name:    'Особняк Вороновых',
summary: 'Трёхэтажный особняк 1910 года постройки. Закрытый двор. Библиотека на втором этаже.',
tags:    ['ключевая', 'закрытое пространство'],
status:  'active',
},
{
id:      'loc2',
type:    'location',
name:    'Старый архив',
summary: 'Городской архив в подвале административного здания. Доступ ограничен.',
tags:    ['ключевая', 'государственная'],
status:  'active',
},
{
id:      'loc3',
type:    'location',
name:    'Кабинет нотариуса',
summary: 'Небольшой офис в центре города. Здесь хранятся копии документов Вороновых.',
tags:    ['фоновая'],
status:  'active',
},
{
id:      'clue1',
type:    'clue',
name:    'Письмо без подписи',
summary: 'Найдено в кармане жертвы. Написано от руки. Упоминает «сделку» и дату — 15 февраля.',
tags:    ['физическая', 'найдена', 'ключевая'],
status:  'confirmed',
},
{
id:      'clue2',
type:    'clue',
name:    'Сломанный замок сейфа',
summary: 'Сейф в кабинете Воронова вскрыт. По характеру повреждений — профессиональный инструмент.',
tags:    ['физическая', 'найдена'],
status:  'confirmed',
},
{
id:      'clue3',
type:    'clue',
name:    'Запись в дневнике Соколовой',
summary: '«Он знал, что они придут». Дата — 12 февраля. Не установлено, о ком речь.',
tags:    ['документальная', 'предположительная'],
status:  'unverified',
},
{
id:      'rule1',
type:    'worldRule',
name:    'Архивное право',
summary: 'Документы старше 50 лет считаются государственной собственностью. Частные лица не могут ими распоряжаться без разрешения.',
tags:    ['юридическая', 'ключевое ограничение'],
status:  'active',
},
{
id:      'rule2',
type:    'worldRule',
name:    'Наследственный кодекс (1998)',
summary: 'При отсутствии завещания наследство делится поровну между кровными родственниками.',
tags:    ['юридическая'],
status:  'active',
},
];
const mockEvents = [
{
id:           'ev1',
type:         'event',
name:         'Убийство в особняке',
summary:      'Ночь 14 февраля. Тело найдено в библиотеке особняка. Орудие — тяжёлый предмет с округлым краем.',
tags:         ['ключевое', 'преступление'],
status:       'confirmed',
storyTime:    '1923-02-14T02:30',
narrativeOrder: 3,
locationId:   'loc1',
characterIds: ['char1', 'char3', 'char4'],
},
{
id:           'ev2',
type:         'event',
name:         'Пропажа документов',
summary:      'Из сейфа Воронова исчезли завещание и доверенность на управление архивом.',
tags:         ['ключевое', 'кража'],
status:       'confirmed',
storyTime:    '1923-02-14T03:00',
narrativeOrder: 4,
locationId:   'loc1',
characterIds: ['char1', 'char3'],
},
{
id:           'ev3',
type:         'event',
name:         'Встреча в архиве',
summary:      'За три дня до убийства. Черных и неизвестный мужчина провели в архиве около двух часов.',
tags:         ['предыстория', 'подозрительное'],
status:       'unverified',
storyTime:    '1923-02-11T16:00',
narrativeOrder: 1,
locationId:   'loc2',
characterIds: ['char3'],
},
{
id:           'ev4',
type:         'event',
name:         'Обнаружение письма',
summary:      'Следователь Громов находит письмо при осмотре тела. Почерк не идентифицирован.',
tags:         ['расследование', 'улика'],
status:       'confirmed',
storyTime:    '1923-02-14T09:00',
narrativeOrder: 5,
locationId:   'loc1',
characterIds: ['char4'],
},
{
id:           'ev5',
type:         'event',
name:         'Дневниковая запись Соколовой',
summary:      'Марина делает запись о «людях, которых боится хозяин». Датировано 12 февраля.',
tags:         ['предыстория'],
status:       'unverified',
storyTime:    '1923-02-12T21:00',
narrativeOrder: 2,
locationId:   'loc1',
characterIds: ['char2'],
},
];
const mockNarrativeUnits = [
{
id:             'ch1',
type:           'chapter',
title:          'Глава 1',
chapter:        1,
pov:            'char4',
summary:        'Следователь Громов прибывает в особняк после анонимного звонка. Осматривает место преступления.',
linkedEventIds: ['ev1', 'ev4'],
narrativeOrder: 1,
tags:           ['открытие', 'место преступления'],
status:         'draft',
},
{
id:             'ch2',
type:           'chapter',
title:          'Глава 2',
chapter:        2,
pov:            'char4',
summary:        'Допросы свидетелей. Громов узнаёт о дневнике Соколовой. Появляется зацепка — нотариус.',
linkedEventIds: ['ev5', 'ev3'],
narrativeOrder: 2,
tags:           ['расследование', 'допросы'],
status:         'draft',
},
{
id:             'ch3',
type:           'chapter',
title:          'Глава 3',
chapter:        3,
pov:            'char2',
summary:        'Вид изнутри: Соколова вспоминает вечер 14-го. Новая улика меняет всю картину подозрений.',
linkedEventIds: ['ev2'],
narrativeOrder: 3,
tags:           ['поворот', 'ретроспектива'],
status:         'outline',
},
];
const mockRelations = [
{ id: 'rel1', type: 'employer-employee', fromId: 'char1', toId: 'char2',
label: 'Работодатель → Секретарь' },
{ id: 'rel2', type: 'client-attorney',   fromId: 'char1', toId: 'char3',
label: 'Клиент → Нотариус' },
{ id: 'rel3', type: 'investigates',      fromId: 'char4', toId: 'char1',
label: 'Следователь → Подозреваемый' },
{ id: 'rel4', type: 'witness',           fromId: 'char2', toId: 'ev1',
label: 'Свидетель события' },
{ id: 'rel5', type: 'last-seen',         fromId: 'char3', toId: 'ev1',
label: 'Последний видевший жертву' },
];
function findById(id) {
if (!id) return null;
const inEntities = mockEntities.find(e => e.id === id);
if (inEntities) return inEntities;
const inEvents = mockEvents.find(e => e.id === id);
if (inEvents) return inEvents;
const inUnits = mockNarrativeUnits.find(u => u.id === id);
if (inUnits) return inUnits;
return makeCategorySummary(id);
}
function makeCategorySummary(id) {
const map = {
'char-all': { id, type: 'category', name: 'Персонажи (12)',
summary: '12 персонажей: главные, второстепенные, упомянутые.', tags: ['категория'], status: 'n/a' },
'loc-all':  { id, type: 'category', name: 'Локации (8)',
summary: '8 локаций: 3 ключевых, 5 фоновых.', tags: ['категория'], status: 'n/a' },
'ev-all':   { id, type: 'category', name: 'События (37)',
summary: '37 событий охватывают трёхлетний период до убийства.', tags: ['категория'], status: 'n/a' },
'rel-all':  { id, type: 'category', name: 'Связи (24)',
summary: '24 связи между персонажами и организациями.', tags: ['категория'], status: 'n/a' },
'clue-all': { id, type: 'category', name: 'Улики (15)',
summary: '15 улик: найдены, предполагаемые, опровергнутые.', tags: ['категория'], status: 'n/a' },
};
return map[id] || null;
}
function getCharacterRelations(charId) {
return mockRelations.filter(r => r.fromId === charId || r.toId === charId);
}
function getCharacterEvents(charId) {
return mockEvents.filter(e => e.characterIds && e.characterIds.includes(charId));
}
function getLocationEvents(locId) {
return mockEvents.filter(e => e.locationId === locId);
}
function getChapterLinkedEvents(linkedIds) {
return linkedIds.map(id => mockEvents.find(e => e.id === id)).filter(Boolean);
}
// ══════════════════════════════════════════════════════════════
// TIMELINES
// ══════════════════════════════════════════════════════════════

const TYPE_LABELS = {
character:   'Персонаж',
location:    'Локация',
event:       'Событие',
clue:        'Улика',
worldRule:   'Правило мира',
chapter:     'Глава',
category:    'Категория',
};
const STATUS_LABELS = {
  confirmed:   'подтверждено',
  unverified:  'не проверено',
  active:      'активно',
  draft:       'черновик',
  outline:     'конспект',
};

function formatDateTime(dt) {
  if (!dt) return '';
  // На коленке, без локали
  const [date, time] = dt.split('T');
  return `${date} ${time}`;
}

function renderStoryTimeline() {
  const container = document.getElementById('story-timeline-list');
  if (!container) return;

  const eventsSorted = [...mockEvents].sort((a, b) => {
    if (!a.storyTime) return 1;
    if (!b.storyTime) return -1;
    return a.storyTime.localeCompare(b.storyTime);
  });

  container.innerHTML = eventsSorted.map(ev => {
    const loc = ev.locationId ? findById(ev.locationId) : null;
    const time = formatDateTime(ev.storyTime);

    return `
      <div class="timeline-item" data-id="${ev.id}">
        <div class="timeline-item-meta">
          <span class="timeline-item-order">${time}</span>
          <span class="timeline-item-type">${TYPE_LABELS[ev.type] || ev.type}</span>
        </div>
        <div class="timeline-item-title">${escapeHtml(ev.name)}</div>
        <div class="timeline-item-sub">
          ${loc ? `<span class="timeline-item-location">${escapeHtml(loc.name)}</span>` : ''}
          ${ev.tags && ev.tags.length
            ? `<span class="timeline-item-tags">${ev.tags.map(t => escapeHtml(t)).join(' · ')}</span>`
            : ''}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.timeline-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (id) selectItem(id);
    });
  });
}

function renderNarrativeTimeline() {
  const container = document.getElementById('narrative-timeline-list');
  if (!container) return;

  const eventsSorted = [...mockEvents].sort((a, b) => {
    if (a.narrativeOrder == null) return 1;
    if (b.narrativeOrder == null) return -1;
    return a.narrativeOrder - b.narrativeOrder;
  });

  container.innerHTML = eventsSorted.map(ev => {
    const loc = ev.locationId ? findById(ev.locationId) : null;
    const order = ev.narrativeOrder != null ? `#${ev.narrativeOrder}` : '';

    return `
      <div class="timeline-item" data-id="${ev.id}">
        <div class="timeline-item-meta">
          <span class="timeline-item-order">${order}</span>
          <span class="timeline-item-type">${TYPE_LABELS[ev.type] || ev.type}</span>
        </div>
        <div class="timeline-item-title">${escapeHtml(ev.name)}</div>
        <div class="timeline-item-sub">
          ${loc ? `<span class="timeline-item-location">${escapeHtml(loc.name)}</span>` : ''}
          ${ev.tags && ev.tags.length
            ? `<span class="timeline-item-tags">${ev.tags.map(t => escapeHtml(t)).join(' · ')}</span>`
            : ''}
        </div>
      </div>
    `;
  }).join('');

  container.querySelectorAll('.timeline-item').forEach(el => {
    el.addEventListener('click', () => {
      const id = el.dataset.id;
      if (id) selectItem(id);
    });
  });
}

function initTimelines() {
  renderStoryTimeline();
  renderNarrativeTimeline();
}
function renderTags(tags) {
if (!tags || !tags.length) return '';
return `<div class="detail-tags">${tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`;
}
function renderStatusBadge(status) {
  if (!status || status === 'n/a') return '';
  const label = STATUS_LABELS[status] || status;
  return `<span class="detail-status detail-status--${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}
function renderBaseFields(obj) {
return `<div class="detail-header"> <span class="detail-type">${TYPE_LABELS[obj.type] || obj.type}</span> ${renderStatusBadge(obj.status)} </div> <div class="detail-name">${escapeHtml(obj.name || obj.title || '')}</div> <div class="detail-summary">${escapeHtml(obj.summary || '')}</div> ${renderTags(obj.tags)}`;
}
function renderEventDetail(ev) {
const location = ev.locationId ? findById(ev.locationId) : null;
const participants = (ev.characterIds || [])
.map(id => findById(id))
.filter(Boolean);
const locLine = location
  ? `<div class="detail-row"><span class="detail-row-label">Локация</span><span>${escapeHtml(location.name)}</span></div>`
  : '';

const timeLine = ev.storyTime
  ? `<div class="detail-row"><span class="detail-row-label">Время в мире</span><span class="detail-mono">${escapeHtml(ev.storyTime)}</span></div>`
  : '';

const orderLine = ev.narrativeOrder != null
  ? `<div class="detail-row"><span class="detail-row-label">Порядок раскрытия</span><span class="detail-mono">#${ev.narrativeOrder}</span></div>`
  : '';

const partList = participants.length
  ? `<div class="detail-section-title">Участники</div>
     <ul class="detail-list">${participants.map(p => `<li>${escapeHtml(p.name)}</li>`).join('')}</ul>`
  : '';
return `${renderBaseFields(ev)} <div class="detail-meta"> ${timeLine}${orderLine}${locLine} </div> ${partList}`;
}
function renderCharacterDetail(char) {
const relations = getCharacterRelations(char.id);
const events    = getCharacterEvents(char.id);
const relList = relations.length
? `<div class="detail-section-title">Связи</div> <ul class="detail-list">${relations.map(r => `<li>${escapeHtml(r.label)}</li>`).join('')}</ul>`
: '';
const evList = events.length
? `<div class="detail-section-title">Связанные события</div> <ul class="detail-list">${events.map(e => `<li>${escapeHtml(e.name)}</li>`).join('')}</ul>`
: '';
return `${renderBaseFields(char)}${relList}${evList}`;
}
function renderLocationDetail(loc) {
const events = getLocationEvents(loc.id);
const evList = events.length
? `<div class="detail-section-title">События здесь</div> <ul class="detail-list">${events.map(e => `<li>${escapeHtml(e.name)}</li>`).join('')}</ul>`
: '';
return `${renderBaseFields(loc)}${evList}`;
}
function renderChapterDetail(unit) {
const povChar = unit.pov ? findById(unit.pov) : null;
const linked  = getChapterLinkedEvents(unit.linkedEventIds || []);
const povLine = povChar
  ? `<div class="detail-row"><span class="detail-row-label">Точка зрения</span><span>${escapeHtml(povChar.name)}</span></div>`
  : '';

const orderLine = unit.narrativeOrder != null
  ? `<div class="detail-row"><span class="detail-row-label">Порядок раскрытия</span><span class="detail-mono">#${unit.narrativeOrder}</span></div>`
  : '';

const evList = linked.length
  ? `<div class="detail-section-title">Связанные события</div>
     <ul class="detail-list">${linked.map(e => `<li>${escapeHtml(e.name)}</li>`).join('')}</ul>`
  : '';
return `${renderBaseFields(unit)} <div class="detail-meta">${povLine}${orderLine}</div> ${evList}`;
}
function renderDetail(obj) {
if (!obj) return '<span class="placeholder-text">Ничего не выбрано</span>';
switch (obj.type) {
case 'event':     return renderEventDetail(obj);
case 'character': return renderCharacterDetail(obj);
case 'location':  return renderLocationDetail(obj);
case 'chapter':   return renderChapterDetail(obj);
default:          return renderBaseFields(obj);
}
}
let selectedId = null;
function selectItem(id) {
document.querySelectorAll('.tree-item.selected, .stat-card.selected, .table-row.selected, .timeline-item.selected')
.forEach(el => el.classList.remove('selected'));
selectedId = id;
document.querySelectorAll(`[data-id="${id}"]`)
.forEach(el => el.classList.add('selected'));
const obj = findById(id);
updateSelectionPanel(obj);
updateEntityDetails(obj);
}
function updateSelectionPanel(obj) {
const panel = document.getElementById('current-selection');
if (!panel) return;
if (!obj) {
panel.innerHTML = '<span class="placeholder-text">Ничего не выбрано</span>';
return;
}
const typeLabel = TYPE_LABELS[obj.type] || obj.type;
const statusLabel = obj.status && obj.status !== 'n/a'
  ? (STATUS_LABELS[obj.status] || obj.status)
  : '';

panel.innerHTML = `
  <div class="entity-detail">
    <div class="entity-detail-name">${escapeHtml(obj.name || obj.title || '')}</div>
    <div class="entity-detail-meta">${typeLabel}${statusLabel ? ' · ' + escapeHtml(statusLabel) : ''}</div>
    <div class="entity-detail-desc">${escapeHtml(obj.summary || '')}</div>
    ${renderTags(obj.tags)}
  </div>
`;
}
function updateEntityDetails(obj) {
const block = document.getElementById('entity-details-content');
if (!block) return;
if (!obj) {
block.innerHTML = '<span class="placeholder-text">Выберите сущность в дереве или таблице, чтобы увидеть детали.</span>';
return;
}
block.innerHTML = renderDetail(obj);
}
function initTabs() {
const tabs = document.querySelectorAll('.tab');
tabs.forEach(tab => {
tab.addEventListener('click', () => {
tabs.forEach(t => t.classList.remove('active'));
document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
tab.classList.add('active');
const target = document.getElementById('tab-' + tab.dataset.tab);
if (target) target.classList.add('active');
});
});
}
function initModeSwitcher() {
const btns = document.querySelectorAll('.mode-btn');
btns.forEach(btn => {
btn.addEventListener('click', () => {
btns.forEach(b => b.classList.remove('active'));
btn.classList.add('active');
});
});
}
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
function initSelectables() {
document.querySelectorAll('.tree-item, .stat-card, .table-row').forEach(el => {
el.addEventListener('click', () => {
const id = el.dataset.id;
if (id) selectItem(id);
});
});
}
const STUB_REPLIES = [
'Это интересный вопрос. Давайте посмотрим на связи между персонажами.',
'В хронологии есть несоответствие. Событие ev3 должно быть раньше ev1 по фабуле.',
'У Черных нет алиби на вечер 14 февраля. Стоит это прописать явнее.',
'Локация «Старый архив» упоминается, но не связана с уликами. Хотите добавить?',
'Точка зрения главы 3 — Соколова. Это даёт возможность скрыть информацию от читателя.',
'Письмо без подписи и сломанный замок — два физических доказательства. Их достаточно для ордера.',
];
let replyIndex = 0;
function initChat() {
const input    = document.getElementById('chat-input');
const sendBtn  = document.getElementById('chat-send');
const messages = document.getElementById('chat-messages');
function sendMessage() {
const text = input.value.trim();
if (!text) return;
    const userMsg = document.createElement('div');
    userMsg.className = 'chat-msg chat-msg--user';
    userMsg.innerHTML = `
      <span class="chat-sender">Вы</span>
      <span class="chat-text">${escapeHtml(text)}</span>
    `;
    messages.appendChild(userMsg);
    input.value = '';
    messages.scrollTop = messages.scrollHeight;

    setTimeout(() => {
      const reply = STUB_REPLIES[replyIndex % STUB_REPLIES.length];
      replyIndex++;

      const assistantMsg = document.createElement('div');
      assistantMsg.className = 'chat-msg chat-msg--assistant';
      assistantMsg.innerHTML = `
        <span class="chat-sender">Зина</span>
        <span class="chat-text">${reply}</span>
      `;
      messages.appendChild(assistantMsg);
      messages.scrollTop = messages.scrollHeight;
    }, 380);
}
sendBtn.addEventListener('click', sendMessage);
input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMessage(); });
}
function escapeHtml(str) {
return String(str)
.replace(/&/g, '&amp;')
.replace(/</g, '&lt;')
.replace(/>/g, '&gt;')
.replace(/"/g, '&quot;');
}
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initModeSwitcher();
  initTreeToggles();
  initSelectables();
  initChat();
  initTimelines();
});