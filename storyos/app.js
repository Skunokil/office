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
narrativeOrder: 2,
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
narrativeOrder: 3,
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
    const time = ev.storyTime ? ev.storyTime.replace('T', ' ') : '';
    const typeLabel = TYPE_LABELS[ev.type] || ev.type;
    const statusBadge = renderStatusBadge(ev.status);

    return `
      <div class="timeline-item" data-id="${ev.id}">
        <div class="detail-header">
          <span class="detail-type">${typeLabel}</span>
          ${statusBadge}
        </div>
        <div class="detail-name">${escapeHtml(ev.name)}</div>
        <div class="detail-summary">${escapeHtml(ev.summary)}</div>
        <div class="detail-meta">
          ${time ? `
            <div class="detail-row">
              <span class="detail-row-label">Время в мире</span>
              <span class="detail-mono">${escapeHtml(time)}</span>
            </div>` : ''}
          ${loc ? `
            <div class="detail-row">
              <span class="detail-row-label">Локация</span>
              <span>${escapeHtml(loc.name)}</span>
            </div>` : ''}
        </div>
        ${renderTags(ev.tags)}
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
    const typeLabel = TYPE_LABELS[ev.type] || ev.type;
    const statusBadge = renderStatusBadge(ev.status);

    return `
      <div class="timeline-item timeline-item--narrative" data-id="${ev.id}">
        <div class="detail-header">
          <span class="detail-type">${typeLabel}</span>
          ${statusBadge}
        </div>
        <div class="detail-name">${escapeHtml(ev.name)}</div>
        <div class="detail-summary">${escapeHtml(ev.summary)}</div>
        <div class="detail-meta">
          ${order ? `
            <div class="detail-row">
              <span class="detail-row-label">Порядок раскрытия</span>
              <span class="detail-mono">${escapeHtml(order)}</span>
            </div>` : ''}
          ${loc ? `
            <div class="detail-row">
              <span class="detail-row-label">Локация</span>
              <span>${escapeHtml(loc.name)}</span>
            </div>` : ''}
        </div>
        ${renderTags(ev.tags)}
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

