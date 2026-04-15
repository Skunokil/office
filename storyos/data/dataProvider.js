import {
  mockProject,
  mockEntities,
  mockEvents,
  mockNarrativeUnits,
  mockRelations,
  mockSourceFragment,
} from './mockData.js';

export const dataProvider = {
  async getProject() {
    return mockProject;
  },
  async getEntities() {
    return mockEntities;
  },
  async getEvents() {
    return mockEvents;
  },
  async getNarrativeUnits() {
    return mockNarrativeUnits;
  },
  async getRelations() {
    return mockRelations;
  },
  async getSourceFragment() {
    return mockSourceFragment;
  },
};