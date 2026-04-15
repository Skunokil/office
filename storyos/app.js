/**
Story OS v0.2 — domain model + UI logic
No backend, no build step. Pure DOM manipulation.
*/

import { dataProvider } from './data/dataProvider.js';
import {
  findById,
  makeCategorySummary,
  getCharacterRelations,
  getCharacterEvents,
  getLocationEvents,
  getChapterLinkedEvents,
} from './domain/entities.js';
import {
  buildStoryTimeline,
  buildNarrativeTimeline,
} from './domain/timeline.js';
import {
  buildOverviewGraphData,
  buildEntityGraphData,
} from './domain/graph.js';

const TYPELABELS = {
  character: 'Персонаж',
  event:     'Событие',
  location:  'Локация',
  clue:      'Улика',
  worldRule: 'Правило мира',
  chapter:   'Глава',
  category:  'Категория',
};

let mockProject = null;
let mockEntities = [];
let mockEvents = [];
let mockNarrativeUnits = [];
let mockRelations = [];
let mockSourceFragment = '';
let mockExtractionResults = null;

async function initData() {
  const [project, entities, events, narrativeUnits, relations, sourceFragment] = await Promise.all([
    dataProvider.getProject(),
    dataProvider.getEntities(),
    dataProvider.getEvents(),
    dataProvider.getNarrativeUnits(),
    dataProvider.getRelations(),
    dataProvider.getSourceFragment(),
  ]);

  mockProject = project;
  mockEntities = entities;
  mockEvents = events;
  mockNarrativeUnits = narrativeUnits;
  mockRelations = relations;
  mockSourceFragment = sourceFragment;
}

function findByIdFromState(id) {
  return findByIdFromState(
    {
      entities: mockEntities,
      events: mockEvents,
      narrativeUnits: mockNarrativeUnits,
    },
    id
  );
}

function getCharacterRelationsFromState(charId) {
  return getCharacterRelationsFromState({ relations: mockRelations }, charId);
}

function getCharacterEventsFromState(charId) {
  return getCharacterEventsFromState({ events: mockEvents }, charId);
}

function getLocationEventsFromState(locId) {
  return getLocationEventsFromState({ events: mockEvents }, locId);
}

function getChapterLinkedEventsFromState(linkedIds) {
  return getChapterLinkedEventsFromState({ events: mockEvents }, linkedIds);
}

function buildOverviewGraphDataFromState() {
  return buildOverviewGraphData({
    entities: mockEntities,
    events: mockEvents,
    narrativeUnits: mockNarrativeUnits,
    relations: mockRelations,
  });
}

