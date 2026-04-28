const quizAgent = require("./quizAgent");
const coordinatorAgent = require("./coordinatorAgent");
const { buildReportCard } = require("../performanceAnalyzer");
const { callGroqMessages } = require("../llm/groqClient");
const LocalMcpToolClient = require("./localMcpToolClient");

const AGENTIC_MODE_ENABLED = process.env.AGENTIC_MODE_ENABLED !== "false";

const runAgenticDoubtChat = async ({ userId, question }) => coordinatorAgent({ userId, question });

const getAgenticQuizQuestions = async ({ userId, plan }) => quizAgent({ userId, plan });

const buildAgenticReport = async ({ userId, attempts }) => {
  const report = buildReportCard(attempts);

  if (!report) {
    return null;
  }

  if (!AGENTIC_MODE_ENABLED || !process.env.GROQ_API_KEY) {
    return report;
  }

  try {
    const client = new LocalMcpToolClient();
    const guidance = await client.callTool("fetch_study_guidance", { userId });
    const coaching = await callGroqMessages({
      messages: [
        {
          role: "system",
          content:
            "You are a progress coaching agent. Generate three short, constructive study suggestions based on the student's report and guidance."
        },
        {
          role: "user",
          content: `Report:\n${JSON.stringify(report)}\n\nGuidance:\n${JSON.stringify(guidance)}`
        }
      ],
      temperature: 0.2,
      maxTokens: 220
    });

    const suggestions = coaching
      .split(/\n+/)
      .map((line) => line.replace(/^[-*0-9.)\s]+/, "").trim())
      .filter(Boolean)
      .slice(0, 3);

    if (suggestions.length) {
      report.feedback.suggestions = suggestions;
    }

    return report;
  } catch (error) {
    console.error("[Agents] Progress coaching fallback:", error.message);
    return report;
  }
};

module.exports = {
  AGENTIC_MODE_ENABLED,
  runAgenticDoubtChat,
  getAgenticQuizQuestions,
  buildAgenticReport
};
