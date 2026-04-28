const GROQ_CHAT_COMPLETIONS_URL = "https://api.groq.com/openai/v1/chat/completions";
const DEFAULT_GROQ_MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

const callGroqMessages = async ({ messages, temperature = 0.4, maxTokens = 900 }) => {
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    throw new Error("Groq API key is not configured correctly");
  }

  const payload = {
    model: DEFAULT_GROQ_MODEL,
    messages,
    temperature,
    max_tokens: maxTokens
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
            await delay(1200 * attempt);
            continue;
          }
          throw new Error("Groq rate limit exceeded. Please try again after a short wait or use a different API key.");
        }

        if (response.status >= 500) {
          if (attempt < maxRetries) {
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

      return answer.trim();
    } catch (error) {
      if (attempt === maxRetries) {
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

module.exports = {
  DEFAULT_GROQ_MODEL,
  callGroqMessages
};
