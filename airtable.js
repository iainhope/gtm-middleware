const axios = require("axios");

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho"; // Replace with your actual base ID
const GOALS_TABLE = "Goals";
const TASKS_TABLE = "Tasks";

const getTaskIDsForGoal = async (goal_id) => {
  try {
    const formula = `{ID} = "${goal_id}"`;

    const response = await axios.get(
      `https://api.airtable.com/v0/${BASE_ID}/${GOALS_TABLE}`,
      {
        headers: {
          Authorization: `Bearer ${AIRTABLE_TOKEN}`,
        },
        params: {
          filterByFormula: formula,
          fields: ["ID (from Task Links)"],
          pageSize: 1,
        },
      }
    );

    const match = response.data.records[0];
    if (!match) {
      console.warn("No goal found for ID:", goal_id);
      return [];
    }

    const raw = match.fields["ID (from Task Links)"];
    console.log("✅ Airtable raw field value:", raw);

    return Array.isArray(raw) ? raw : [];
  } catch (error) {
    console.error("🔥 Airtable error:", error.message || error);
    return [];
  }
};

module.exports = { getTaskIDsForGoal };
