const express = require("express");
const axios = require("axios");
const { getTasksForGoal } = require("./airtable");

const app = express(); // ✅ THIS is what was missing
const PORT = process.env.PORT || 3000;

// Airtable config for task label lookup
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho";
const TASKS_TABLE_NAME = "tasks";
const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/${TASKS_TABLE_NAME}`;

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ STEP 1: Get task IDs for a given goal
app.post("/getTaskIDsForGoal", async (req, res) => {
  const { goal_id } = req.body;
  if (!goal_id) return res.status(400).json({ error: "Missing goal_id" });

  const task_ids = await getTasksForGoal(goal_id);
  if (task_ids === null) return res.status(500).json({ error: "Failed to fetch tasks from Airtable" });

  res.json({ task_ids });
});

// ✅ STEP 2: Get task labels based on array of IDs
app.post("/getTaskLabels", async (req, res) => {
  const { task_ids } = req.body;
  if (!Array.isArray(task_ids)) {
    return res.status(400).json({ error: "Invalid or missing task_ids" });
  }

  try {
    const filter = `OR(${task_ids.map(id => `{ID} = "${id}"`).join(",")})`;

    const response = await axios.get(TASKS_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: filter,
        fields: ["Title"], // ✅ this is the correct field name
        pageSize: 100
      }
    });

    const task_labels = response.data.records.map(r => r.fields.Title);
    res.json({ task_labels });
  } catch (error) {
    console.error("🔥 Airtable task label error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch task labels from Airtable" });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
