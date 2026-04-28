const { callGroqMessages } = require("../llm/groqClient");
const LocalMcpToolClient = require("./localMcpToolClient");

const tutorAgent = async ({ userId, question }) => {
  const client = new LocalMcpToolClient();
  const [plan, ragContext, report] = await Promise.all([
    client.callTool("fetch_latest_plan", { userId }),
    client.callTool("fetch_rag_context", { userId, question, limit: 5 }),
    client.callTool("fetch_report_snapshot", { userId })
  ]);

  const answer = await callGroqMessages({
    messages: [
      {
        role: "system",
        content:
          "You are a tutor agent. Answer academic doubts clearly, accurately, and in simple language. Use the retrieved learning context first. If context is incomplete, still help carefully."
      },
      {
        role: "user",
        content: `Student question: ${question}\n\nLatest plan:\n${JSON.stringify(
          plan
        )}\n\nRetrieved context:\n${JSON.stringify(ragContext)}\n\nProgress snapshot:\n${JSON.stringify(report)}`
      }
    ],
    temperature: 0.35,
    maxTokens: 850
  });

  return {
    success: true,
    answer,
    agent: {
      name: "tutor",
      toolsUsed: client.getToolCalls(),
      ragMode: ragContext?.mode || "none"
    }
  };
};

module.exports = tutorAgent;
