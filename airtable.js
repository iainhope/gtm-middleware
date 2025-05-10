const axios = require("axios");

// Airtable config
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "GTMdb";
const TABLE_NAME = "Goals";
const FIELD_NAME = "ID (from Task Links)";
const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const getTasksForGoal = async (goal_id) => {
  try {
    // ✅ This line was previously outside the function – now it's inside
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
    if (!match) {
      console.log(`⚠️ No match found for goal_id: ${goal_id}`);
      return [];
    }

    const task_ids = match.fields[FIELD_NAME] || [];
    console.log(`✅ Found task IDs for goal_id ${goal_id}:`, task_ids);
    return task_ids;
  } catch (error) {
    console.error("🔥 Airtable error:", {
      message: error.message,
      data: error.response?.data,
      status: error.response?.status
    });
    return null;
  }
};

module.exports = { getTasksForGoal };
