const express = require("express");
const { getTasksForGoal } = require("./airtable");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ POST /getTaskIDsForGoal
app.post("/getTaskIDsForGoal", async (req, res) => {
  const { goal_id } = req.body;

  if (!goal_id) {
    return res.status(400).json({ error: "Missing goal_id" });
  }

  const task_ids = await getTasksForGoal(goal_id);

  if (task_ids === null) {
    return res.status(500).json({ error: "Failed to fetch tasks from Airtable" });
  }

  res.json({ task_ids });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
