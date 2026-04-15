export function buildStoryTimeline(events) {
  return [...events].sort((a, b) => {
    if (!a.storyTime) return 1;
    if (!b.storyTime) return -1;
    return a.storyTime.localeCompare(b.storyTime);
  });
}

export function buildNarrativeTimeline(events) {
  return [...events].sort((a, b) => {
    if (a.narrativeOrder == null) return 1;
    if (b.narrativeOrder == null) return -1;
    return a.narrativeOrder - b.narrativeOrder;
  });
}