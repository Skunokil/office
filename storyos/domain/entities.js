export function findById(data, id) {
  if (!id) return null;

  const inEntities = data.entities.find(e => e.id === id);
  if (inEntities) return inEntities;

  const inEvents = data.events.find(e => e.id === id);
  if (inEvents) return inEvents;

  const inUnits = data.narrativeUnits.find(u => u.id === id);
  if (inUnits) return inUnits;

  return makeCategorySummary(id);
}

export function makeCategorySummary(id) {
  const map = {
    'char-all': {
      id,
      type: 'category',
      name: 'Персонажи (12)',
      summary: '12 персонажей: главные, второстепенные, упомянутые.',
      tags: ['категория'],
      status: 'n/a',
    },
    'loc-all': {
      id,
      type: 'category',
      name: 'Локации (8)',
      summary: '8 локаций: 3 ключевых, 5 фоновых.',
      tags: ['категория'],
      status: 'n/a',
    },
    'ev-all': {
      id,
      type: 'category',
      name: 'События (37)',
      summary: '37 событий охватывают трёхлетний период до убийства.',
      tags: ['категория'],
      status: 'n/a',
    },
    'rel-all': {
      id,
      type: 'category',
      name: 'Связи (24)',
      summary: '24 связи между персонажами и организациями.',
      tags: ['категория'],
      status: 'n/a',
    },
    'clue-all': {
      id,
      type: 'category',
      name: 'Улики (15)',
      summary: '15 улик: найдены, предполагаемые, опровергнутые.',
      tags: ['категория'],
      status: 'n/a',
    },
  };

  return map[id] || null;
}

export function getCharacterRelations(data, charId) {
  return data.relations.filter(r => r.fromId === charId || r.toId === charId);
}

export function getCharacterEvents(data, charId) {
  return data.events.filter(e => e.characterIds && e.characterIds.includes(charId));
}

export function getLocationEvents(data, locId) {
  return data.events.filter(e => e.locationId === locId);
}

export function getChapterLinkedEvents(data, linkedIds) {
  return linkedIds.map(id => data.events.find(e => e.id === id)).filter(Boolean);
}