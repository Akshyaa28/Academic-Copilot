const express = require("express");
const multer = require("multer");
const authMiddleware = require("../middleware/auth");
const User = require("../models/User");
const SyllabusPlan = require("../models/SyllabusPlan");
const QuizAttempt = require("../models/QuizAttempt");
const parseSyllabus = require("../services/syllabusParser");
const generateStudyPlan = require("../services/studyPlanGenerator");
const { buildResourceRecommendations } = require("../services/ragPipeline");
const extractTextFromFile = require("../services/fileTextExtractor");
const { buildQuizQuestions, sanitizeQuestionsForClient } = require("../services/quizGenerator");
const { analyzeQuizSubmission } = require("../services/performanceAnalyzer");
const { generateTutorResponse } = require("../services/doubtChat");
const { indexPlanKnowledge } = require("../services/rag/indexSyllabus");
const {
  AGENTIC_MODE_ENABLED,
  runAgenticDoubtChat,
  getAgenticQuizQuestions,
  buildAgenticReport
} = require("../services/agents");

const router = express.Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

router.get("/overview", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const latestPlan = await SyllabusPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    return res.json({
      welcomeTitle: "Welcome back",
      welcomeSubtitle: "Your learning system at a glance.",
      heroTitle: latestPlan ? "Learning system ready" : "No syllabus yet",
      heroDescription: latestPlan
        ? `Your latest plan covers ${latestPlan.dailyPlan.length} study days with ${latestPlan.resources.length} starter resources.`
        : "Add your syllabus to generate your personalised plan, resources, quizzes and more.",
      hasSyllabus: Boolean(latestPlan),
      email: user?.email || "",
      latestPlan: latestPlan
        ? {
            level: latestPlan.level,
            daysAvailable: latestPlan.daysAvailable,
            hoursPerDay: latestPlan.hoursPerDay
          }
        : null
    });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load dashboard" });
  }
});

router.get("/plan", authMiddleware, async (req, res) => {
  try {
    const latestPlan = await SyllabusPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(404).json({ msg: "No syllabus plan found yet" });
    }

    return res.json(latestPlan);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load study plan" });
  }
});

router.get("/quiz", authMiddleware, async (req, res) => {
  try {
    const latestPlan = await SyllabusPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(404).json({ msg: "No syllabus plan found yet" });
    }

    let questions = buildQuizQuestions(latestPlan);

    if (AGENTIC_MODE_ENABLED) {
      try {
        const agentResult = await getAgenticQuizQuestions({
          userId: req.user.id,
          plan: latestPlan
        });

        if (agentResult?.success && Array.isArray(agentResult.questions) && agentResult.questions.length) {
          questions = agentResult.questions;
        }
      } catch (error) {
        console.error("[Agents] Quiz fallback:", error.message);
      }
    }

    return res.json({
      title: "Topic mastery quiz",
      description: "Test your understanding of the generated learning system.",
      questions: sanitizeQuestionsForClient(questions)
    });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load quiz" });
  }
});

router.post("/quiz/submit", authMiddleware, async (req, res) => {
  try {
    const latestPlan = await SyllabusPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });

    if (!latestPlan) {
      return res.status(404).json({ msg: "No syllabus plan found yet" });
    }

    const submittedAnswers = req.body.answers || {};
    const questions = buildQuizQuestions(latestPlan);
    const analysis = analyzeQuizSubmission(questions, submittedAnswers);

    const attempt = await QuizAttempt.create({
      userId: req.user.id,
      planId: latestPlan._id,
      answers: analysis.evaluatedAnswers,
      score: analysis.score,
      totalQuestions: analysis.totalQuestions,
      percentage: analysis.percentage,
      weakAreas: analysis.weakAreas,
      strongAreas: analysis.strongAreas,
      subjectAccuracy: analysis.subjectAccuracy
    });

    return res.status(201).json({
      msg: "Quiz submitted successfully",
      result: {
        id: attempt._id,
        score: analysis.score,
        totalQuestions: analysis.totalQuestions,
        percentage: analysis.percentage,
        weakAreas: analysis.weakAreas,
        strongAreas: analysis.strongAreas,
        subjectAccuracy: analysis.subjectAccuracy
      }
    });
  } catch (error) {
    return res.status(500).json({ msg: "Failed to submit quiz" });
  }
});

