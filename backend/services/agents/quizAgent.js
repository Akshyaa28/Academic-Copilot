const { buildQuizQuestions } = require("../quizGenerator");
const LocalMcpToolClient = require("./localMcpToolClient");

const sortQuestionsByWeakAreas = (questions, weakAreas = []) => {
  if (!weakAreas.length) {
    return questions;
  }

  const weakSet = new Set(weakAreas);
  return [...questions].sort((left, right) => {
    const leftWeak = weakSet.has(left.subject) ? 1 : 0;
    const rightWeak = weakSet.has(right.subject) ? 1 : 0;
    return rightWeak - leftWeak;
  });
};

const quizAgent = async ({ userId, plan }) => {
  const client = new LocalMcpToolClient();
  const report = await client.callTool("fetch_report_snapshot", { userId });
  const baseQuestions = buildQuizQuestions(plan);
  const adaptedQuestions = sortQuestionsByWeakAreas(baseQuestions, report?.feedback?.weakAreas || []);

  return {
    success: true,
    questions: adaptedQuestions,
    agent: {
      name: "quiz",
      toolsUsed: client.getToolCalls()
    }
  };
};

module.exports = quizAgent;
