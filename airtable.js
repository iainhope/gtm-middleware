const axios = require("axios");

const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "appZl7uUy4NeWQ0Ho"; // ✅ your actual base ID
const TABLE_NAME = "Goals";
const FIELD_NAME = "Task Links";

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const getTasksForGoal = async (goal_id) => {
  try {
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
    if (!match) return [];

    return match.fields[FIELD_NAME] || [];
  } catch (error) {
    console.error("Airtable error:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { getTasksForGoal };
