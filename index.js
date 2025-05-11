const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho";
const TABLE_NAME = "Goals";
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
const FIELD_NAME = "ID (from Task Links)";

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

// ✅ Route 1: Get Task IDs for a Goal
app.post("/getTaskIDsForGoal", async (req, res) => {
  try {
    const { goal_id } = req.body;
    if (!goal_id) return res.status(400).json({ error: "Missing goal_id" });

    const formula = `{ID} = "${goal_id}"`;

    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: formula,
        fields: [FIELD_NAME],
        pageSize: 1
      }
    });

    const match = response.data.records[0];
    if (!match || !match.fields[FIELD_NAME]) {
      return res.json({ task_ids: [] });
    }

    const rawValue = match.fields[FIELD_NAME];

    // Ensure it is returned as an array
    const task_ids = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string"
      ? rawValue.split(",").map((id) => id.trim())
      : [];

    console.log("✅ Airtable raw field value:", task_ids);
    res.json({ task_ids });
  } catch (error) {
    console.error("🔥 Airtable error:", error.message);
    res.status(500).json({ error: "Failed to fetch tasks from Airtable" });
  }
});

// ✅ Route 2: Get Task Labels from Task IDs
app.post("/getTaskLabels", async (req, res) => {
  try {
    let { task_ids } = req.body;

    // 🔎 Log incoming payload for debugging
    console.log("📥 Received task_ids:", task_ids);

    // 🔁 If it's a string (as from Landbot), parse it
    if (typeof task_ids === "string") {
      try {
        task_ids = JSON.parse(task_ids);
      } catch (e) {
        return res.status(400).json({ error: "task_ids must be a valid JSON array or stringified array" });
      }
    }

    if (!Array.isArray(task_ids)) {
      return res.status(400).json({ error: "task_ids must be an array" });
    }

    const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/Tasks`;
    const formula = `OR(${task_ids.map(id => `{ID} = "${id}"`).join(",")})`;

    const response = await axios.get(TASKS_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: formula,
        fields: ["Title", "ID"],
        pageSize: 100
      }
    });

    const task_labels = response.data.records.map(record => record.fields.Title);
    res.json({ task_labels });
  } catch (error) {
    console.error("🔥 Airtable label fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch task labels from Airtable" });
  }
});

// ✅ Route 3: Get Method data from Task Labels
app.post("/getMethodsForTask", async (req, res) => {
  try {
    let { task_label } = req.body;
    console.log("📥 Received task_label:", task_label);

    if (!task_label || typeof task_label !== "string") {
      return res.status(400).json({ error: "task_label must be a string" });
    }

    const BASE_ID = "appZl7uUy4NeWQ0Ho";
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;

    // Step 1: Look up the Task ID
    const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/Tasks`;
    const taskResponse = await axios.get(TASKS_URL, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      params: {
        filterByFormula: `{Title} = "${task_label}"`,
        fields: ["ID"],
        pageSize: 1
      }
    });

    const taskRecord = taskResponse.data.records[0];
    if (!taskRecord) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskID = taskRecord.fields.ID;

    // Step 2: Use Task ID to find Methods
    const METHODS_URL = `https://api.airtable.com/v0/${BASE_ID}/Methods`;
    const methodResponse = await axios.get(METHODS_URL, {
  headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
  params: {
    filterByFormula: `FIND("${taskID}", "{ID (from Task Links)}")`,
    fields: ["method_label", "modality_label"],
    pageSize: 100
  }
    });

    const methods = methodResponse.data.records.map((rec) => ({
      method_label: rec.fields.method_label,
      modality_label: rec.fields.modality_label
    }));

    res.json({ methods });
  } catch (error) {
    console.error("🔥 Method fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch methods for task" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
