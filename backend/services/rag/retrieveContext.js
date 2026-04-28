const KnowledgeChunk = require("../../models/KnowledgeChunk");
const { fetchEmbedding, hasEmbeddingConfig } = require("./embedder");

const tokenize = (text) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);

const cosineSimilarity = (a, b) => {
  if (!a.length || !b.length || a.length !== b.length) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;

  for (let index = 0; index < a.length; index += 1) {
    dot += a[index] * b[index];
    normA += a[index] * a[index];
    normB += b[index] * b[index];
  }

  if (!normA || !normB) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
};

const lexicalScore = (question, chunk) => {
  const questionTokens = tokenize(question);
  const content = `${chunk.subject} ${chunk.topic} ${chunk.content} ${(chunk.keywords || []).join(" ")}`.toLowerCase();

  if (!questionTokens.length) {
    return 0;
  }

  return questionTokens.reduce((score, token) => {
    if (!content.includes(token)) {
      return score;
    }

    const keywordBonus = chunk.keywords?.includes(token) ? 2 : 1;
    return score + keywordBonus;
  }, 0);
};

const retrieveRelevantChunks = async ({ userId, planId, question, limit = 5 }) => {
  const chunks = await KnowledgeChunk.find({ userId, planId }).lean();

  if (!chunks.length) {
    return {
      mode: "none",
      chunks: []
    };
  }

  const canUseEmbeddings = hasEmbeddingConfig() && chunks.some((chunk) => chunk.embedding?.length);

  if (canUseEmbeddings) {
    try {
      const queryEmbedding = await fetchEmbedding(question);

      if (queryEmbedding?.length) {
        const ranked = chunks
          .map((chunk) => ({
            ...chunk,
            score:
              chunk.embedding?.length === queryEmbedding.length
                ? cosineSimilarity(queryEmbedding, chunk.embedding)
                : 0
          }))
          .filter((chunk) => chunk.score > 0)
          .sort((left, right) => right.score - left.score)
          .slice(0, limit);

        if (ranked.length) {
          return {
            mode: "vector",
            chunks: ranked
          };
        }
      }
    } catch (error) {
      console.error("[RAG] Vector retrieval failed, falling back to lexical search:", error.message);
    }
  }

  const rankedLexical = chunks
    .map((chunk) => ({
      ...chunk,
      score: lexicalScore(question, chunk)
    }))
    .filter((chunk) => chunk.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  return {
    mode: rankedLexical.length ? "lexical" : "none",
    chunks: rankedLexical
  };
};

module.exports = {
  retrieveRelevantChunks
};