function renderDashboardMiniTimelines() {
  const storyTrack = document.getElementById('dashboard-story-track');
  const narrativeTrack = document.getElementById('dashboard-narrative-track');

  if (!storyTrack || !narrativeTrack) return;

  function makeNodeLabel(ev) {
    const order = ev.narrativeOrder != null ? ev.narrativeOrder : '?';
    const title = ev.name || '';
    const short = title.slice(0, 6);
    return `С${order}: ${short}...`;
  }

  const byStory = [...mockEvents].sort((a, b) => {
    if (!a.storyTime) return 1;
    if (!b.storyTime) return -1;
    return a.storyTime.localeCompare(b.storyTime);
  });

  const byNarrative = [...mockEvents].sort((a, b) => {
    if (a.narrativeOrder == null) return 1;
    if (b.narrativeOrder == null) return -1;
    return a.narrativeOrder - b.narrativeOrder;
  });

  storyTrack.innerHTML = byStory.map((ev, idx, arr) => {
    const left = arr.length === 1 ? 50 : (idx / (arr.length - 1)) * 100;
    return `
      <div class="tl-node" data-id="${ev.id}" style="left:${left}%">
        ${escapeHtml(makeNodeLabel(ev))}
      </div>
    `;
  }).join('');

  narrativeTrack.innerHTML = byNarrative.map((ev, idx, arr) => {
    const left = arr.length === 1 ? 50 : (idx / (arr.length - 1)) * 100;
    return `
      <div class="tl-node tl-node--narrative" data-id="${ev.id}" style="left:${left}%">
        ${escapeHtml(makeNodeLabel(ev))}
      </div>
    `;
  }).join('');

  document.querySelectorAll('#dashboard-story-track .tl-node, #dashboard-narrative-track .tl-node').forEach(node => {
    node.addEventListener('click', () => {
      const id = node.dataset.id;
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

  const typeLabel = TYPE_LABELS[ev.type] || ev.type;
  const statusBadge = renderStatusBadge(ev.status);

  const tagsHtml = (ev.tags && ev.tags.length)
    ? `<div class="event-detail-tags">${ev.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const factsHtml = `
    <div class="event-detail-facts">
      <div class="event-detail-facts-grid">
        ${ev.storyTime ? `
          <div class="event-detail-fact-key">Время в мире</div>
          <div class="event-detail-fact-val detail-mono">${escapeHtml(ev.storyTime.replace('T', ' '))}</div>
        ` : ''}
        ${ev.narrativeOrder != null ? `
          <div class="event-detail-fact-key">Порядок раскрытия</div>
          <div class="event-detail-fact-val detail-mono">#${ev.narrativeOrder}</div>
        ` : ''}
        ${location ? `
          <div class="event-detail-fact-key">Локация</div>
          <div class="event-detail-fact-val">${escapeHtml(location.name)}</div>
        ` : ''}
      </div>
    </div>
  `;

  const participantsHtml = `
    <div class="event-detail-participants">
      <div class="event-detail-participants-label">Участники</div>
      <div class="event-detail-participants-list">
        ${participants.length
          ? participants.map(p => `<span class="event-detail-chip">${escapeHtml(p.name)}</span>`).join('')
          : `<span class="event-detail-chip">—</span>`}
      </div>
    </div>
  `;

  return `
    <div class="event-detail-card">
      <div class="event-detail-grid">
        <div class="event-detail-type">${typeLabel}</div>
        <div class="event-detail-status">${statusBadge}</div>

        <div class="event-detail-title">
          <div class="detail-name">${escapeHtml(ev.name)}</div>
        </div>

        <div class="event-detail-summary">
          <div class="detail-summary">${escapeHtml(ev.summary || '')}</div>
        </div>

        ${tagsHtml}
        ${factsHtml}
        ${participantsHtml}
      </div>
    </div>
  `;
}
function renderCharacterDetail(char) {
  const relations = getCharacterRelations(char.id);
  const events = getCharacterEvents(char.id);

  const typeLabel = TYPE_LABELS[char.type] || char.type;
  const statusBadge = renderStatusBadge(char.status);

  const tagsHtml = (char.tags && char.tags.length)
    ? `<div class="character-detail-tags">${char.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const relationsHtml = `
    <div class="character-detail-panel">
      <div class="character-detail-panel-title">Связи</div>
      <div class="character-detail-list">
        ${relations.length
          ? relations.map(r => `
              <div class="character-detail-list-item">
                <span class="character-detail-list-main">${escapeHtml(r.label)}</span>
              </div>
            `).join('')
          : `<div class="character-detail-list-item character-detail-list-item--empty">Нет связей</div>`}
      </div>
    </div>
  `;

  const eventsHtml = `
    <div class="character-detail-panel">
      <div class="character-detail-panel-title">Связанные события</div>
      <div class="character-detail-list">
        ${events.length
          ? events.map(e => `
              <div class="character-detail-list-item">
                <span class="character-detail-list-main">${escapeHtml(e.name)}</span>
                ${e.storyTime ? `<span class="character-detail-list-meta detail-mono">${escapeHtml(e.storyTime.replace('T', ' '))}</span>` : ''}
              </div>
            `).join('')
          : `<div class="character-detail-list-item character-detail-list-item--empty">Нет событий</div>`}
      </div>
    </div>
  `;

  return `
    <div class="character-detail-card">
      <div class="character-detail-grid">
        <div class="character-detail-type">${typeLabel}</div>
        <div class="character-detail-status">${statusBadge}</div>

        <div class="character-detail-title">
          <div class="detail-name">${escapeHtml(char.name)}</div>
        </div>

        <div class="character-detail-summary">
          <div class="detail-summary">${escapeHtml(char.summary || '')}</div>
        </div>

        ${tagsHtml}
      </div>

      <div class="character-detail-panels">
        ${relationsHtml}
        ${eventsHtml}
      </div>
    </div>
  `;
}
function renderLocationDetail(loc) {
  const events = getLocationEvents(loc.id);

  const typeLabel = TYPE_LABELS[loc.type] || loc.type;
  const statusBadge = renderStatusBadge(loc.status);

  const tagsHtml = (loc.tags && loc.tags.length)
    ? `<div class="location-detail-tags">${loc.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const eventsHtml = `
    <div class="location-detail-panel">
      <div class="location-detail-panel-title">События здесь</div>
      <div class="location-detail-list">
        ${events.length
          ? events.map(e => `
              <div class="location-detail-list-item">
                <div class="location-detail-list-main">
                  <div class="location-detail-event-name">${escapeHtml(e.name)}</div>
                  <div class="location-detail-event-summary">${escapeHtml(e.summary || '')}</div>
                </div>
                <div class="location-detail-list-side">
                  ${e.storyTime ? `<div class="location-detail-list-meta detail-mono">${escapeHtml(e.storyTime.replace('T', ' '))}</div>` : ''}
                  ${e.narrativeOrder != null ? `<div class="location-detail-list-order detail-mono">#${e.narrativeOrder}</div>` : ''}
                </div>
              </div>
            `).join('')
          : `<div class="location-detail-list-item location-detail-list-item--empty">Для этой локации пока нет событий</div>`}
      </div>
    </div>
  `;

  return `
    <div class="location-detail-card">
      <div class="location-detail-grid">
        <div class="location-detail-type">${typeLabel}</div>
        <div class="location-detail-status">${statusBadge}</div>

        <div class="location-detail-title">
          <div class="detail-name">${escapeHtml(loc.name)}</div>
        </div>

        <div class="location-detail-summary">
          <div class="detail-summary">${escapeHtml(loc.summary || '')}</div>
        </div>

        ${tagsHtml}
      </div>

      ${eventsHtml}
    </div>
  `;
}
function renderChapterDetail(unit) {
  const povChar = unit.pov ? findById(unit.pov) : null;
  const linked = getChapterLinkedEvents(unit.linkedEventIds || []);

  const typeLabel = TYPE_LABELS[unit.type] || unit.type;
  const statusBadge = renderStatusBadge(unit.status);

  const chapterLabel = unit.chapter != null ? `Глава ${unit.chapter}` : (unit.title || '');
  const titleText = unit.title || chapterLabel || '';

  const tagsHtml = (unit.tags && unit.tags.length)
    ? `<div class="chapter-detail-tags">${unit.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';

  const factsHtml = `
    <div class="chapter-detail-facts">
      <div class="chapter-detail-facts-grid">
        <div class="chapter-detail-fact-key">Глава</div>
        <div class="chapter-detail-fact-val">${escapeHtml(chapterLabel)}</div>

        ${povChar ? `
          <div class="chapter-detail-fact-key">Точка зрения</div>
          <div class="chapter-detail-fact-val">${escapeHtml(povChar.name)}</div>
        ` : ''}

        ${unit.narrativeOrder != null ? `
          <div class="chapter-detail-fact-key">Порядок раскрытия</div>
          <div class="chapter-detail-fact-val detail-mono">#${unit.narrativeOrder}</div>
        ` : ''}
      </div>
    </div>
  `;

  const eventsHtml = `
    <div class="chapter-detail-panel">
      <div class="chapter-detail-panel-title">Связанные события</div>
      <div class="chapter-detail-list">
        ${linked.length
          ? linked.map(e => `
              <div class="chapter-detail-list-item">
                <div class="chapter-detail-list-main">
                  <div class="chapter-detail-event-name">${escapeHtml(e.name)}</div>
                  <div class="chapter-detail-event-summary">${escapeHtml(e.summary || '')}</div>
                </div>
                <div class="chapter-detail-list-side">
                  ${e.storyTime ? `<div class="chapter-detail-list-meta detail-mono">${escapeHtml(e.storyTime.replace('T', ' '))}</div>` : ''}
                  ${e.narrativeOrder != null ? `<div class="chapter-detail-list-order detail-mono">#${e.narrativeOrder}</div>` : ''}
                </div>
              </div>
            `).join('')
          : `<div class="chapter-detail-list-item chapter-detail-list-item--empty">У главы пока нет связанных событий</div>`}
      </div>
    </div>
  `;

return `
  <div class="chapter-detail-card">
    <div class="chapter-detail-head">
      <div class="chapter-detail-metahead">
        <div class="chapter-detail-type">${typeLabel}</div>
        ${statusBadge}
      </div>

      <div class="chapter-detail-main">
        <div class="chapter-detail-title">
          <div class="detail-name">${escapeHtml(titleText)}</div>
        </div>
        ${tagsHtml}
      </div>

      <div class="chapter-detail-summary">
        <div class="detail-summary">${escapeHtml(unit.summary)}</div>
      </div>
    </div>

    <div class="chapter-detail-bottom">
      ${factsHtml}
      ${eventsHtml}
    </div>
  </div>
`;
}
function renderClueDetail(obj) {
  const typeLabel = TYPE_LABELS[obj.type] || obj.type;
  const statusBadge = renderStatusBadge(obj.status);
  const tagsHtml = (obj.tags && obj.tags.length)
    ? `<div class="simple-detail-tags">${obj.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="simple-detail-card">
      <div class="simple-detail-header">
        <span class="simple-detail-type">${typeLabel}</span>
        ${statusBadge}
      </div>
      <div class="detail-name">${escapeHtml(obj.name || '')}</div>
      <div class="detail-summary">${escapeHtml(obj.summary || '')}</div>
      ${tagsHtml}
    </div>
  `;
}
function renderWorldRuleDetail(obj) {
  const typeLabel = TYPE_LABELS[obj.type] || obj.type;
  const statusBadge = renderStatusBadge(obj.status);
  const tagsHtml = (obj.tags && obj.tags.length)
    ? `<div class="simple-detail-tags">${obj.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="simple-detail-card">
      <div class="simple-detail-header">
        <span class="simple-detail-type">${typeLabel}</span>
        ${statusBadge}
      </div>
      <div class="detail-name">${escapeHtml(obj.name || '')}</div>
      <div class="detail-summary">${escapeHtml(obj.summary || '')}</div>
      ${tagsHtml}
    </div>
  `;
}
function renderCategoryDetail(obj) {
  const typeLabel = TYPE_LABELS[obj.type] || obj.type;
  const tagsHtml = (obj.tags && obj.tags.length)
    ? `<div class="simple-detail-tags">${obj.tags.map(t => `<span class="detail-tag">${escapeHtml(t)}</span>`).join('')}</div>`
    : '';
  return `
    <div class="category-detail-card">
      <div class="simple-detail-header">
        <span class="simple-detail-type">${typeLabel}</span>
        <span class="category-detail-badge">сводка</span>
      </div>
      <div class="detail-name">${escapeHtml(obj.name || '')}</div>
      <div class="detail-summary">${escapeHtml(obj.summary || '')}</div>
      ${tagsHtml}
      <div class="category-detail-note">Агрегированная сводка — не отдельная сущность мира.</div>
    </div>
  `;
}
function renderDetail(obj) {
if (!obj) return '<span class="placeholder-text">Ничего не выбрано</span>';
switch (obj.type) {
case 'event':     return renderEventDetail(obj);
case 'character': return renderCharacterDetail(obj);
case 'location':  return renderLocationDetail(obj);
case 'chapter':   return renderChapterDetail(obj);
case 'clue':      return renderClueDetail(obj);
case 'worldRule': return renderWorldRuleDetail(obj);
case 'category':  return renderCategoryDetail(obj);
default:          return renderBaseFields(obj);
}
}
let selectedId = null;
function selectItem(id) {
  document.querySelectorAll('.tree-item.selected, .stat-card.selected, .table-row.selected, .timeline-item.selected, .tl-node.selected')
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
  renderDashboardMiniTimelines();
});