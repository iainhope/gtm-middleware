app.post("/getTaskLabels", async (req, res) => {
  const { task_ids } = req.body;

  if (!task_ids || !Array.isArray(task_ids)) {
    return res.status(400).json({ error: "task_ids must be an array" });
  }

  try {
    const axios = require("axios");

    const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
    const BASE_ID = "appZl7uUy4NeWQ0Ho"; // Confirmed from your screenshot
    const TABLE_NAME = "Tasks";
    const FIELD_NAME = "ID";
    const LABEL_FIELD = "Title";

    const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

    const filterFormula = `OR(${task_ids.map(id => `({${FIELD_NAME}} = "${id}")`).join(', ')})`;

    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: filterFormula,
        fields: [FIELD_NAME, LABEL_FIELD],
        pageSize: 100
      }
    });

    const labels = response.data.records.map(r => r.fields[LABEL_FIELD]);
    res.json({ task_labels: labels });

  } catch (error) {
    console.error("🔥 Airtable label fetch error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch task labels from Airtable" });
  }
});
