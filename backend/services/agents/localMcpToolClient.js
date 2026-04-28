const { executeTool } = require("../mcp/toolRegistry");

class LocalMcpToolClient {
  constructor() {
    this.toolCalls = [];
  }

  async callTool(name, args) {
    const result = await executeTool(name, args);
    this.toolCalls.push(name);
    return result;
  }

  getToolCalls() {
    return [...this.toolCalls];
  }
}

module.exports = LocalMcpToolClient;
