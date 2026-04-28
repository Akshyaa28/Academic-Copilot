import React from "react";
import { useNavigate } from "react-router-dom";

function Hero() {
  const navigate = useNavigate();

  return (
    <section className="hero">
      <p className="tag">AI ACADEMIC CO-PILOT</p>

      <h1>
        From <span>syllabus</span> to mastery,
        <br /> guided every <span>step</span>.
      </h1>

      <p className="subtitle">
        Paste your syllabus. Get a complete learning system — plan,
        resources, quizzes, doubt-solving and a personalised report card.
      </p>

      <div className="hero-buttons">
        <button
          className="btn-primary"
          onClick={() => navigate("/signup")}
        >
          Start with my syllabus →
        </button>

        <button className="btn-outline">
          Explore features ↓
        </button>
      </div>
    </section>
  );
}

export default Hero;