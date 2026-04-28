import React, { useState, useRef, useEffect } from "react";
import axios from "axios";

function DoubtChat({ token }) {
  const welcomeText = "Hi! I'm your AI tutor. Ask me anything about your subjects, topics, or academic doubts. I'm here to help!";
  const [messages, setMessages] = useState([
    {
      id: "welcome",
      type: "bot",
      text: welcomeText
    }
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();

    if (!inputValue.trim()) {
      return;
    }

    setErrorMessage("");
    const questionText = inputValue.trim();

    const userMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      text: questionText
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setIsLoading(true);

    try {
      const response = await axios.post(
        "http://localhost:5000/api/dashboard/doubt-chat",
        { question: questionText },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      const botMessage = {
        id: `bot-${Date.now()}`,
        type: "bot",
        text: response.data.answer
      };

      setMessages((prev) => [...prev, botMessage]);
    } catch (error) {
      const errorText = error.response?.data?.msg || "Failed to get response. Please try again.";
      setErrorMessage(errorText);

      if (errorText.toLowerCase().includes("api key")) {
        const setupMessage = {
          id: `bot-${Date.now()}`,
          type: "error",
          text: `${errorText}\n\nPlease set a valid Groq API key in the backend environment variables as GROQ_API_KEY.`
        };
        setMessages((prev) => [...prev, setupMessage]);
      } else {
        const errorBotMessage = {
          id: `bot-${Date.now()}`,
          type: "error",
          text: errorText
        };
        setMessages((prev) => [...prev, errorBotMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: "welcome",
        type: "bot",
        text: welcomeText
      }
    ]);
    setErrorMessage("");
  };

  return (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">DOUBT CHAT</p>
      <h1 className="dashboard-section-heading">Ask your AI tutor</h1>
      <p className="dashboard-overview-text">
        Get instant answers to your academic doubts. Our AI tutor understands your syllabus context.
      </p>

      <div className="dashboard-doubt-chat-container">
        <div className="dashboard-doubt-messages">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`dashboard-doubt-message dashboard-doubt-message-${message.type}`}
            >
              <div className="dashboard-doubt-message-avatar">
                {message.type === "user" ? "You" : "AI"}
              </div>
              <div className="dashboard-doubt-message-bubble">
                <p>{message.text}</p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="dashboard-doubt-message dashboard-doubt-message-bot">
              <div className="dashboard-doubt-message-avatar">AI</div>
              <div className="dashboard-doubt-message-bubble dashboard-doubt-loading">
                <span className="dashboard-doubt-loading-dot" />
                <span className="dashboard-doubt-loading-dot" />
                <span className="dashboard-doubt-loading-dot" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {errorMessage && (
          <div className="dashboard-doubt-error-banner">
            <span className="dashboard-doubt-error-icon">!</span>
            <p>{errorMessage}</p>
          </div>
        )}

        <form className="dashboard-doubt-form" onSubmit={handleSendMessage}>
          <input
            type="text"
            className="dashboard-doubt-input"
            placeholder="Ask your tutor anything..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            disabled={isLoading}
          />
          <button
            type="submit"
            className="dashboard-doubt-send-btn"
            disabled={isLoading || !inputValue.trim()}
          >
            {isLoading ? "..." : "Send"}
          </button>
          <button
            type="button"
            className="dashboard-doubt-clear-btn"
            onClick={handleClearChat}
            disabled={isLoading}
          >
            Clear
          </button>
        </form>

        <div className="dashboard-doubt-suggestions">
          <p className="dashboard-doubt-suggestions-label">Try asking:</p>
          <div className="dashboard-doubt-suggestions-grid">
            <button
              type="button"
              className="dashboard-doubt-suggestion-chip"
              onClick={() => setInputValue("Explain how this concept works in detail")}
              disabled={isLoading}
            >
              Explain a concept
            </button>
            <button
              type="button"
              className="dashboard-doubt-suggestion-chip"
              onClick={() => setInputValue("How can I practice this topic?")}
              disabled={isLoading}
            >
              Practice tips
            </button>
            <button
              type="button"
              className="dashboard-doubt-suggestion-chip"
              onClick={() => setInputValue("What are the key points to remember?")}
              disabled={isLoading}
            >
              Key points
            </button>
            <button
              type="button"
              className="dashboard-doubt-suggestion-chip"
              onClick={() => setInputValue("Give me real-world examples")}
              disabled={isLoading}
            >
              Real-world examples
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export default DoubtChat;
