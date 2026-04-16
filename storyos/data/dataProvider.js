import { mockDataProvider } from './mockDataProvider.js';
import { apiDataProvider } from './apiDataProvider.js';
import { getRequestedDataMode } from './config.js';

async function resolveProvider() {
  const requestedMode = getRequestedDataMode();

  if (requestedMode === 'mock') {
    console.info('[Story OS] data mode: mock');
    return mockDataProvider;
  }

  if (requestedMode === 'api') {
    try {
      await apiDataProvider.getHealth();
      console.info('[Story OS] data mode: api');
      return apiDataProvider;
    } catch (error) {
      console.warn('[Story OS] API unavailable, fallback to mock', error);
      return mockDataProvider;
    }
  }

  console.info('[Story OS] data mode: mock');
  return mockDataProvider;
}

let activeProviderPromise = null;

export async function getDataProvider() {
  if (!activeProviderPromise) {
    activeProviderPromise = resolveProvider();
  }
  return activeProviderPromise;
}

export async function loadAppData() {
  const requestedMode = getRequestedDataMode();
  const provider = await getDataProvider();

  try {
    const [
      project,
      entities,
      events,
      narrativeUnits,
      relations,
      sourceFragment,
    ] = await Promise.all([
      provider.getProject(),
      provider.getEntities(),
      provider.getEvents(),
      provider.getNarrativeUnits(),
      provider.getRelations(),
      provider.getSourceFragment().catch(() => ''),
    ]);

    return {
      project,
      entities,
      events,
      narrativeUnits,
      relations,
      sourceFragment,
    };
  } catch (error) {
    if (requestedMode === 'api') {
      console.warn('[Story OS] API data load failed, fallback to mock', error);

      const [
        project,
        entities,
        events,
        narrativeUnits,
        relations,
        sourceFragment,
      ] = await Promise.all([
        mockDataProvider.getProject(),
        mockDataProvider.getEntities(),
        mockDataProvider.getEvents(),
        mockDataProvider.getNarrativeUnits(),
        mockDataProvider.getRelations(),
        mockDataProvider.getSourceFragment().catch(() => ''),
      ]);

      return {
        project,
        entities,
        events,
        narrativeUnits,
        relations,
        sourceFragment,
      };
    }

    throw error;
  }
}