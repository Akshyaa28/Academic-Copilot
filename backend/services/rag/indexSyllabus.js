const KnowledgeChunk = require("../../models/KnowledgeChunk");
const SyllabusPlan = require("../../models/SyllabusPlan");
const { createKnowledgeChunks } = require("./chunker");
const { fetchEmbedding, hasEmbeddingConfig, getEmbeddingConfig } = require("./embedder");

const indexPlanKnowledge = async ({ plan }) => {
  if (!plan) {
    throw new Error("A syllabus plan is required for RAG indexing");
  }

  const baseChunks = createKnowledgeChunks({
    syllabusText: plan.syllabusText,
    structure: plan.structure
  });

  if (!baseChunks.length) {
    return {
      success: false,
      chunkCount: 0,
      reason: "No chunks generated"
    };
  }

  const canEmbed = hasEmbeddingConfig();
  const embeddingConfig = canEmbed ? getEmbeddingConfig() : null;

  const documents = [];
  for (const chunk of baseChunks) {
    let embedding = [];

    if (canEmbed) {
      try {
        embedding = (await fetchEmbedding(chunk.content)) || [];
      } catch (error) {
        console.error("[RAG] Failed to embed chunk:", error.message);
      }
    }

    documents.push({
      userId: plan.userId,
      planId: plan._id,
      chunkIndex: chunk.chunkIndex,
      sourceType: chunk.sourceType,
      subject: chunk.subject,
      topic: chunk.topic,
      content: chunk.content,
      keywords: chunk.keywords,
      embedding,
      embeddingModel: embedding.length ? embeddingConfig.model : "",
      tokenCountEstimate: chunk.tokenCountEstimate
    });
  }

  await KnowledgeChunk.deleteMany({ planId: plan._id });
  await KnowledgeChunk.insertMany(documents, { ordered: false });
  await SyllabusPlan.findByIdAndUpdate(plan._id, {
    ragChunkCount: documents.length,
    ragIndexedAt: new Date()
  });

  return {
    success: true,
    chunkCount: documents.length,
    embeddedChunkCount: documents.filter((doc) => doc.embedding.length > 0).length
  };
};

module.exports = {
  indexPlanKnowledge
};