router.get("/report", authMiddleware, async (req, res) => {
  try {
    const attempts = await QuizAttempt.find({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    const report = await buildAgenticReport({
      userId: req.user.id,
      attempts
    });

    if (!report) {
      return res.status(404).json({ msg: "No quiz attempts found yet" });
    }

    return res.json(report);
  } catch (error) {
    return res.status(500).json({ msg: "Failed to load report card" });
  }
});

router.post("/syllabus", authMiddleware, async (req, res) => {
  try {
    const { syllabusText, hoursPerDay, daysAvailable, preferredTime, level } = req.body;

    if (!syllabusText || !syllabusText.trim()) {
      return res.status(400).json({ msg: "Syllabus content is required" });
    }

    if (!hoursPerDay || !daysAvailable || !preferredTime || !level) {
      return res.status(400).json({ msg: "Please fill all planning inputs" });
    }

    const parsedStructure = parseSyllabus(syllabusText);

    if (!parsedStructure.length) {
      return res.status(400).json({ msg: "Unable to understand the syllabus content" });
    }

    const plan = generateStudyPlan({
      structure: parsedStructure,
      hoursPerDay: Number(hoursPerDay),
      daysAvailable: Number(daysAvailable),
      preferredTime,
      level
    });

    const resources = buildResourceRecommendations({
      structure: parsedStructure,
      level
    });

    const savedPlan = await SyllabusPlan.create({
      userId: req.user.id,
      syllabusText: syllabusText.trim(),
      hoursPerDay: Number(hoursPerDay),
      daysAvailable: Number(daysAvailable),
      preferredTime,
      level,
      structure: parsedStructure,
      dailyPlan: plan.dailyPlan,
      weeklyMilestones: plan.weeklyMilestones,
      revisionSlots: plan.revisionSlots,
      resources,
      suggestions: plan.suggestions
    });

    void indexPlanKnowledge({ plan: savedPlan }).catch((error) => {
      console.error(`[RAG] Failed to index syllabus plan ${savedPlan._id}:`, error.message);
    });

    return res.status(201).json({
      msg: "Learning system generated successfully",
      plan: savedPlan
    });
  } catch (error) {
    console.error("syllabus generation failed:", error);
    return res.status(500).json({ msg: "Failed to generate learning system" });
  }
});

router.post("/syllabus/upload", authMiddleware, upload.single("syllabusFile"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ msg: "Please upload a syllabus file" });
    }

    const extractedText = (await extractTextFromFile(req.file)).trim();

    if (!extractedText) {
      return res.status(400).json({ msg: "Could not extract readable text from the uploaded file" });
    }

    return res.json({
      msg: "Syllabus extracted successfully",
      syllabusText: extractedText
    });
  } catch (error) {
    console.error("syllabus upload failed:", error);
    return res.status(500).json({ msg: "Failed to read uploaded syllabus" });
  }
});

router.post("/doubt-chat", authMiddleware, async (req, res) => {
  try {
    const { question } = req.body;

    if (!question || !question.trim()) {
      return res.status(400).json({ msg: "Please ask a question" });
    }

    console.log(`[Doubt Chat] User: ${req.user.id}, Question: ${question.substring(0, 50)}...`);

    let response = null;

    if (AGENTIC_MODE_ENABLED) {
      try {
        response = await runAgenticDoubtChat({
          userId: req.user.id,
          question: question.trim()
        });
      } catch (error) {
        console.error("[Agents] Doubt chat fallback:", error.message);
      }
    }

    if (!response?.success) {
      const latestPlan = await SyllabusPlan.findOne({ userId: req.user.id }).sort({ createdAt: -1 });
      response = await generateTutorResponse(question, latestPlan);
    }

    if (!response.success) {
      console.error(`[Doubt Chat] Error: ${response.error}`);
      return res.status(500).json({ msg: response.error || "Failed to get tutor response" });
    }

    console.log(`[Doubt Chat] Success - Response length: ${response.answer.length}`);

    return res.json({
      msg: "Response generated successfully",
      answer: response.answer,
      question: question.trim(),
      agent: response.agent || null,
      coordinator: response.coordinator || null
    });
  } catch (error) {
    console.error("doubt chat failed:", error);
    return res.status(500).json({ 
      msg: error.message || "Failed to process your question. Please check backend logs."
    });
  }
});

module.exports = router;
