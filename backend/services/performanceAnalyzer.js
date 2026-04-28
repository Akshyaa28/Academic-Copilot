const summarizeSubjectAccuracy = (evaluatedAnswers) => {
  const subjectMap = new Map();

  evaluatedAnswers.forEach((answer) => {
    const current = subjectMap.get(answer.subject) || {
      subject: answer.subject,
      correct: 0,
      total: 0
    };

    current.total += 1;
    if (answer.isCorrect) {
      current.correct += 1;
    }

    subjectMap.set(answer.subject, current);
  });

  return Array.from(subjectMap.values()).map((item) => ({
    ...item,
    accuracy: Number(((item.correct / item.total) * 100).toFixed(1))
  }));
};

const analyzeQuizSubmission = (questions, submittedAnswers) => {
  const evaluatedAnswers = questions.map((question) => {
    const selectedIndex = submittedAnswers[question.id];
    const isCorrect = Number(selectedIndex) === question.correctIndex;

    return {
      questionId: question.id,
      selectedIndex: selectedIndex ?? -1,
      correctIndex: question.correctIndex,
      isCorrect,
      subject: question.subject,
      topic: question.topic
    };
  });

  const score = evaluatedAnswers.filter((answer) => answer.isCorrect).length;
  const totalQuestions = questions.length;
  const percentage = Number(((score / totalQuestions) * 100).toFixed(1));
  const subjectAccuracy = summarizeSubjectAccuracy(evaluatedAnswers);

  const weakAreas = subjectAccuracy
    .filter((item) => item.accuracy < 60)
    .map((item) => item.subject);

  const strongAreas = subjectAccuracy
    .filter((item) => item.accuracy >= 80)
    .map((item) => item.subject);

  return {
    evaluatedAnswers,
    score,
    totalQuestions,
    percentage,
    weakAreas,
    strongAreas,
    subjectAccuracy
  };
};

const buildReportCard = (attempts) => {
  if (!attempts.length) {
    return null;
  }

  const latestAttempt = attempts[0];
  const chronological = [...attempts].reverse();
  const averageScore = Number(
    (attempts.reduce((sum, attempt) => sum + attempt.percentage, 0) / attempts.length).toFixed(1)
  );
  const progressTrend = chronological.map((attempt, index) => ({
    label: `Attempt ${index + 1}`,
    percentage: attempt.percentage
  }));

  const subjectTotals = new Map();
  attempts.forEach((attempt) => {
    attempt.subjectAccuracy.forEach((subject) => {
      const current = subjectTotals.get(subject.subject) || {
        subject: subject.subject,
        accuracySum: 0,
        count: 0
      };

      current.accuracySum += subject.accuracy;
      current.count += 1;
      subjectTotals.set(subject.subject, current);
    });
  });

  const subjectPerformance = Array.from(subjectTotals.values()).map((item) => ({
    subject: item.subject,
    accuracy: Number((item.accuracySum / item.count).toFixed(1))
  }));

  const weakAreas = subjectPerformance.filter((item) => item.accuracy < 60).map((item) => item.subject);
  const strongAreas = subjectPerformance.filter((item) => item.accuracy >= 80).map((item) => item.subject);

  const feedback = {
    strongAreas,
    weakAreas,
    suggestions: [
      strongAreas.length
        ? `Keep momentum in ${strongAreas.join(", ")} with short challenge quizzes.`
        : "You are still building consistency. Focus on one strong subject first.",
      weakAreas.length
        ? `Spend extra revision time on ${weakAreas.join(", ")} and revisit the linked resources.`
        : "No major weak areas right now. Increase difficulty gradually.",
      "Use quiz feedback after each attempt to adjust your next revision block."
    ]
  };

  return {
    latestAttempt: {
      percentage: latestAttempt.percentage,
      score: latestAttempt.score,
      totalQuestions: latestAttempt.totalQuestions
    },
    averageScore,
    totalAttempts: attempts.length,
    progressTrend,
    subjectPerformance,
    feedback
  };
};

module.exports = {
  analyzeQuizSubmission,
  buildReportCard
};
