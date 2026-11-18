function mapTopics(topics) {
  return [...topics].map(([title, count]) => ({ title, count }));
}

export function buildVocabularyStats(rows, { isAdmin = false, userName = "" } = {}) {
  const byTopic = new Map();
  const activeTopics = new Map();
  const uploadedTopics = new Map();
  const destinationTopics = {
    listening: new Map(),
    speaking: new Map(),
    reading: new Map(),
    writing: new Map(),
  };
  let totalCount = 0;
  let uploadedCount = 0;

  for (const row of rows) {
    const count = row.count == null ? 1 : Number(row.count) || 0;
    const topic = row.topic;
    totalCount += count;
    byTopic.set(topic, (byTopic.get(topic) || 0) + count);

    if (row.target_tab === "uploaded") {
      uploadedCount += count;
      const current = uploadedTopics.get(topic);
      uploadedTopics.set(topic, {
        count: (current?.count || 0) + count,
        uploaderName:
          row.uploaded_by_name ||
          current?.uploaderName ||
          (isAdmin ? "Admin" : userName || "You"),
      });
    } else if (destinationTopics[row.target_tab]) {
      const destination = destinationTopics[row.target_tab];
      destination.set(topic, (destination.get(topic) || 0) + count);
    } else {
      activeTopics.set(topic, (activeTopics.get(topic) || 0) + count);
    }
  }

  const sumCounts = (topics) =>
    [...topics.values()].reduce((total, count) => total + count, 0);

  return {
    success: true,
    totalCount,
    activeCount: sumCounts(activeTopics),
    listeningCount: sumCounts(destinationTopics.listening),
    speakingCount: sumCounts(destinationTopics.speaking),
    readingCount: sumCounts(destinationTopics.reading),
    writingCount: sumCounts(destinationTopics.writing),
    uploadedCount,
    byTopic: Object.fromEntries(byTopic),
    activeTopics: mapTopics(activeTopics),
    listeningTopics: mapTopics(destinationTopics.listening),
    speakingTopics: mapTopics(destinationTopics.speaking),
    readingTopics: mapTopics(destinationTopics.reading),
    writingTopics: mapTopics(destinationTopics.writing),
    uploadedTopics: [...uploadedTopics].map(([title, info]) => ({
      title,
      count: info.count,
      uploaderName: info.uploaderName,
    })),
  };
}
