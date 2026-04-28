import React, { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import axios from "axios";
import DoubtChat from "../components/DoubtChat";

const workspaceItems = [
  { key: "overview", label: "Overview" },
  { key: "syllabus", label: "Syllabus" },
  { key: "studyPlan", label: "Study Plan" },
  { key: "resources", label: "Resources" },
  { key: "quiz", label: "Quiz" },
  { key: "reportCard", label: "Report Card" },
  { key: "doubtChat", label: "Doubt Chat" }
];

const quickLinks = [
  { key: "syllabus", title: "Syllabus", description: "Add your syllabus", accent: "book" },
  { key: "studyPlan", title: "Study Plan", description: "Day-by-day schedule", accent: "calendar" },
  { key: "resources", title: "Resources", description: "Videos, notes, practice", accent: "stack" },
  { key: "quiz", title: "Quiz", description: "Test your knowledge", accent: "spark" },
  { key: "reportCard", title: "Report Card", description: "0 attempts", accent: "chart" },
  { key: "doubtChat", title: "Doubt Chat", description: "Ask the tutor", accent: "chat" }
];

const sampleSyllabus = `Computer Networks
Module 1: Network Fundamentals
- OSI model
- TCP/IP model
- Types of networks
Module 2: Data Link Layer
- Framing
- Error detection
- Flow control
Module 3: Network Layer
- IP addressing
- Routing algorithms
- Subnetting`;

const buildFallbackResourceUrl = (resource, planLevel = "Intermediate") => {
  const topicText = `${resource.title} ${resource.reason || ""} ${planLevel}`;
  const encoded = encodeURIComponent(topicText);

  if (resource.type === "YouTube") {
    return `https://www.youtube.com/results?search_query=${encoded}`;
  }

  return `https://www.google.com/search?q=${encoded}`;
};

const normalizeResource = (resource, planLevel = "Intermediate") => {
  const normalizedType = resource.type === "Notes" ? "Google" : resource.type;

  const defaults = {
    YouTube: {
      platform: "YouTube",
      cta: "Open YouTube",
      description: "Video explanations for concept clarity, walkthroughs, and guided learning."
    },
    Google: {
      platform: "Google Search",
      cta: "Search Google",
      description: "Search the web for notes, summaries, and concept explainers tied to this topic."
    },
    Article: {
      platform: "Article Search",
      cta: "Read Articles",
      description: "Long-form reading material to deepen your understanding of the topic."
    },
    Practice: {
      platform: "Practice Search",
      cta: "Find Practice",
      description: "Practice-oriented resources to turn concepts into problem-solving skill."
    }
  };

  const fallback = defaults[normalizedType] || defaults.Google;

  return {
    ...resource,
    type: normalizedType,
    platform: resource.platform || fallback.platform,
    cta: resource.cta || fallback.cta,
    description: resource.description || fallback.description,
    url: resource.url || buildFallbackResourceUrl({ ...resource, type: normalizedType }, planLevel)
  };
};

function Dashboard() {
  const token = localStorage.getItem("token");
  const [activeSection, setActiveSection] = useState("overview");
  const [overview, setOverview] = useState(null);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizResult, setQuizResult] = useState(null);
  const [reportCard, setReportCard] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isQuizLoading, setIsQuizLoading] = useState(false);
  const [isQuizSubmitting, setIsQuizSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [formData, setFormData] = useState({
    syllabusText: "",
    hoursPerDay: "2",
    daysAvailable: "14",
    preferredTime: "evening",
    level: "Intermediate"
  });

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const [overviewRes, planRes] = await Promise.allSettled([
          axios.get("http://localhost:5000/api/dashboard/overview", {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get("http://localhost:5000/api/dashboard/plan", {
            headers: { Authorization: `Bearer ${token}` }
          })
        ]);

        if (overviewRes.status === "fulfilled") {
          setOverview(overviewRes.value.data);
        } else {
          setErrorMessage(overviewRes.reason.response?.data?.msg || "Unable to load dashboard.");
        }

        if (planRes.status === "fulfilled") {
          setCurrentPlan(planRes.value.data);
        }
      } catch (error) {
        setErrorMessage("Unable to load dashboard.");
      }
    };

    if (token) {
      fetchDashboard();
    }
  }, [token]);

  useEffect(() => {
    const hydrateQuizAndReport = async () => {
      if (!token || !currentPlan) {
        return;
      }

      await fetchQuizAndReport();
    };

    hydrateQuizAndReport();
  }, [token, currentPlan]);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  const statusText = currentPlan ? "Syllabus added" : "No syllabus yet";
  const welcomeTitle = overview?.welcomeTitle || "Welcome back";
  const welcomeSubtitle = overview?.welcomeSubtitle || "Your learning system at a glance.";

  const updateField = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const fetchQuizAndReport = async () => {
    if (!token) {
      return false;
    }

    try {
      setIsQuizLoading(true);

      const [quizRes, reportRes] = await Promise.allSettled([
        axios.get("http://localhost:5000/api/dashboard/quiz", {
          headers: { Authorization: `Bearer ${token}` }
        }),
        axios.get("http://localhost:5000/api/dashboard/report", {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      if (quizRes.status === "fulfilled") {
        setQuizData(quizRes.value.data);
      } else {
        setQuizData(null);
      }

      if (reportRes.status === "fulfilled") {
        setReportCard(reportRes.value.data);
      } else {
        setReportCard(null);
      }

      return quizRes.status === "fulfilled";
    } catch (error) {
      setQuizData(null);
      setReportCard(null);
      return false;
    } finally {
      setIsQuizLoading(false);
    }
  };

  const loadSampleSyllabus = () => {
    updateField("syllabusText", sampleSyllabus);
    setActiveSection("syllabus");
  };

  const extractUploadedSyllabus = async (file) => {
    const uploadData = new FormData();
    uploadData.append("syllabusFile", file);

    const res = await axios.post("http://localhost:5000/api/dashboard/syllabus/upload", uploadData, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    return res.data;
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setSelectedFile(file);
    setSelectedFileName(file.name);
    setErrorMessage("");
    setStatusMessage("");

    try {
      setIsUploading(true);

      const res = await extractUploadedSyllabus(file);

      updateField("syllabusText", res.syllabusText);
      setStatusMessage(res.msg);
      setActiveSection("syllabus");
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Failed to read uploaded syllabus.");
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const generateLearningSystem = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setStatusMessage("");

    if (isUploading) {
      setErrorMessage("Please wait for the syllabus upload to finish.");
      setActiveSection("syllabus");
      return;
    }

    let syllabusText = formData.syllabusText.trim();

    if (!syllabusText && selectedFile) {
      try {
        setIsUploading(true);
        const uploadRes = await extractUploadedSyllabus(selectedFile);
        syllabusText = uploadRes.syllabusText.trim();
        updateField("syllabusText", syllabusText);
      } catch (error) {
        setErrorMessage(error.response?.data?.msg || "Failed to read uploaded syllabus.");
        setActiveSection("syllabus");
        return;
      } finally {
        setIsUploading(false);
      }
    }

    if (!syllabusText) {
      setErrorMessage("Paste your syllabus first.");
      setActiveSection("syllabus");
      return;
    }

    try {
      setIsSubmitting(true);

      const res = await axios.post("http://localhost:5000/api/dashboard/syllabus", {
        ...formData,
        syllabusText
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setCurrentPlan(res.data.plan);
      setQuizData(null);
      setQuizAnswers({});
      setQuizResult(null);
      setReportCard(null);
      setStatusMessage(res.data.msg);
      await fetchQuizAndReport();
      setActiveSection("studyPlan");
      setOverview((prev) => ({
        ...prev,
        heroTitle: "Learning system ready",
        heroDescription: `Your latest plan covers ${res.data.plan.dailyPlan.length} study days with ${res.data.plan.resources.length} starter resources.`,
        hasSyllabus: true
      }));
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Failed to generate learning system.");
      setActiveSection("syllabus");
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateQuizAnswer = (questionId, optionIndex) => {
    setQuizAnswers((prev) => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const submitQuiz = async () => {
    if (!quizData?.questions?.length) {
      setErrorMessage("Quiz is not ready yet.");
      return;
    }

    if (Object.keys(quizAnswers).length < quizData.questions.length) {
      setErrorMessage("Please answer all quiz questions before submitting.");
      setActiveSection("quiz");
      return;
    }

    try {
      setIsQuizSubmitting(true);
      setErrorMessage("");
      setStatusMessage("");

      const res = await axios.post(
        "http://localhost:5000/api/dashboard/quiz/submit",
        { answers: quizAnswers },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setQuizResult(res.data.result);
      setStatusMessage(res.data.msg);

      const reportRes = await axios.get("http://localhost:5000/api/dashboard/report", {
        headers: { Authorization: `Bearer ${token}` }
      });

      setReportCard(reportRes.data);
      setActiveSection("reportCard");
    } catch (error) {
      setErrorMessage(error.response?.data?.msg || "Failed to submit quiz.");
      setActiveSection("quiz");
    } finally {
      setIsQuizSubmitting(false);
    }
  };

  const renderOverview = () => (
    <>
      <section className="dashboard-overview">
        <p className="dashboard-eyebrow">OVERVIEW</p>
        <h1>{welcomeTitle}</h1>
        <p className="dashboard-overview-text">{welcomeSubtitle}</p>
      </section>

      <section className="dashboard-empty-card">
        <div className="dashboard-empty-icon">*</div>
        <h2>{overview?.heroTitle || "No syllabus yet"}</h2>
        <p>
          {overview?.heroDescription ||
            "Add your syllabus to generate your personalised plan, resources, quizzes and more."}
        </p>
        <button type="button" className="dashboard-primary-btn" onClick={() => setActiveSection("syllabus")}>
          Add syllabus
          <span aria-hidden="true">-&gt;</span>
        </button>
      </section>

      <section className="dashboard-quick-links">
        <p className="dashboard-section-label">QUICK LINKS</p>
        <div className="dashboard-card-grid">
          {quickLinks.map((item) => (
            <article
              key={item.title}
              className="dashboard-link-card dashboard-link-card-button"
              onClick={() => setActiveSection(item.key)}
            >
              <div className={`dashboard-link-icon dashboard-link-icon-${item.accent}`}>
                <span />
              </div>
              <div>
                <h3>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </>
  );

  const renderSyllabus = () => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">SYLLABUS</p>
      <h1 className="dashboard-section-heading">Your syllabus</h1>
      <p className="dashboard-overview-text">
        Paste it once. We use it to plan, recommend, quiz and tutor.
      </p>

      <form className="dashboard-syllabus-card" onSubmit={generateLearningSystem}>
        <div className="dashboard-upload-row">
          <label className="dashboard-upload-btn">
            <input
              type="file"
              accept=".pdf,.txt,.md"
              onChange={handleFileUpload}
            />
            {isUploading ? "Uploading..." : "Upload syllabus"}
          </label>
          <span className="dashboard-upload-note">
            {selectedFileName || "PDF, TXT, and MD files supported"}
          </span>
        </div>

        <textarea
          className="dashboard-textarea"
          placeholder="Paste subjects, topics, and subtopics..."
          value={formData.syllabusText}
          onChange={(e) => updateField("syllabusText", e.target.value)}
        />

        <button type="button" className="dashboard-sample-link" onClick={loadSampleSyllabus}>
          Try a sample syllabus
        </button>

        <div className="dashboard-form-grid">
          <label className="dashboard-field">
            <span>Hours / Day</span>
            <input
              type="number"
              min="1"
              max="12"
              value={formData.hoursPerDay}
              onChange={(e) => updateField("hoursPerDay", e.target.value)}
            />
          </label>

          <label className="dashboard-field">
            <span>Days Available</span>
            <input
              type="number"
              min="1"
              max="120"
              value={formData.daysAvailable}
              onChange={(e) => updateField("daysAvailable", e.target.value)}
            />
          </label>

          <label className="dashboard-field">
            <span>Your Level</span>
            <select value={formData.level} onChange={(e) => updateField("level", e.target.value)}>
              <option>Beginner</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </label>

          <label className="dashboard-field">
            <span>Available Time</span>
            <select value={formData.preferredTime} onChange={(e) => updateField("preferredTime", e.target.value)}>
              <option value="morning">Morning</option>
              <option value="afternoon">Afternoon</option>
              <option value="evening">Evening</option>
              <option value="night">Night</option>
            </select>
          </label>
        </div>

        <button type="submit" className="dashboard-primary-btn dashboard-generate-btn">
          {isUploading ? "Preparing syllabus..." : isSubmitting ? "Generating..." : "Generate Learning System"}
        </button>
      </form>
    </section>
  );

  const renderStudyPlan = () => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">STUDY PLAN</p>
      <h1 className="dashboard-section-heading">Day-by-day plan</h1>
      <p className="dashboard-overview-text">
        Designed around your hours, days and level.
      </p>

      {!currentPlan ? (
        <div className="dashboard-info-card">
          Generate a learning system from the Syllabus tab first.
        </div>
      ) : (
        <div className="dashboard-study-plan-shell">
          <div className="dashboard-flow-rail">
            <span>Subjects Map</span>
            <span>Study Plan</span>
            <span>Weekly Milestones</span>
            <span>Revision Rhythm</span>
            <span>Study Suggestions</span>
          </div>

          <article className="dashboard-info-card dashboard-study-card dashboard-study-section-card">
            <div className="dashboard-study-card-head">
              <h3>Subjects Map</h3>
              <span className="dashboard-study-card-pill">Core Topics</span>
            </div>
            <div className="dashboard-horizontal-scroll dashboard-horizontal-scroll-subjects">
              {currentPlan.structure.map((subject) => (
                <div key={subject.name} className="dashboard-subject-block dashboard-subject-panel">
                  <h4>{subject.name}</h4>
                  {subject.topics.map((topic) => (
                    <div key={`${subject.name}-${topic.title}`} className="dashboard-topic-chip-row">
                      <span className="dashboard-topic-chip-title">{topic.title}</span>
                      <span className="dashboard-topic-chip-copy">
                        {topic.subtopics.length ? topic.subtopics.join(", ") : "Focus block"}
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-info-card dashboard-study-card dashboard-study-card-featured dashboard-study-section-card">
            <div className="dashboard-study-card-head">
              <h3>Daily Plan</h3>
              <span className="dashboard-study-card-pill">Actionable Flow</span>
            </div>
            <div className="dashboard-plan-meta-strip">
              <div className="dashboard-plan-meta-item">
                <span className="dashboard-plan-meta-label">Days</span>
                <strong>{currentPlan.daysAvailable}</strong>
              </div>
              <div className="dashboard-plan-meta-item">
                <span className="dashboard-plan-meta-label">Hours / Day</span>
                <strong>{currentPlan.hoursPerDay}</strong>
              </div>
              <div className="dashboard-plan-meta-item">
                <span className="dashboard-plan-meta-label">Level</span>
                <strong>{currentPlan.level}</strong>
              </div>
              <div className="dashboard-plan-meta-item">
                <span className="dashboard-plan-meta-label">Best Time</span>
                <strong>{currentPlan.preferredTime}</strong>
              </div>
            </div>
            <div className="dashboard-plan-graph-card">
              <div className="dashboard-plan-graph-head">
                <span className="dashboard-plan-graph-title">Plan Rhythm</span>
                <span className="dashboard-plan-graph-copy">Focus and revision checkpoints across the schedule</span>
              </div>
              <div className="dashboard-plan-graph-track">
                {currentPlan.dailyPlan.map((day, index) => (
                  <div key={`graph-${day.day}`} className="dashboard-plan-graph-step">
                    <div
                      className={`dashboard-plan-graph-node${
                        day.revision.toLowerCase().includes("revise") ? " dashboard-plan-graph-node-revision" : ""
                      }`}
                    >
                      <span className="dashboard-plan-graph-node-dot" />
                    </div>
                    {index < currentPlan.dailyPlan.length - 1 ? (
                      <span
                        className={`dashboard-plan-graph-line${
                          day.revision.toLowerCase().includes("revise") ? " dashboard-plan-graph-line-revision" : ""
                        }`}
                      />
                    ) : null}
                    <div className="dashboard-plan-graph-labels">
                      <span className="dashboard-plan-graph-day">D{String(day.day).padStart(2, "0")}</span>
                      <span className="dashboard-plan-graph-type">
                        {day.revision.toLowerCase().includes("revise") ? "Revision" : "Focus"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="dashboard-horizontal-scroll dashboard-horizontal-scroll-days">
              {currentPlan.dailyPlan.map((day) => (
                <div
                  key={day.day}
                  className={`dashboard-day-card${
                    day.revision.toLowerCase().includes("revise") ? " dashboard-day-card-revision" : ""
                  }`}
                >
                  <div className="dashboard-day-head">
                    <span className="dashboard-day-number">Day {String(day.day).padStart(2, "0")}</span>
                    <div className="dashboard-day-badges">
                      <span className="dashboard-day-hours">{day.durationHours}h session</span>
                      {day.revision.toLowerCase().includes("revise") ? (
                        <span className="dashboard-day-revision-tag">Revision</span>
                      ) : null}
                    </div>
                  </div>
                  <h4>{day.focus}</h4>
                  <div className="dashboard-day-task-list">
                    {day.tasks.map((task) => (
                      <div key={`${day.day}-${task}`} className="dashboard-day-task-item">
                        <span className="dashboard-day-task-bullet" />
                        <span>{task}</span>
                      </div>
                    ))}
                  </div>
                  <div className="dashboard-day-revision-box">
                    <span className="dashboard-day-revision-label">Revision Focus</span>
                    <p>{day.revision}</p>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-info-card dashboard-study-card dashboard-study-section-card">
            <div className="dashboard-study-card-head">
              <h3>Weekly Milestones</h3>
              <span className="dashboard-study-card-pill">Progress Goals</span>
            </div>
            <div className="dashboard-horizontal-scroll dashboard-horizontal-scroll-milestones">
              {currentPlan.weeklyMilestones.map((milestone) => (
                <div key={milestone.week} className="dashboard-milestone-card">
                  <div className="dashboard-milestone-week">Week {milestone.week}</div>
                  <h4>{milestone.title}</h4>
                  <ul>
                    {milestone.outcomes.map((outcome) => (
                      <li key={`${milestone.week}-${outcome}`}>{outcome}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-info-card dashboard-study-card dashboard-study-section-card">
            <div className="dashboard-study-card-head">
              <h3>Revision Rhythm</h3>
              <span className="dashboard-study-card-pill">Retention</span>
            </div>
            <div className="dashboard-horizontal-scroll dashboard-horizontal-scroll-revision">
              {currentPlan.revisionSlots.map((slot) => (
                <div key={slot} className="dashboard-revision-chip">
                  {slot}
                </div>
              ))}
            </div>
          </article>

          <article className="dashboard-info-card dashboard-study-card dashboard-study-section-card">
            <div className="dashboard-study-card-head">
              <h3>Study Suggestions</h3>
              <span className="dashboard-study-card-pill">Personalized</span>
            </div>
            <div className="dashboard-horizontal-scroll dashboard-horizontal-scroll-suggestions">
              {currentPlan.suggestions.map((suggestion) => (
                <div key={suggestion} className="dashboard-suggestion-card">
                  <span className="dashboard-suggestion-mark">*</span>
                  <p>{suggestion}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );

  const renderResources = () => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">RESOURCES</p>
      <h1 className="dashboard-section-heading">Recommended resources</h1>
      <p className="dashboard-overview-text">
        Click through beautifully organized picks for YouTube, Google, article reading, and practice.
      </p>

      {!currentPlan ? (
        <div className="dashboard-info-card">
          Generate a plan first to unlock topic-aligned resources.
        </div>
      ) : (
        <div className="dashboard-resources-shell">
          <div className="dashboard-resource-summary-row">
            <div className="dashboard-resource-summary-card">
              <span className="dashboard-resource-summary-label">Total Picks</span>
              <strong>{currentPlan.resources.length}</strong>
              <p>Generated from your syllabus topics and study level</p>
            </div>
            <div className="dashboard-resource-summary-card">
              <span className="dashboard-resource-summary-label">Resource Mix</span>
              <strong>Video + Search + Reading</strong>
              <p>Balanced for explanation, research, and active learning</p>
            </div>
            <div className="dashboard-resource-summary-card">
              <span className="dashboard-resource-summary-label">Best Use</span>
              <strong>{currentPlan.preferredTime}</strong>
              <p>Use these links alongside your daily study blocks</p>
            </div>
          </div>

          {currentPlan.resources.map((rawResource) => {
            const resource = normalizeResource(rawResource, currentPlan.level);

            return (
            <article
              key={`${resource.type}-${resource.title}`}
              className={`dashboard-resource-card dashboard-resource-card-${resource.type.toLowerCase()}`}
            >
              <div className="dashboard-resource-card-top">
                <span className="dashboard-resource-platform">{resource.platform || resource.type}</span>
                <span className="dashboard-resource-type-badge">{resource.type}</span>
              </div>
              <h3>{resource.title}</h3>
              <p className="dashboard-resource-description">
                {resource.description || resource.reason}
              </p>
              <p className="dashboard-resource-reason">{resource.reason}</p>
              <a
                className="dashboard-resource-link"
                href={resource.url || "#"}
                target="_blank"
                rel="noreferrer"
              >
                {resource.cta || "Open Resource"}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </article>
            );
          })}
        </div>
      )}
    </section>
  );

  const renderQuiz = () => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">QUIZ</p>
      <h1 className="dashboard-section-heading">Knowledge check</h1>
      <p className="dashboard-overview-text">
        Answer the quiz generated from the uploaded syllabus and measure topic mastery.
      </p>

      {!currentPlan ? (
        <div className="dashboard-info-card">
          Generate a plan first to unlock the quiz.
        </div>
      ) : isQuizLoading ? (
        <div className="dashboard-info-card dashboard-quiz-empty-state">
          <h3>Preparing your quiz</h3>
          <p>We are creating topic-based questions from the syllabus and your study plan right now.</p>
        </div>
      ) : !quizData ? (
        <div className="dashboard-info-card dashboard-quiz-empty-state">
          <h3>Start your quiz</h3>
          <p>Your learning system is ready. Load the knowledge check generated from this syllabus.</p>
          <button
            type="button"
            className="dashboard-primary-btn"
            onClick={async () => {
              setErrorMessage("");
              setStatusMessage("");
              const quizReady = await fetchQuizAndReport();

              if (!quizReady) {
                setErrorMessage("Unable to prepare the quiz right now. Please try again.");
              }
            }}
          >
            Start Quiz
            <span aria-hidden="true">-&gt;</span>
          </button>
        </div>
      ) : (
        <div className="dashboard-quiz-shell">
          <div className="dashboard-quiz-summary">
            <div className="dashboard-quiz-summary-card">
              <span className="dashboard-quiz-summary-label">Questions</span>
              <strong>{quizData.questions.length}</strong>
            </div>
            <div className="dashboard-quiz-summary-card">
              <span className="dashboard-quiz-summary-label">Latest Score</span>
              <strong>{quizResult ? `${quizResult.percentage}%` : "Not taken"}</strong>
            </div>
            <div className="dashboard-quiz-summary-card">
              <span className="dashboard-quiz-summary-label">Focus</span>
              <strong>{currentPlan?.level || "Adaptive"}</strong>
            </div>
          </div>

          <div className="dashboard-quiz-grid">
            {quizData.questions.map((question, index) => (
              <article key={question.id} className="dashboard-quiz-card">
                <div className="dashboard-quiz-card-head">
                  <span className="dashboard-quiz-number">Q{String(index + 1).padStart(2, "0")}</span>
                  <span className="dashboard-quiz-topic">{question.subject}</span>
                </div>
                <h3>{question.prompt}</h3>
                <p className="dashboard-quiz-subtopic">{question.topic}</p>

                <div className="dashboard-quiz-options">
                  {question.options.map((option, optionIndex) => (
                    <button
                      key={`${question.id}-${option}`}
                      type="button"
                      className={`dashboard-quiz-option${
                        quizAnswers[question.id] === optionIndex ? " is-selected" : ""
                      }`}
                      onClick={() => updateQuizAnswer(question.id, optionIndex)}
                    >
                      <span className="dashboard-quiz-option-index">
                        {String.fromCharCode(65 + optionIndex)}
                      </span>
                      <span>{option}</span>
                    </button>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <div className="dashboard-quiz-submit-row">
            <button type="button" className="dashboard-primary-btn" onClick={submitQuiz}>
              {isQuizSubmitting ? "Submitting..." : "Submit Quiz"}
            </button>
          </div>
        </div>
      )}
    </section>
  );

  const renderReportCard = () => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">REPORT CARD</p>
      <h1 className="dashboard-section-heading">Performance insights</h1>
      <p className="dashboard-overview-text">
        Review score trends, strong areas, weak areas, and where to improve next.
      </p>

      {!reportCard ? (
        <div className="dashboard-info-card">
          Take at least one quiz attempt to unlock your report card.
        </div>
      ) : (
        <div className="dashboard-report-shell">
          <div className="dashboard-report-top dashboard-report-top-spaced">
            <div className="dashboard-report-stat-card dashboard-report-stat-card-primary">
              <span className="dashboard-report-stat-label">Latest Score</span>
              <strong>{reportCard.latestAttempt.percentage}%</strong>
              <p>
                {reportCard.latestAttempt.score}/{reportCard.latestAttempt.totalQuestions} correct
              </p>
            </div>
            <div className="dashboard-report-stat-card">
              <span className="dashboard-report-stat-label">Average Score</span>
              <strong>{reportCard.averageScore}%</strong>
              <p>{reportCard.totalAttempts} total attempt(s)</p>
            </div>
            <div className="dashboard-report-stat-card">
              <span className="dashboard-report-stat-label">Progress Score</span>
              <strong>{reportCard.progressTrend[reportCard.progressTrend.length - 1]?.percentage || 0}%</strong>
              <p>Visualized across attempts below</p>
            </div>
          </div>

          <div className="dashboard-report-grid dashboard-report-grid-spaced dashboard-report-grid-hero">
            <article className="dashboard-report-card dashboard-report-card-graph">
              <div className="dashboard-study-card-head">
                <h3>Progress Graph</h3>
                <span className="dashboard-study-card-pill">Attempts</span>
              </div>
              <div className="dashboard-report-graph-caption">
                <p>Track how your performance grows across every quiz attempt.</p>
              </div>
              <div className="dashboard-report-bars">
                {reportCard.progressTrend.map((point) => (
                  <div key={point.label} className="dashboard-report-bar-item">
                    <div className="dashboard-report-bar-track">
                      <div
                        className="dashboard-report-bar-fill"
                        style={{ height: `${Math.max(point.percentage, 8)}%` }}
                      />
                    </div>
                    <span className="dashboard-report-bar-label">{point.label}</span>
                    <span className="dashboard-report-bar-value">{point.percentage}%</span>
                  </div>
                ))}
              </div>
            </article>

            <article className="dashboard-report-card dashboard-report-card-mastery">
              <div className="dashboard-study-card-head">
                <h3>Subject Accuracy</h3>
                <span className="dashboard-study-card-pill">Mastery</span>
              </div>
              <div className="dashboard-report-subject-list">
                {reportCard.subjectPerformance.map((subject) => (
                  <div key={subject.subject} className="dashboard-report-subject-row">
                    <div className="dashboard-report-subject-copy">
                      <strong>{subject.subject}</strong>
                      <span>{subject.accuracy}% mastery</span>
                    </div>
                    <div className="dashboard-report-subject-visual">
                      <span className="dashboard-report-subject-score">{subject.accuracy}%</span>
                      <div className="dashboard-report-progress-line">
                        <div
                          className="dashboard-report-progress-fill"
                          style={{ width: `${subject.accuracy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </article>
          </div>

          <div className="dashboard-report-grid dashboard-report-grid-spaced dashboard-report-grid-secondary">
            <article className="dashboard-report-card dashboard-report-card-strength">
              <div className="dashboard-study-card-head">
                <h3>Strong Areas</h3>
                <span className="dashboard-study-card-pill">Strengths</span>
              </div>
              <div className="dashboard-report-tag-list">
                {reportCard.feedback.strongAreas.length ? (
                  reportCard.feedback.strongAreas.map((item) => (
                    <span key={item} className="dashboard-report-tag dashboard-report-tag-good">{item}</span>
                  ))
                ) : (
                  <p className="dashboard-report-empty">No clear strong area yet. Keep practicing.</p>
                )}
              </div>
            </article>

            <article className="dashboard-report-card dashboard-report-card-focus">
              <div className="dashboard-study-card-head">
                <h3>Areas To Improve</h3>
                <span className="dashboard-study-card-pill">Focus</span>
              </div>
              <div className="dashboard-report-tag-list">
                {reportCard.feedback.weakAreas.length ? (
                  reportCard.feedback.weakAreas.map((item) => (
                    <span key={item} className="dashboard-report-tag dashboard-report-tag-warn">{item}</span>
                  ))
                ) : (
                  <p className="dashboard-report-empty">No major weak area right now. Great job.</p>
                )}
              </div>
            </article>
          </div>

          <article className="dashboard-report-card dashboard-report-card-line dashboard-report-card-line-wide">
            <div className="dashboard-study-card-head">
              <h3>Score Improvement</h3>
              <span className="dashboard-study-card-pill">Trend</span>
            </div>
            <div className="dashboard-report-line-intro">
              <p>See how your quiz scores change from one attempt to the next.</p>
            </div>
            <div className="dashboard-report-line-chart">
              <div className="dashboard-report-line-y-axis">
                <span>100%</span>
                <span>75%</span>
                <span>50%</span>
                <span>25%</span>
                <span>0%</span>
              </div>
              <div className="dashboard-report-line-grid" />
              <svg
                className="dashboard-report-line-svg"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                aria-label="Score improvement line chart"
              >
                <polygon
                  className="dashboard-report-line-area"
                  points={`0,100 ${reportCard.progressTrend
                    .map((point, index, array) => {
                      const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
                      const y = 100 - point.percentage;
                      return `${x},${Math.min(96, Math.max(4, y))}`;
                    })
                    .join(" ")} 100,100`}
                />
                <polyline
                  className="dashboard-report-line-path"
                  fill="none"
                  points={reportCard.progressTrend
                    .map((point, index, array) => {
                      const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
                      const y = 100 - point.percentage;
                      return `${x},${Math.min(96, Math.max(4, y))}`;
                    })
                    .join(" ")}
                />
                {reportCard.progressTrend.map((point, index, array) => {
                  const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
                  const y = Math.min(96, Math.max(4, 100 - point.percentage));

                  return (
                    <g key={point.label} className="dashboard-report-line-point-group">
                      <title>{`${point.label}: ${point.percentage}%`}</title>
                      <circle
                        className="dashboard-report-line-dot"
                        cx={x}
                        cy={y}
                        r="3.1"
                      />
                    </g>
                  );
                })}
              </svg>
              <div className="dashboard-report-line-markers">
                {reportCard.progressTrend.map((point, index, array) => {
                  const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
                  const y = Math.min(96, Math.max(4, 100 - point.percentage));

                  return (
                    <div
                      key={`${point.label}-marker`}
                      className="dashboard-report-line-marker"
                      style={{
                        left: `${x}%`,
                        top: `${y}%`
                      }}
                    >
                      <span className="dashboard-report-line-marker-value">{`${point.percentage}%`}</span>
                      <span className="dashboard-report-line-marker-tooltip">{`${point.label}: ${point.percentage}%`}</span>
                    </div>
                  );
                })}
              </div>
              <div className="dashboard-report-line-labels">
                {reportCard.progressTrend.map((point) => (
                  <div key={point.label} className="dashboard-report-line-label-item">
                    <span className="dashboard-report-line-label">{point.label}</span>
                    <strong className="dashboard-report-line-value">{point.percentage}%</strong>
                  </div>
                ))}
              </div>
            </div>
          </article>

          <article className="dashboard-report-card dashboard-report-card-feedback">
            <div className="dashboard-study-card-head">
              <h3>Personalized Feedback</h3>
              <span className="dashboard-study-card-pill">Suggestions</span>
            </div>
            <div className="dashboard-report-feedback-list">
              {reportCard.feedback.suggestions.map((item) => (
                <div key={item} className="dashboard-report-feedback-item">
                  <span className="dashboard-report-feedback-dot" />
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </article>
        </div>
      )}
    </section>
  );

  const renderPlaceholder = (title, text) => (
    <section className="dashboard-content-panel">
      <p className="dashboard-eyebrow">{title.toUpperCase()}</p>
      <h1 className="dashboard-section-heading">{title}</h1>
      <div className="dashboard-info-card">{text}</div>
    </section>
  );

  const sectionContent = {
    overview: renderOverview(),
    syllabus: renderSyllabus(),
    studyPlan: renderStudyPlan(),
    resources: renderResources(),
    quiz: renderQuiz(),
    reportCard: renderReportCard(),
    doubtChat: <DoubtChat token={token} />
  };

  return (
    <div className="dashboard-page">
      <aside className="dashboard-sidebar">
        <div className="dashboard-sidebar-brand">
          <div className="dashboard-logo-box">
            <span className="dashboard-logo-book" />
          </div>
          <div>
            <div className="dashboard-brand-name">Co-Pilot</div>
            <div className="dashboard-brand-subtitle">ACADEMIC</div>
          </div>
        </div>

        <div className="dashboard-sidebar-section">
          <div className="dashboard-sidebar-title">Workspace</div>
          <nav className="dashboard-nav">
            {workspaceItems.map((item) => (
              <button
                key={item.key}
                type="button"
                className={`dashboard-nav-item${activeSection === item.key ? " is-active" : ""}`}
                onClick={() => setActiveSection(item.key)}
              >
                <span className={`dashboard-nav-icon dashboard-nav-icon-${item.key}`} />
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="dashboard-sidebar-section dashboard-sidebar-status">
          <div className="dashboard-sidebar-title">Status</div>
          <div className="dashboard-status-row">
            <span className="dashboard-status-dot" />
            <span>{statusText}</span>
          </div>
        </div>

        <div className="dashboard-sidebar-section dashboard-sidebar-footer">
          <button
            type="button"
            className="dashboard-reset-btn"
            onClick={() => {
              setCurrentPlan(null);
              setStatusMessage("");
              setErrorMessage("");
              setSelectedFileName("");
              setSelectedFile(null);
              setFormData((prev) => ({ ...prev, syllabusText: "" }));
              setActiveSection("syllabus");
            }}
          >
            Reset
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button type="button" className="dashboard-menu-button" aria-label="Open dashboard menu">
              <span />
              <span />
            </button>
            <div className="dashboard-topbar-brand">
              <span className="dashboard-topbar-star">*</span>
              <span>Academic Co-Pilot</span>
            </div>
          </div>

          <Link to="/" className="dashboard-landing-link">
            {"<- Landing"}
          </Link>
        </header>

        {statusMessage ? <p className="dashboard-success-banner">{statusMessage}</p> : null}
        {errorMessage ? <p className="dashboard-error-banner">{errorMessage}</p> : null}

        {sectionContent[activeSection]}
      </main>
    </div>
  );
}

export default Dashboard;
