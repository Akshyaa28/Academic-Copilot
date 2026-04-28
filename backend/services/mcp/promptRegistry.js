const { z } = require("zod");

const promptDefinitions = [
  {
    name: "study-coach",
    config: {
      title: "Study Coach Prompt",
      description: "Guide the model to act as a study planning coach.",
      argsSchema: {
        focus: z.string().describe("Student focus area or planning need")
      }
    },
    build: async ({ focus }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Help me create a focused study strategy for this need: ${focus}`
          }
        }
      ]
    })
  },
  {
    name: "progress-coach",
    config: {
      title: "Progress Coach Prompt",
      description: "Guide the model to analyze student performance trends constructively.",
      argsSchema: {
        concern: z.string().describe("The student's progress or performance concern")
      }
    },
    build: async ({ concern }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Analyze this student performance concern and give constructive next steps: ${concern}`
          }
        }
      ]
    })
  },
  {
    name: "tutor-doubt",
    config: {
      title: "Tutor Doubt Prompt",
      description: "Guide the model to answer a student doubt using relevant academic context.",
      argsSchema: {
        question: z.string().describe("The student's question")
      }
    },
    build: async ({ question }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Answer this academic doubt clearly and accurately: ${question}`
          }
        }
      ]
    })
  }
];

module.exports = {
  promptDefinitions
};
