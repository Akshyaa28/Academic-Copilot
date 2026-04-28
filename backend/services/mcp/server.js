const { McpServer } = require("@modelcontextprotocol/sdk/server/mcp.js");
const { StreamableHTTPServerTransport } = require("@modelcontextprotocol/sdk/server/streamableHttp.js");
const { listTools } = require("./toolRegistry");
const { resourceDefinitions } = require("./resourceRegistry");
const { promptDefinitions } = require("./promptRegistry");

const MCP_ENABLED = process.env.MCP_ENABLED !== "false";

const buildMcpServer = () => {
  const server = new McpServer(
    {
      name: process.env.MCP_SERVER_NAME || "academic-copilot-mcp",
      version: "1.0.0"
    },
    {
      capabilities: {
        logging: {}
      }
    }
  );

  listTools().forEach((tool) => {
    server.registerTool(
      tool.name,
      {
        title: tool.title,
        description: tool.description,
        inputSchema: tool.inputSchema
      },
      async (args) => {
        const result = await tool.execute(args);
        return {
          content: [
            {
              type: "text",
              text: tool.toText(result)
            }
          ]
        };
      }
    );
  });

  resourceDefinitions.forEach((resource) => {
    server.registerResource(resource.name, resource.template, resource.config, resource.read);
  });

  promptDefinitions.forEach((prompt) => {
    server.registerPrompt(prompt.name, prompt.config, prompt.build);
  });

  return server;
};

const createMcpHandlers = () => {
  const postHandler = async (req, res) => {
    if (!MCP_ENABLED) {
      res.status(404).json({ msg: "MCP is disabled" });
      return;
    }

    const server = buildMcpServer();

    try {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      res.on("close", () => {
        void transport.close();
        void server.close();
      });
    } catch (error) {
      console.error("[MCP] Error handling request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error"
          },
          id: null
        });
      }
    }
  };

  const unsupportedHandler = async (_req, res) => {
    if (!MCP_ENABLED) {
      res.status(404).json({ msg: "MCP is disabled" });
      return;
    }

    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  };

  return {
    postHandler,
    getHandler: unsupportedHandler,
    deleteHandler: unsupportedHandler
  };
};

module.exports = {
  MCP_ENABLED,
  createMcpHandlers
};
