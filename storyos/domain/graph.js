import { findById } from './entities.js';

function toGraphNode(entity, role = 'default') {
  if (!entity) return null;

  return {
    id: entity.id,
    label: entity.name || entity.title || entity.id,
    type: entity.type || 'unknown',
    role,
    data: entity,
  };
}

export function buildEntityGraphData(data, centerId) {
  const center = findById(data, centerId);
  if (!center) {
    return { nodes: [], edges: [] };
  }

  const nodeMap = new Map();
  const edges = [];

  nodeMap.set(center.id, toGraphNode(center, 'center'));

  for (const rel of data.relations || []) {
    const touchesCenter = rel.fromId === centerId || rel.toId === centerId;
    if (!touchesCenter) continue;

    const fromEntity = findById(data, rel.fromId);
    const toEntity = findById(data, rel.toId);

    if (fromEntity && !nodeMap.has(fromEntity.id)) {
      nodeMap.set(fromEntity.id, toGraphNode(fromEntity, fromEntity.id === centerId ? 'center' : 'neighbor'));
    }

    if (toEntity && !nodeMap.has(toEntity.id)) {
      nodeMap.set(toEntity.id, toGraphNode(toEntity, toEntity.id === centerId ? 'center' : 'neighbor'));
    }

    edges.push({
      id: rel.id,
      from: rel.fromId,
      to: rel.toId,
      type: rel.type,
      label: rel.label || rel.type,
      data: rel,
    });
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}

export function buildOverviewGraphData(data) {
  const nodeMap = new Map();
  const edges = [];

  for (const rel of data.relations || []) {
    const fromEntity = findById(data, rel.fromId);
    const toEntity = findById(data, rel.toId);

    if (fromEntity && !nodeMap.has(fromEntity.id)) {
      nodeMap.set(fromEntity.id, toGraphNode(fromEntity));
    }

    if (toEntity && !nodeMap.has(toEntity.id)) {
      nodeMap.set(toEntity.id, toGraphNode(toEntity));
    }

    edges.push({
      id: rel.id,
      from: rel.fromId,
      to: rel.toId,
      type: rel.type,
      label: rel.label || rel.type,
      data: rel,
    });
  }

  return {
    nodes: Array.from(nodeMap.values()),
    edges,
  };
}