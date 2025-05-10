const axios = require("axios");

// Replace with your actual Airtable values
const AIRTABLE_TOKEN = process.env.AIRTABLE_TOKEN;
const BASE_ID = "GTMdb";
const TABLE_NAME = "Tasks"; // or "tasks" if lowercase
const FIELD_NAME = "Goals"; // adjust if your field is named differently

const AIRTABLE_URL = `https://api.airtable.com/v0/${BASE_ID}/${TABLE_NAME}`;

const getTasksForGoal = async (goal_id) => {
  try {
    const formula = `FIND("${goal_id}", ARRAYJOIN({${FIELD_NAME}}, ","))`;
    const response = await axios.get(AIRTABLE_URL, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_TOKEN}`
      },
      params: {
        filterByFormula: formula,
        fields: ["task_id"], // optional: only get the fields you need
        pageSize: 100
      }
    });

    const task_ids = response.data.records.map(rec => rec.fields.task_id || rec.id);
    return task_ids;
  } catch (error) {
    console.error("Error fetching tasks from Airtable:", error.response?.data || error.message);
    return null;
  }
};

module.exports = { getTasksForGoal };
