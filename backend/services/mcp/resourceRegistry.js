const { ResourceTemplate } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { getLatestPlan, getLatestAttempts } = require("./toolRegistry");
const { buildReportCard } = require("../performanceAnalyzer");

const resourceDefinitions = [
  {
    name: "latest-plan-resource",
    template: new ResourceTemplate("academic://users/{userId}/latest-plan", { list: undefined }),
    config: {
      title: "Latest Learning Plan",
      mimeType: "application/json",
      description: "The most recent learning plan for a student"
    },
    read: async (_uri, { userId }) => {
      const plan = await getLatestPlan(userId);
      return {
        contents: [
          {
            uri: `academic://users/${userId}/latest-plan`,
            text: JSON.stringify(plan || null, null, 2)
          }
        ]
      };
    }
  },
  {
    name: "latest-report-resource",
    template: new ResourceTemplate("academic://users/{userId}/latest-report", { list: undefined }),
    config: {
      title: "Latest Report Card",
      mimeType: "application/json",
      description: "The latest report card summary for a student"
    },
    read: async (_uri, { userId }) => {
      const attempts = await getLatestAttempts(userId);
      const report = buildReportCard(attempts);
      return {
        contents: [
          {
            uri: `academic://users/${userId}/latest-report`,
            text: JSON.stringify(report || null, null, 2)
          }
        ]
      };
    }
  }
];

module.exports = {
  resourceDefinitions
};
