const difficultyWeight = {
  beginner: 1.25,
  intermediate: 1,
  advanced: 0.85
};

const capitalize = (value) => value.charAt(0).toUpperCase() + value.slice(1);

const flattenTopics = (structure) =>
  structure.flatMap((subject) =>
    subject.topics.flatMap((topic) => {
      const items = topic.subtopics.length ? topic.subtopics : [topic.title];

      return items.map((item) => ({
        subject: subject.name,
        topic: topic.title,
        subtopic: item
      }));
    })
  );

const buildDailyPlan = ({ topicPool, hoursPerDay, daysAvailable, preferredTime, level }) => {
  const adjustedHours = Number((hoursPerDay * (difficultyWeight[level] || 1)).toFixed(1));

  return Array.from({ length: daysAvailable }, (_, index) => {
    const item = topicPool[index % topicPool.length];
    const revisionNeeded = (index + 1) % 4 === 0;

    return {
      day: index + 1,
      focus: `${item.subject} - ${item.topic}`,
      durationHours: adjustedHours,
      tasks: [
        `Learn ${item.subtopic} during your ${preferredTime} study block`,
        `Create concise notes for ${item.topic}`,
        `Solve 3-5 practice questions before closing the session`
      ],
      revision: revisionNeeded
        ? `Revise Day ${Math.max(1, index - 2)} to Day ${index} concepts for 30 minutes`
        : `Quick recap of today's session for 15 minutes`
    };
  });
};

const buildMilestones = ({ topicPool, daysAvailable }) => {
  const weekCount = Math.max(1, Math.ceil(daysAvailable / 7));
  const topicsPerWeek = Math.max(1, Math.ceil(topicPool.length / weekCount));

  return Array.from({ length: weekCount }, (_, index) => {
    const batch = topicPool.slice(index * topicsPerWeek, (index + 1) * topicsPerWeek);

    return {
      week: index + 1,
      title: `Week ${index + 1} mastery target`,
      outcomes: batch.slice(0, 3).map((item) => `Understand ${item.subject}: ${item.subtopic}`)
    };
  });
};

const buildRevisionSlots = ({ daysAvailable, preferredTime }) => {
  const slots = [];

  for (let day = 3; day <= daysAvailable; day += 3) {
    slots.push(`Day ${day}: 30-minute ${preferredTime} revision sprint`);
  }

  if (daysAvailable >= 7) {
    slots.push(`Final day: 60-minute ${preferredTime} cumulative revision`);
  }

  return slots;
};

const buildSuggestions = ({ level, hoursPerDay, preferredTime }) => [
  `${capitalize(level)} learner mode: keep each ${hoursPerDay}-hour session focused on one major concept block.`,
  `Use your ${preferredTime} slot for the hardest concept of the day.`,
  "End every session with retrieval practice instead of only re-reading notes.",
  "Flag weak topics early so later quizzes and reports can adapt around them."
];

const generateStudyPlan = ({ structure, hoursPerDay, daysAvailable, preferredTime, level }) => {
  const topicPool = flattenTopics(structure);
  const normalizedLevel = String(level || "intermediate").toLowerCase();
  const safeHoursPerDay = Math.max(1, Number(hoursPerDay) || 1);
  const safeDaysAvailable = Math.max(1, Number(daysAvailable) || 1);

  if (!topicPool.length) {
    throw new Error("No topics available to build a study plan");
  }

  return {
    dailyPlan: buildDailyPlan({
      topicPool,
      hoursPerDay: safeHoursPerDay,
      daysAvailable: safeDaysAvailable,
      preferredTime,
      level: normalizedLevel
    }),
    weeklyMilestones: buildMilestones({
      topicPool,
      daysAvailable: safeDaysAvailable
    }),
    revisionSlots: buildRevisionSlots({
      daysAvailable: safeDaysAvailable,
      preferredTime
    }),
    suggestions: buildSuggestions({
      level: normalizedLevel,
      hoursPerDay: safeHoursPerDay,
      preferredTime
    })
  };
};

module.exports = generateStudyPlan;
