function assertArray(value, name) {
  if (!Array.isArray(value)) {
    throw new Error(`${name} must be an array`);
  }
  return value;
}

function assertObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${name} must be an object`);
  }
  return value;
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { Accept: 'application/json' },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new Error(`Invalid JSON for ${url}: ${error.message}`);
  }
}

export const apiDataProvider = {
  async getHealth() {
    return assertObject(await fetchJson('/api/health'), 'health');
  },

  async getProject() {
    return assertObject(await fetchJson('/api/project'), 'project');
  },

  async getEntities() {
    return assertArray(await fetchJson('/api/entities'), 'entities');
  },

  async getEvents() {
    return assertArray(await fetchJson('/api/events'), 'events');
  },

  async getNarrativeUnits() {
    return assertArray(
      await fetchJson('/api/narrative-units'),
      'narrativeUnits',
    );
  },

  async getRelations() {
    return assertArray(await fetchJson('/api/relations'), 'relations');
  },

  async getSourceFragment() {
    throw new Error('Source fragment API is not implemented yet');
  },
};
