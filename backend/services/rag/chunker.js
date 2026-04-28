const MAX_CHARS_PER_CHUNK = 900;
const CHUNK_OVERLAP_CHARS = 180;

const normalizeWhitespace = (text) => text.replace(/\s+/g, " ").trim();

const estimateTokens = (text) => Math.ceil(text.length / 4);

const buildKeywordSet = (values) => {
  const stopWords = new Set([
    "the",
    "and",
    "for",
    "with",
    "that",
    "this",
    "from",
    "into",
    "your",
    "their",
    "about",
    "what",
    "when",
    "where",
    "which",
    "while",
    "have",
    "will",
    "been",
    "being",
    "they",
    "them",
    "under",
    "through"
  ]);

  const keywords = new Set();

  values
    .join(" ")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((word) => word.length > 2 && !stopWords.has(word))
    .forEach((word) => keywords.add(word));

  return Array.from(keywords).slice(0, 40);
};

const splitLongText = (text, maxChars = MAX_CHARS_PER_CHUNK, overlapChars = CHUNK_OVERLAP_CHARS) => {
  const normalized = normalizeWhitespace(text);

  if (!normalized) {
    return [];
  }

  if (normalized.length <= maxChars) {
    return [normalized];
  }

  const chunks = [];
  let start = 0;

  while (start < normalized.length) {
    let end = Math.min(start + maxChars, normalized.length);

    if (end < normalized.length) {
      const lastPeriod = normalized.lastIndexOf(". ", end);
      const lastSemicolon = normalized.lastIndexOf("; ", end);
      const boundary = Math.max(lastPeriod, lastSemicolon);

      if (boundary > start + Math.floor(maxChars * 0.55)) {
        end = boundary + 1;
      }
    }

    const chunk = normalized.slice(start, end).trim();
    if (chunk) {
      chunks.push(chunk);
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
};

const createKnowledgeChunks = ({ syllabusText, structure }) => {
  const chunks = [];

  if (syllabusText && syllabusText.trim()) {
    splitLongText(syllabusText).forEach((content) => {
      chunks.push({
        sourceType: "syllabus_text",
        subject: "",
        topic: "",
        content,
        keywords: buildKeywordSet([content]),
        tokenCountEstimate: estimateTokens(content)
      });
    });
  }

  (structure || []).forEach((subject) => {
    const subjectSummary = [
      `Subject: ${subject.name}.`,
      ...subject.topics.map((topic) => {
        const subtopics = topic.subtopics.length ? topic.subtopics.join(", ") : topic.title;
        return `Topic: ${topic.title}. Subtopics: ${subtopics}.`;
      })
    ].join(" ");

    splitLongText(subjectSummary).forEach((content) => {
      chunks.push({
        sourceType: "subject_summary",
        subject: subject.name,
        topic: "",
        content,
        keywords: buildKeywordSet([subject.name, content]),
        tokenCountEstimate: estimateTokens(content)
      });
    });

    subject.topics.forEach((topic) => {
      const topicSummary = [
        `Subject: ${subject.name}.`,
        `Topic: ${topic.title}.`,
        topic.subtopics.length
          ? `Subtopics: ${topic.subtopics.join(", ")}.`
          : `Core concept: ${topic.title}.`
      ].join(" ");

      splitLongText(topicSummary).forEach((content) => {
        chunks.push({
          sourceType: "topic_summary",
          subject: subject.name,
          topic: topic.title,
          content,
          keywords: buildKeywordSet([subject.name, topic.title, ...topic.subtopics]),
          tokenCountEstimate: estimateTokens(content)
        });
      });
    });
  });

  return chunks.map((chunk, index) => ({
    ...chunk,
    chunkIndex: index
  }));
};

module.exports = {
  createKnowledgeChunks
};
