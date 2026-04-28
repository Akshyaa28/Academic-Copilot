const { callGroqMessages } = require("../llm/groqClient");
const LocalMcpToolClient = require("./localMcpToolClient");

const plannerAgent = async ({ userId, question }) => {
  const client = new LocalMcpToolClient();
  const [plan, guidance, report] = await Promise.all([
    client.callTool("fetch_latest_plan", { userId }),
    client.callTool("fetch_study_guidance", { userId }),
    client.callTool("fetch_report_snapshot", { userId })
  ]);

  if (!plan) {
    return {
      success: false,
      error: "No syllabus plan found yet."
    };
  }

  const answer = await callGroqMessages({
    messages: [
      {
        role: "system",
        content:
          "You are a study planning agent. Create practical, personalized academic planning guidance based on the student's latest plan and progress. Be concise, encouraging, and actionable."
      },
      {
        role: "user",
        content: `Student question: ${question}\n\nPlan data:\n${JSON.stringify(plan)}\n\nStudy guidance:\n${JSON.stringify(
          guidance
        )}\n\nReport snapshot:\n${JSON.stringify(report)}`
      }
    ],
    temperature: 0.3,
    maxTokens: 700
  });

  return {
    success: true,
    answer,
    agent: {
      name: "planner",
      toolsUsed: client.getToolCalls()
    }
  };
};

module.exports = plannerAgent;
