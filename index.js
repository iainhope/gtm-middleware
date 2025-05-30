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

    // ✅ Append fallback option
    task_labels.push("None of these seem right");

    console.log("🎯 Final matched_task_labels_array:", task_labels);
    res.json({ matched_task_labels_array: task_labels });

  } catch (error) {
    console.error("🔥 Task label fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch task labels from Airtable" });
  }
});

// ✅ Route 3 Get Task ID from Task Label (via Tasks table)
app.post("/getTaskIDForLabel", async (req, res) => {
  try {
    const { task_label } = req.body;
    console.log("📥 Received task_label:", task_label);

    const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/Tasks`;
    const taskResponse = await axios.get(TASKS_URL, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      params: {
        filterByFormula: `SEARCH("${task_label}", {Title})`,
        fields: ["ID"],
        pageSize: 1
      }
    });

    const taskRecord = taskResponse.data.records[0];
    if (!taskRecord) {
      return res.status(404).json({ error: "Task not found" });
    }

    const taskID = taskRecord.fields.ID;
    console.log("🎯 Matched Task ID:", taskID);

    // 🔁 Return it with the exact key Landbot expects
    res.json({ selected_task_id_1: taskID });

  } catch (error) {
    console.error("🔥 Task ID fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch task ID" });
  }
});

// ✅ Route 4: Get Method IDs for a Task ID
app.post("/getMethodIDsForTask", async (req, res) => {
  try {
    const { task_id } = req.body;
    console.log("📥 Received task_id:", task_id);

    if (!task_id || typeof task_id !== "string") {
      return res.status(400).json({ error: "task_id must be a string" });
    }

    const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/Tasks`;
    const taskResponse = await axios.get(TASKS_URL, {
      headers: { Authorization: `Bearer ${AIRTABLE_TOKEN}` },
      params: {
        filterByFormula: `{ID} = "${task_id}"`,
        fields: ["methods_flat"],
        pageSize: 1
      }
    });

    const taskRecord = taskResponse.data.records[0];
    if (!taskRecord || !taskRecord.fields.methods_flat) {
      return res.json({ matched_method_ids_array: [] });
    }

    const rawMethodIDs = taskRecord.fields.methods_flat;
    const method_ids = rawMethodIDs.split(",").map(id => id.trim());

    console.log("🔗 Final matched_method_ids_array:", method_ids);
    res.json({ matched_method_ids_array: method_ids });

  } catch (error) {
    console.error("🔥 Method ID fetch error:", error.message);
    res.status(500).json({ error: "Failed to fetch method IDs from Airtable" });
  }
});

// ✅ Route 5: Get Method Labels from Method IDs
app.post("/getMethodLabels", async (req, res) => {
  try {
    let { method_ids } = req.body;
    console.log("📥 Received method_ids:", method_ids);

    // Parse stringified array if needed
    if (typeof method_ids === "string") {
      try {
        method_ids = JSON.parse(method_ids);
      } catch (e) {
        return res.status(400).json({ error: "method_ids must be a valid JSON array or stringified array" });
      }
    }

    if (!Array.isArray(method_ids)) {
      return res.status(400).json({ error: "method_ids must be an array" });
    }

    if (method_ids.length === 0) {
      return res.json({ matched_method_labels_array: ["None of these seem right"] });
    }

    const METHODS_URL = `https://api.airtable.com/v0/${BASE_ID}/Methods`;
    const formula = `OR(${method_ids.map(id => `{ID} = "${id}"`).join(",")})`;

    const response = await axios.get(METHODS_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: formula,
        fields: ["Title", "ID"],
        pageSize: 100
      }
    });

    // Sanitize and shorten titles
    const method_labels = response.data.records.map(rec => {
      const raw = rec.fields.Title || "[Missing label]";
      return raw.replace(/[\n\r\t]/g, "").substring(0, 80);
    });

    method_labels.push("None of these seem right");

    console.log("🎯 Final matched_method_labels_array:", method_labels);
    res.json({ matched_method_labels_array: method_labels });

  } catch (error) {
    console.error("🔥 Method label fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch method labels from Airtable" });
  }
});

// ✅ Route 6: Generate downloadable summary file
const fs = require('fs');
const path = require('path');

app.post("/generateSummary", async (req, res) => {
  try {
    const { summary_text } = req.body;

    if (!summary_text || typeof summary_text !== 'string') {
      return res.status(400).json({ error: "Missing or invalid summary_text" });
    }

    const filePath = path.join(__dirname, 'public', 'gtm_summary.txt');
    fs.writeFileSync(filePath, summary_text);

    // Adjust if you're using Render static file hosting
    const publicUrl = `https://YOUR_RENDER_DOMAIN/gtm_summary.txt`;

    res.json({ file_url: publicUrl });
  } catch (error) {
    console.error("🔥 File generation error:", error.message);
    res.status(500).json({ error: "Failed to generate file" });
  }
});

// ✅ Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
