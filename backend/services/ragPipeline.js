const buildSearchUrl = (query, provider = "google") => {
  const encoded = encodeURIComponent(query);

  if (provider === "youtube") {
    return `https://www.youtube.com/results?search_query=${encoded}`;
  }

  return `https://www.google.com/search?q=${encoded}`;
};

const pickSubtopicText = (topic) => {
  if (topic.subtopics && topic.subtopics.length) {
    return topic.subtopics.slice(0, 2).join(" ");
  }

  return topic.title;
};

const buildResourceRecommendations = ({ structure, level }) => {
  const firstTopics = structure.flatMap((subject) =>
    subject.topics.slice(0, 2).map((topic) => ({
      subject: subject.name,
      topic: topic.title,
      subtopicText: pickSubtopicText(topic)
    }))
  );

  return firstTopics.slice(0, 8).map((entry, index) => {
    const typeCycle = ["YouTube", "Google", "Article", "Practice"];
    const type = typeCycle[index % typeCycle.length];
    const baseQuery = `${entry.subject} ${entry.topic} ${entry.subtopicText} ${level}`;

    const resourceMap = {
      YouTube: {
        url: buildSearchUrl(`${baseQuery} tutorial lecture explained`, "youtube"),
        platform: "YouTube",
        description: "Video explanations for concept clarity, walkthroughs, and guided learning.",
        cta: "Open YouTube"
      },
      Google: {
        url: buildSearchUrl(`${baseQuery} notes explained pdf`),
        platform: "Google Search",
        description: "Search the web for notes, explainers, and broader context around the topic.",
        cta: "Search Google"
      },
      Article: {
        url: buildSearchUrl(`${baseQuery} article guide medium`),
        platform: "Article Search",
        description: "Long-form reading recommendations for deeper understanding and theory building.",
        cta: "Read Articles"
      },
      Practice: {
        url: buildSearchUrl(`${baseQuery} practice questions worksheet`),
        platform: "Practice Search",
        description: "Find exercises and problem sets to reinforce learning through practice.",
        cta: "Find Practice"
      }
    };

    const resourceDetails = resourceMap[type];

    return {
      title: `${entry.subject}: ${entry.topic}`,
      type,
      reason: `${type} matched for ${level.toLowerCase()} level revision and concept-building around ${entry.subtopicText}.`,
      url: resourceDetails.url,
      platform: resourceDetails.platform,
      description: resourceDetails.description,
      cta: resourceDetails.cta
    };
  });
};

module.exports = {
  buildResourceRecommendations
};
