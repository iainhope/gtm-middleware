const express = require("express");
const fs = require("fs");
const { getTasksForGoal } = require("./airtable");

const tasksData = JSON.parse(fs.readFileSync("./tasks.json", "utf-8"));

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ Step 1: Get task IDs from a goal
app.post("/getTaskIDsForGoal", async (req, res) => {
  const { goal_id } = req.body;
  if (!goal_id) return res.status(400).json({ error: "Missing goal_id" });

  const task_ids = await getTasksForGoal(goal_id);
  if (task_ids === null) return res.status(500).json({ error: "Failed to fetch tasks from Airtable" });

  res.json({ task_ids });
});

// ✅ Step 2: Get task labels from IDs
app.post("/getTaskLabels", (req, res) => {
  const { task_ids } = req.body;
  if (!task_ids || !Array.isArray(task_ids)) return res.status(400).json({ error: "Missing or invalid task_ids" });

  const labels = tasksData
    .filter(task => task_ids.includes(task.task_id))
    .map(task => task.task_label);

  res.json({ task_labels: labels });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
