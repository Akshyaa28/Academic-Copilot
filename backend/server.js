const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const dashboardRoutes = require("./routes/dashboard");
const { createMcpHandlers } = require("./services/mcp/server");

// Load environment variables
dotenv.config();

const app = express();

app.use(express.json());
app.use(cors());

// DB connect
connectDB();

// Routes
app.use("/api", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

const { postHandler, getHandler, deleteHandler } = createMcpHandlers();
app.post("/api/mcp", postHandler);
app.get("/api/mcp", getHandler);
app.delete("/api/mcp", deleteHandler);

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
