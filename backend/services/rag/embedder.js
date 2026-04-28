const EMBEDDING_BASE_URL = process.env.RAG_EMBEDDING_BASE_URL || "";
const EMBEDDING_API_KEY = process.env.RAG_EMBEDDING_API_KEY || "";
const EMBEDDING_MODEL = process.env.RAG_EMBEDDING_MODEL || "";

const hasEmbeddingConfig = () => Boolean(EMBEDDING_BASE_URL && EMBEDDING_API_KEY && EMBEDDING_MODEL);

const getEmbeddingConfig = () => ({
  baseUrl: EMBEDDING_BASE_URL.replace(/\/$/, ""),
  apiKey: EMBEDDING_API_KEY,
  model: EMBEDDING_MODEL
});

const fetchEmbedding = async (input) => {
  if (!hasEmbeddingConfig()) {
    return null;
  }

  const config = getEmbeddingConfig();
  const response = await fetch(`${config.baseUrl}/embeddings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      input
    })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Embedding request failed with status ${response.status}`);
  }

  const data = await response.json();
  return data.data?.[0]?.embedding || null;
};

module.exports = {
  hasEmbeddingConfig,
  getEmbeddingConfig,
  fetchEmbedding
};
