const plannerAgent = require("./plannerAgent");
const progressAgent = require("./progressAgent");
const tutorAgent = require("./tutorAgent");

const classifyIntent = (question) => {
  const text = question.toLowerCase();

  if (/(score|report|progress|weak area|strong area|performance|accuracy)/.test(text)) {
    return "progress";
  }

  if (/(study plan|schedule|revision|timetable|how should i study|plan my)/.test(text)) {
    return "planner";
  }

  return "tutor";
};

const coordinatorAgent = async ({ userId, question }) => {
  const intent = classifyIntent(question);

  if (intent === "planner") {
    const result = await plannerAgent({ userId, question });
    return {
      ...result,
      coordinator: {
        intent,
        route: "planner"
      }
    };
  }

  if (intent === "progress") {
    const result = await progressAgent({ userId, question });
    return {
      ...result,
      coordinator: {
        intent,
        route: "progress"
      }
    };
  }

  const result = await tutorAgent({ userId, question });
  return {
    ...result,
    coordinator: {
      intent,
      route: "tutor"
    }
  };
};

module.exports = coordinatorAgent;
