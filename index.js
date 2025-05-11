const express = require("express");
const { getTaskIDsForGoal } = require("./airtable");

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

  const task_ids = await getTaskIDsForGoal(goal_id);
  res.json({ task_ids });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
