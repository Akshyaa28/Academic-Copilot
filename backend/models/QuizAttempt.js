const mongoose = require("mongoose");

const SubjectAccuracySchema = new mongoose.Schema(
  {
    subject: String,
    correct: Number,
    total: Number,
    accuracy: Number
  },
  { _id: false }
);

const QuizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SyllabusPlan",
      required: true
    },
    answers: [
      {
        questionId: String,
        selectedIndex: Number,
        correctIndex: Number,
        isCorrect: Boolean,
        subject: String,
        topic: String
      }
    ],
    score: Number,
    totalQuestions: Number,
    percentage: Number,
    weakAreas: [String],
    strongAreas: [String],
    subjectAccuracy: [SubjectAccuracySchema]
  },
  { timestamps: true }
);

module.exports = mongoose.model("QuizAttempt", QuizAttemptSchema);
