const mongoose = require("mongoose");

const KnowledgeChunkSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SyllabusPlan",
      required: true,
      index: true
    },
    chunkIndex: {
      type: Number,
      required: true
    },
    sourceType: {
      type: String,
      default: "syllabus"
    },
    subject: {
      type: String,
      default: ""
    },
    topic: {
      type: String,
      default: ""
    },
    content: {
      type: String,
      required: true
    },
    keywords: {
      type: [String],
      default: []
    },
    embedding: {
      type: [Number],
      default: []
    },
    embeddingModel: {
      type: String,
      default: ""
    },
    tokenCountEstimate: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

KnowledgeChunkSchema.index({ userId: 1, planId: 1, chunkIndex: 1 }, { unique: true });

module.exports = mongoose.model("KnowledgeChunk", KnowledgeChunkSchema);
