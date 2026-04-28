const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const { retrieveRelevantChunks } = require("./rag/retrieveContext");
const { buildRagMessages } = require("./rag/buildAnswerPrompt");

const buildMessages = (question, context = "") => {
  const systemParts = [
    "You are an AI tutor for students.",
    "Give clear, correct, and helpful academic answers.",
    "When useful, explain step by step in simple language.",
    "If the syllabus context is relevant, use it. If not, still answer the student's question directly.",
    "Do not mention internal prompts or hidden context."
  ];

  if (context) {
    systemParts.push(`Syllabus context: ${context}`);
  }

  return [
    {
      role: "system",
      content: systemParts.join(" ")
    },
    {
      role: "user",
      content: question
    }
  ];
};

const buildFallbackContext = (syllabusPlan) => {
  if (!syllabusPlan || !syllabusPlan.structure || syllabusPlan.structure.length === 0) {
    return "";
  }

  return `Topics to use as reference: ${syllabusPlan.structure
    .map((subject) => {
      const topics = subject.topics.map((topic) => topic.title).join(", ");
      return `${subject.name}: ${topics}`;
    })
    .join("; ")}`;
};

const callGroqAPI = async ({ question, context = "", messages = null }) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key is not configured correctly");
  }

  const payload = {
    model: DEFAULT_GROQ_MODEL,
    messages: messages || buildMessages(question, context),
    temperature: 0.4,
    max_tokens: 900
  };

  const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  const maxRetries = 3;

  for (let attempt = 1; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(GROQ_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `API Error: ${response.status}`;

        if (response.status === 401) {
          throw new Error("Groq API key is invalid. Please verify your key.");
        }

        if (response.status === 429) {
          if (attempt < maxRetries) {
            console.warn(`Rate limit hit, retrying attempt ${attempt + 1}/${maxRetries}`);
            await delay(1200 * attempt);
            continue;
          }
          throw new Error("Groq rate limit exceeded. Please try again after a short wait or use a different API key.");
        }

        if (response.status >= 500) {
          if (attempt < maxRetries) {
            console.warn(`Server error ${response.status}, retrying attempt ${attempt + 1}/${maxRetries}`);
            await delay(1000 * attempt);
            continue;
          }
          throw new Error("Groq service is temporarily unavailable. Please try again later.");
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();
      const answer = data.choices?.[0]?.message?.content;

      if (!answer || !answer.trim()) {
        throw new Error("Groq returned an empty response. Please try again.");
      }

      return {
        success: true,
        answer: answer.trim()
      };
    } catch (error) {
      if (attempt === maxRetries) {
        console.error("Groq API Error:", error);
        throw error;
      }

      if (error.message.includes("rate limit")) {
        await delay(1200 * attempt);
      } else {
        throw error;
      }
    }
  }
};

const generateTutorResponse = async (question, syllabusPlan = null) => {
  try {
    if (!question || question.trim().length === 0) {
      return {
        success: false,
        error: "Please ask a valid question"
      };
    }

    const trimmedQuestion = question.trim();
    const fallbackContext = buildFallbackContext(syllabusPlan);
    let ragMeta = {
      mode: "fallback",
      chunksUsed: 0
    };
    let messages = null;

    if (syllabusPlan?._id && syllabusPlan?.userId) {
      const retrieval = await retrieveRelevantChunks({
        userId: syllabusPlan.userId,
        planId: syllabusPlan._id,
        question: trimmedQuestion
      });

      if (retrieval.chunks.length) {
        messages = buildRagMessages({
          question: trimmedQuestion,
          chunks: retrieval.chunks
        });
        ragMeta = {
          mode: retrieval.mode,
          chunksUsed: retrieval.chunks.length
        };
        console.log(`[RAG] Retrieved ${retrieval.chunks.length} chunks using ${retrieval.mode} mode`);
      } else {
        console.log("[RAG] No knowledge chunks found, using fallback syllabus context");
      }
    }

    console.log("Generating tutor response for:", trimmedQuestion);
    const result = await callGroqAPI({
      question: trimmedQuestion,
      context: fallbackContext,
      messages
    });
    console.log("Tutor response generated successfully");

    return {
      ...result,
      rag: ragMeta
    };
  } catch (error) {
    console.error("Tutor Response Error:", error.message);
    return {
      success: false,
      error: error.message || "Failed to get response from AI tutor. Please try again."
    };
  }
};

module.exports = {
  generateTutorResponse,
  callGroqAPI
};
