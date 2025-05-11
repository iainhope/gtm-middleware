const axios = require("axios");

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho";
const TABLE_NAME = "Goals";
const FIELD_NAME = "ID (from Task Links)";
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const getTasksForGoal = async (goal_id) => {
  try {
    const formula = `{ID} = "${goal_id}"`;

    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`,
      },
      params: {
        filterByFormula: formula,
        fields: [FIELD_NAME],
        pageSize: 1,
      },
    });

    const match = response.data.records[0];
    if (!match) return [];

    const rawValue = match.fields[FIELD_NAME];

    // ✅ Handle array or fallback to comma-separated string (defensive)
    const taskIds = Array.isArray(rawValue)
      ? rawValue
      : typeof rawValue === "string"
      ? rawValue.split(",").map((s) => s.trim())
      : [];

    console.log("✅ Airtable raw field value:", taskIds);
    return taskIds;
  } catch (error) {
    console.error("🔥 Airtable error:", error.message || error);
    return null;
  }
};

module.exports = { getTasksForGoal };
