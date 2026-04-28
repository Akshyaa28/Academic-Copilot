const { callGroqMessages } = require("../llm/groqClient");
const LocalMcpToolClient = require("./localMcpToolClient");

const progressAgent = async ({ userId, question }) => {
  const client = new LocalMcpToolClient();
  const report = await client.callTool("fetch_report_snapshot", { userId });

  if (!report) {
    return {
      success: false,
      error: "No report card available yet."
    };
  }

  const answer = await callGroqMessages({
    messages: [
      {
        role: "system",
        content:
          "You are a progress analysis agent. Explain performance trends, weak areas, strengths, and concrete next steps in simple student-friendly language."
      },
      {
        role: "user",
        content: `Student question: ${question}\n\nReport data:\n${JSON.stringify(report)}`
      }
    ],
    temperature: 0.25,
    maxTokens: 650
  });

  return {
    success: true,
    answer,
    agent: {
      name: "progress",
      toolsUsed: client.getToolCalls()
    }
  };
};

module.exports = progressAgent;
