const buildDistractors = (correctText, fallbackPool = []) => {
  const cleanPool = fallbackPool.filter((item) => item && item !== correctText);
  const defaults = [
    `${correctText} processes`,
    `${correctText} patterns`,
    `${correctText} systems`
  ];

  const distractors = [...cleanPool, ...defaults].filter((item, index, array) => array.indexOf(item) === index);

  return distractors.slice(0, 3);
};

const createQuestionId = (index) => `q-${index + 1}`;

const generateExamQuestion = (subject, topic, subtopic, qIndex, questionType) => {
  const id = createQuestionId(qIndex);
  const questionTypes = {
    definition: {
      prompt: `What is ${subtopic}?`,
      explanation: `${subtopic} is an important concept covered under ${topic} in ${subject}.`
    },
    explain: {
      prompt: `Explain the role and importance of ${subtopic} in ${topic}.`,
      explanation: `${subtopic} plays a crucial role in understanding ${topic}. It helps students comprehend the key principles of ${subject}.`
    },
    identify: {
      prompt: `Which of the following best describes ${subtopic}?`,
      explanation: `${subtopic} is characterized by the option that best describes its nature and function within ${topic}.`
    },
    application: {
      prompt: `How is ${subtopic} applied in practical scenarios within ${topic}?`,
      explanation: `${subtopic} is applied to solve real-world problems and understand practical applications in ${topic}.`
    },
    compare: {
      prompt: `What is the relationship between ${subtopic} and ${topic}?`,
      explanation: `${subtopic} is a key component of ${topic} and is essential for mastering this subject area.`
    }
  };

  const type = questionTypes[questionType] || questionTypes.definition;
  return { id, subject, topic, prompt: type.prompt, explanation: type.explanation };
};

const buildQuizQuestions = (plan) => {
  const questions = [];
  const questionTypes = ['definition', 'explain', 'identify', 'application', 'compare'];
  
  let questionIndex = 0;
  const targetQuestions = 10;

  plan.structure.forEach((subject, subjectIndex) => {
    if (questionIndex >= targetQuestions) return;
    
    subject.topics.forEach((topic, topicIndex) => {
      if (questionIndex >= targetQuestions) return;
      
      const subtopics = topic.subtopics.length ? topic.subtopics : [topic.title];
      const pool = subtopics.concat(
        subject.topics
          .flatMap((entry) => entry.subtopics.length ? entry.subtopics : [entry.title])
          .filter(Boolean)
      );

      subtopics.forEach((subtopic, subtopicIndex) => {
        if (questionIndex >= targetQuestions) return;

        const correctIndex = (subjectIndex + topicIndex + subtopicIndex) % 4;
        const distractors = buildDistractors(subtopic, pool);
        const options = [];

        for (let index = 0; index < 4; index += 1) {
          if (index === correctIndex) {
            options.push(subtopic);
          } else {
            options.push(distractors[options.length] || `Related to ${topic.title}`);
          }
        }

        const questionType = questionTypes[questionIndex % questionTypes.length];
        const baseQuestion = generateExamQuestion(subject.name, topic.title, subtopic, questionIndex, questionType);

        questions.push({
          ...baseQuestion,
          options,
          correctIndex,
          type: questionType
        });

        questionIndex += 1;
      });
    });
  });

  return questions.slice(0, 10);
};

const sanitizeQuestionsForClient = (questions) =>
  questions.map(({ correctIndex, explanation, ...question }) => question);

module.exports = {
  buildQuizQuestions,
  sanitizeQuestionsForClient
};
