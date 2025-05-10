const axios = require("axios");

// Your Airtable config
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "GTMdb"; // This is your Airtable Base name
const TABLE_NAME = "Goals";
const FIELD_NAME = "ID (from Task Links)"; // Field containing the task IDs as text

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const getTasksForGoal = async (goal_id) => {
  try {
    const formula = `{goal_id} = "${goal_id}"`;

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

    const task_ids = match.fields[FIELD_NAME] || [];
    return task_ids;
  } catch (error) {
    console.error("Error fetching from Airtable:", error.response?.data || error.message);
    return null;
  }
};

const getTasksForGoal = async (goal_id) => {
  ...
};

module.exports = {
  getTasksForGoal: getTasksForGoal
};
