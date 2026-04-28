const cleanLine = (line) => line.replace(/\s+/g, " ").trim();
const metadataPattern = /^(instructor|faculty|prerequisite|prerequisites|credits|course code|code|semester)$/i;
const topicLeadPattern = /^(unit|module|chapter|week|topic)\b/i;

const createTopic = (title) => ({
  title,
  subtopics: []
});

const parseSyllabus = (syllabusText) => {
  const lines = syllabusText
    .split(/\r?\n/)
    .map(cleanLine)
    .filter(Boolean);

  if (!lines.length) {
    return [];
  }

  const subjects = [];
  let currentSubject = null;
  let currentTopic = null;

  lines.forEach((line) => {
    const normalized = line.replace(/^[-*0-9.)\s]+/, "").trim();
    const [leftSide] = normalized.split(":").map(cleanLine);

    if (!currentSubject) {
      currentSubject = { name: normalized, topics: [] };
      subjects.push(currentSubject);
      currentTopic = null;
      return;
    }

    if (normalized.includes(":") && metadataPattern.test(leftSide)) {
      if (!currentTopic) {
        currentTopic = createTopic("Course Context");
        currentSubject.topics.push(currentTopic);
      }

      currentTopic.subtopics.push(normalized);
      return;
    }

    if (topicLeadPattern.test(normalized) || /^topics covered\b/i.test(normalized)) {
      currentTopic = createTopic(normalized);
      currentSubject.topics.push(currentTopic);
      return;
    }

    if (/^(subject|course|paper)\b/i.test(normalized) && normalized.includes(":")) {
      currentSubject = { name: normalized.replace(/^(subject|course|paper)\s*:\s*/i, ""), topics: [] };
      subjects.push(currentSubject);
      currentTopic = null;
      return;
    }

    if (!currentTopic) {
      currentTopic = createTopic(`Core Topic ${currentSubject.topics.length + 1}`);
      currentSubject.topics.push(currentTopic);
    }

    currentTopic.subtopics.push(normalized);
  });

  return subjects.map((subject, index) => ({
    name: subject.name || `Subject ${index + 1}`,
    topics: subject.topics.length
      ? subject.topics
      : [createTopic("Foundation"), createTopic("Key Concepts")]
  }));
};

module.exports = parseSyllabus;
