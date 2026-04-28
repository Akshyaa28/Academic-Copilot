const { z } = require("zod");
const SyllabusPlan = require("../../models/SyllabusPlan");
const QuizAttempt = require("../../models/QuizAttempt");
const { buildQuizQuestions } = require("../quizGenerator");
const { buildReportCard } = require("../performanceAnalyzer");
const { retrieveRelevantChunks } = require("../rag/retrieveContext");

const serialize = (value) => JSON.stringify(value, null, 2);

const getLatestPlan = async (userId) =>
  SyllabusPlan.findOne({ userId }).sort({ createdAt: -1 }).lean();

const getLatestAttempts = async (userId) =>
  QuizAttempt.find({ userId }).sort({ createdAt: -1 }).lean();

const executeLatestPlanTool = async ({ userId }) => {
  const plan = await getLatestPlan(userId);
  if (!plan) {
    return null;
  }

  return {
    id: String(plan._id),
    level: plan.level,
    daysAvailable: plan.daysAvailable,
    hoursPerDay: plan.hoursPerDay,
    preferredTime: plan.preferredTime,
    structure: plan.structure,
    suggestions: plan.suggestions,
    resources: plan.resources,
    ragChunkCount: plan.ragChunkCount || 0
  };
};

const executeReportSnapshotTool = async ({ userId }) => {
  const attempts = await getLatestAttempts(userId);
  return buildReportCard(attempts);
};

const executeQuizSnapshotTool = async ({ userId }) => {
  const plan = await getLatestPlan(userId);
  if (!plan) {
    return null;
  }

  const questions = buildQuizQuestions(plan);
  const attempts = await getLatestAttempts(userId);
  const latestAttempt = attempts[0] || null;

  return {
    planId: String(plan._id),
    totalQuestions: questions.length,
    latestAttempt: latestAttempt
      ? {
          percentage: latestAttempt.percentage,
          weakAreas: latestAttempt.weakAreas,
          strongAreas: latestAttempt.strongAreas
        }
      : null,
    questions: questions.map((question) => ({
      id: question.id,
      subject: question.subject,
      topic: question.topic,
      prompt: question.prompt,
      type: question.type
    }))
  };
};

const executeRagContextTool = async ({ userId, question, limit = 5 }) => {
  const plan = await getLatestPlan(userId);
  if (!plan) {
    return {
      mode: "none",
      chunks: []
    };
  }

  const retrieval = await retrieveRelevantChunks({
    userId: plan.userId,
    planId: plan._id,
    question,
    limit
  });

  return {
    mode: retrieval.mode,
    chunks: retrieval.chunks.map((chunk) => ({
      subject: chunk.subject,
      topic: chunk.topic,
      content: chunk.content,
      keywords: chunk.keywords
    }))
  };
};

const executeStudyGuidanceTool = async ({ userId }) => {
  const plan = await getLatestPlan(userId);
  const report = await executeReportSnapshotTool({ userId });

  if (!plan) {
    return null;
  }

  return {
    level: plan.level,
    preferredTime: plan.preferredTime,
    suggestions: plan.suggestions,
    revisionSlots: plan.revisionSlots,
    weakAreas: report?.feedback?.weakAreas || [],
    strongAreas: report?.feedback?.strongAreas || []
  };
};

const toolDefinitions = [
  {
    name: "fetch_latest_plan",
    title: "Fetch Latest Plan",
    description: "Get the user's latest generated learning plan and syllabus structure.",
    inputSchema: {
      userId: z.string().describe("User id whose plan should be loaded")
    },
    execute: executeLatestPlanTool,
    toText: (result) => (result ? serialize(result) : "No syllabus plan found.")
  },
  {
    name: "fetch_report_snapshot",
    title: "Fetch Report Snapshot",
    description: "Get the user's report card analytics, performance trends, and feedback.",
    inputSchema: {
      userId: z.string().describe("User id whose report card should be loaded")
    },
    execute: executeReportSnapshotTool,
    toText: (result) => (result ? serialize(result) : "No report card available yet.")
  },
  {
    name: "fetch_quiz_snapshot",
    title: "Fetch Quiz Snapshot",
    description: "Get the current quiz question snapshot and latest assessment summary.",
    inputSchema: {
      userId: z.string().describe("User id whose quiz context should be loaded")
    },
    execute: executeQuizSnapshotTool,
    toText: (result) => (result ? serialize(result) : "No quiz snapshot available.")
  },
  {
    name: "fetch_rag_context",
    title: "Fetch RAG Context",
    description: "Retrieve the most relevant syllabus knowledge chunks for a student question.",
    inputSchema: {
      userId: z.string().describe("User id whose knowledge base should be searched"),
      question: z.string().describe("Student question to retrieve context for"),
      limit: z.number().optional().describe("Maximum number of chunks to retrieve")
    },
    execute: executeRagContextTool,
    toText: (result) => serialize(result)
  },
  {
    name: "fetch_study_guidance",
    title: "Fetch Study Guidance",
    description: "Get study suggestions, revision slots, and performance focus data for coaching.",
    inputSchema: {
      userId: z.string().describe("User id whose study guidance should be loaded")
    },
    execute: executeStudyGuidanceTool,
    toText: (result) => (result ? serialize(result) : "No study guidance available.")
  }
];

const toolMap = new Map(toolDefinitions.map((tool) => [tool.name, tool]));

const executeTool = async (name, args) => {
  const tool = toolMap.get(name);
  if (!tool) {
    throw new Error(`Unknown MCP tool: ${name}`);
  }

  return tool.execute(args || {});
};

const listTools = () => toolDefinitions;

module.exports = {
  listTools,
  executeTool,
  getLatestPlan,
  getLatestAttempts
};
