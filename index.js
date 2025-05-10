const axios = require("axios");

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho";
const TASKS_TABLE_NAME = "tasks";
const TASKS_URL = `https://api.airtable.com/v0/${BASE_ID}/${TASKS_TABLE_NAME}`;

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
        fields: ["Title"], // ✅ this is your task label field
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