function buildEntityGraphDataFromState(centerId) {
  return buildEntityGraphData(
    {
      entities: mockEntities,
      events: mockEvents,
      narrativeUnits: mockNarrativeUnits,
      relations: mockRelations,
    },
    centerId
  );
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

  const eventsSorted = buildStoryTimeline(mockEvents);

  container.innerHTML = eventsSorted.map(ev => {
    const loc = ev.locationId ? findByIdFromState(ev.locationId) : null;
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

  const eventsSorted = buildNarrativeTimeline(mockEvents);

  container.innerHTML = eventsSorted.map(ev => {
    const loc = ev.locationId ? findByIdFromState(ev.locationId) : null;
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

  const byStory = buildStoryTimeline(mockEvents);
  const byNarrative = buildNarrativeTimeline(mockEvents);

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
  const location = ev.locationId ? findByIdFromState(ev.locationId) : null;
  const participants = (ev.characterIds || [])
    .map(id => findByIdFromState(id))
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
  const relations = getCharacterRelationsFromState(char.id);
  const events = getCharacterEventsFromState(char.id);

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
  const events = getLocationEventsFromState(loc.id);

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
  const povChar = unit.pov ? findByIdFromState(unit.pov) : null;
  const linked = getChapterLinkedEventsFromState(unit.linkedEventIds || []);

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

  const obj = findByIdFromState(id);
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
// ══════════════════════════════════════════════════════════════
// SOURCE FRAGMENT TAB
// ══════════════════════════════════════════════════════════════

function extractCandidatesFromText(text) {
  const result = {
    characters: [],
    events: [],
    locations: [],
    clues: [],
  };

  if (!text || !text.trim()) {
    return result;
  }

  result.characters = mockEntities
    .filter(e => e.type === 'character')
    .map(entity => ({ entity, status: 'new' }));

  result.events = mockEvents
    .map(entity => ({ entity, status: 'new' }));

  result.locations = mockEntities
    .filter(e => e.type === 'location')
    .map(entity => ({ entity, status: 'new' }));

  result.clues = mockEntities
    .filter(e => e.type === 'clue')
    .map(entity => ({ entity, status: 'new' }));

  return result;
}

function updateCandidateStatus(cardEl, status) {
  if (!cardEl) return;

  const statusEl = cardEl.querySelector('.detail-status');
  if (!statusEl) return;

  statusEl.classList.remove(
    'detail-status--unverified',
    'detail-status--confirmed',
    'detail-status--rejected'
  );

  let label = 'Не проверено';

  if (status === 'confirmed') {
    statusEl.classList.add('detail-status--confirmed');
    label = 'Проверено';
  } else if (status === 'rejected') {
    statusEl.classList.add('detail-status--rejected');
    label = 'Отклонено';
  } else {
    statusEl.classList.add('detail-status--unverified');
  }

  statusEl.textContent = label;
}

function renderSourceCandidates(result) {
  const container = document.getElementById('source-candidates');
  const message = document.getElementById('source-fragment-message');

  if (!container) {
    return;
  }

  const totalCount =
    (result.characters?.length || 0) +
    (result.events?.length || 0) +
    (result.locations?.length || 0) +
    (result.clues?.length || 0);

  if (message) {
    message.textContent = totalCount
      ? `Найдено кандидатов: ${totalCount}. Выберите карточку для просмотра деталей.`
      : 'Совпадений не найдено. Попробуйте другой фрагмент.';
  }

  const groups = [
    { key: 'characters', label: 'Персонажи' },
    { key: 'events', label: 'События' },
    { key: 'locations', label: 'Локации' },
    { key: 'clues', label: 'Улики' },
  ];

  const html = groups.map(group => {
    const items = result[group.key] || [];

    if (!items.length) {
      return `
        <section class="source-group">
          <h3 class="source-group-title">${group.label}</h3>
          <p class="source-group-empty">Совпадений в этой группе не найдено.</p>
        </section>
      `;
    }

    return `
      <section class="source-group">
        <h3 class="source-group-title">${group.label}</h3>
        <div class="source-group-list">
          ${items.map((cand, idx) => {
            const entity = cand.entity;
            const typeLabel = TYPELABELS[entity.type] || entity.type;

            return `
              <article
                class="source-candidate-card"
                data-id="${entity.id}"
                data-group="${group.key}"
                data-index="${idx}"
              >
                <div class="source-candidate-main">
                  <div class="detail-header">
                    <span class="detail-type">${escapeHtml(typeLabel)}</span>
                    <span class="detail-status detail-status--unverified">Не проверено</span>
                  </div>
                  <div class="detail-name">${escapeHtml(entity.name || entity.title || 'Без названия')}</div>
                  <div class="detail-summary">${escapeHtml(entity.summary || '')}</div>
                </div>

                <div class="source-candidate-actions">
                  <button type="button" class="source-btn source-btn--confirm">Проверено</button>
                  <button type="button" class="source-btn source-btn--reject">Отклонить</button>
                  <button type="button" class="source-btn source-btn--remove">Удалить</button>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </section>
    `;
  }).join('');

  container.innerHTML = html;

  container.querySelectorAll('.source-candidate-card').forEach(card => {
    card.addEventListener('click', (e) => {
      if (e.target.closest('.source-btn')) return;
      const id = card.dataset.id;
      if (id) selectItem(id);
    });
  });

  container.querySelectorAll('.source-btn--confirm').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.source-candidate-card');
      updateCandidateStatus(card, 'confirmed');
    });
  });

  container.querySelectorAll('.source-btn--reject').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.source-candidate-card');
      updateCandidateStatus(card, 'rejected');
    });
  });

  container.querySelectorAll('.source-btn--remove').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const card = btn.closest('.source-candidate-card');
      if (card) card.remove();
    });
  });
}

function initSourceFragmentTab() {
  const textarea  = document.getElementById('source-fragment-input');
  const analyzeBtn = document.getElementById('source-analyze-btn');
  const msgEl     = document.getElementById('source-fragment-message');
  const container = document.getElementById('source-candidates');
  if (!textarea || !analyzeBtn || !msgEl || !container) return;

  textarea.value = mockSourceFragment;

  analyzeBtn.addEventListener('click', () => {
    const text = textarea.value.trim();
    if (!text) {
      msgEl.textContent = 'Введите фрагмент текста для разбора.';
      msgEl.classList.add('source-fragment-message--warn');
      return;
    }
    msgEl.textContent = '';
    msgEl.classList.remove('source-fragment-message--warn');
    mockExtractionResults = extractCandidatesFromText(text);
    renderSourceCandidates(mockExtractionResults);
  });

  // Delegated handler: button clicks update status; card body clicks trigger selectItem
  container.addEventListener('click', e => {
    const actionBtn = e.target.closest('.source-candidate-btn');
    if (actionBtn) {
      e.stopPropagation();
      const action   = actionBtn.dataset.action;
      const groupKey = actionBtn.dataset.group;
      const entityId = actionBtn.dataset.entityId;
      if (mockExtractionResults && groupKey && entityId) {
        const candidate = mockExtractionResults[groupKey].find(c => c.entity.id === entityId);
        if (candidate) {
          candidate.status = action === 'confirm' ? 'confirmed' : 'rejected';
          renderSourceCandidates(mockExtractionResults);
        }
      }
      return;
    }
    const card = e.target.closest('.source-candidate-card');
    if (card && card.dataset.id) {
      selectItem(card.dataset.id);
    }
  });
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
document.addEventListener('DOMContentLoaded', async () => {
  await initData();
  initTabs();
  initModeSwitcher();
  initTreeToggles();
  initSelectables();
  initChat();
  initTimelines();
  renderDashboardMiniTimelines();
  initSourceFragmentTab();
});