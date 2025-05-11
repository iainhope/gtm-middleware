const express = require("express");
const axios = require("axios");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

app.post("/getTaskIDsForGoal", async (req, res) => {
  const { goal_id } = req.body;

  if (!goal_id) {
    return res.status(400).json({ error: "Missing goal_id" });
  }

  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = "appZl7uUy4NeWQ0Ho";
    const TABLE_NAME = "Goals";
    const FIELD_NAME = "ID (from Task Links)";

    const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const filterFormula = `{ID} = "${goal_id}"`;

    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      params: {
        filterByFormula: filterFormula,
        fields: [FIELD_NAME],
        pageSize: 1,
      },
    });

    const match = response.data.records[0];
    const rawValue = match?.fields?.[FIELD_NAME];

    console.log("✅ Airtable raw field value:", rawValue);

    if (!rawValue) {
      return res.json({ task_ids: [] });
    }

    const task_ids = rawValue
      .split(",")
      .map((id) => id.trim())
      .filter((id) => id !== "");

    res.json({ task_ids });

  } catch (error) {
    console.error("🔥 Airtable error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch tasks from Airtable" });
  }
});

app.post("/getTaskLabels", async (req, res) => {
  const { task_ids } = req.body;

  if (!task_ids || !Array.isArray(task_ids)) {
    return res.status(400).json({ error: "task_ids must be an array" });
  }

  try {
    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = "appZl7uUy4NeWQ0Ho";
    const TABLE_NAME = "Tasks";
    const FIELD_NAME = "ID";
    const LABEL_FIELD = "Title";

    const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;
    const filterFormula = `OR(${task_ids
      .map((id) => `({${FIELD_NAME}} = "${id}")`)
      .join(", ")})`;

    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      params: {
        filterByFormula: filterFormula,
        fields: [FIELD_NAME, LABEL_FIELD],
        pageSize: 100,
      },
    });

    const labels = response.data.records.map((r) => r.fields[LABEL_FIELD]);
    res.json({ task_labels: labels });

  } catch (error) {
    console.error("🔥 Airtable label fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch task labels from Airtable" });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
