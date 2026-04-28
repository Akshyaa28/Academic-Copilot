const mongoose = require("mongoose");

const TopicSchema = new mongoose.Schema(
  {
    title: String,
    subtopics: [String]
  },
  { _id: false }
);

const SubjectSchema = new mongoose.Schema(
  {
    name: String,
    topics: [TopicSchema]
  },
  { _id: false }
);

const StudyDaySchema = new mongoose.Schema(
  {
    day: Number,
    focus: String,
    durationHours: Number,
    tasks: [String],
    revision: String
  },
  { _id: false }
);

const WeeklyMilestoneSchema = new mongoose.Schema(
  {
    week: Number,
    title: String,
    outcomes: [String]
  },
  { _id: false }
);

const ResourceSchema = new mongoose.Schema(
  {
    title: String,
    type: String,
    reason: String,
    url: String,
    platform: String,
    description: String,
    cta: String
  },
  { _id: false }
);

const SyllabusPlanSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    syllabusText: {
      type: String,
      required: true
    },
    hoursPerDay: {
      type: Number,
      required: true
    },
    daysAvailable: {
      type: Number,
      required: true
    },
    preferredTime: {
      type: String,
      required: true
    },
    level: {
      type: String,
      required: true
    },
    structure: [SubjectSchema],
    dailyPlan: [StudyDaySchema],
    weeklyMilestones: [WeeklyMilestoneSchema],
    revisionSlots: [String],
    resources: [ResourceSchema],
    suggestions: [String],
    ragChunkCount: {
      type: Number,
      default: 0
    },
    ragIndexedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("SyllabusPlan", SyllabusPlanSchema);
