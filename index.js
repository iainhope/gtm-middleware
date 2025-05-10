const express = require("express");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  next();
});

const goalsData      = JSON.parse(fs.readFileSync("./goals.json", "utf-8"));
const tasksData      = JSON.parse(fs.readFileSync("./tasks.json", "utf-8"));
const methodsData    = JSON.parse(fs.readFileSync("./methods.json", "utf-8"));
const modalitiesData = JSON.parse(fs.readFileSync("./modalities.json", "utf-8"));

app.post("/getTaskIDsForGoal", (req, res) => {
  const { goal_id } = req.body;
  const goal = goalsData.find(g => g.goal_id === goal_id);
  if (!goal) return res.status(404).json({ error: "Goal not found" });
  res.json({ task_ids: goal.linked_task_ids });
});

app.post("/getTaskLabels", (req, res) => {
  const { task_ids } = req.body;
  const labels = tasksData
    .filter(t => task_ids.includes(t.task_id))
    .map(t => t.task_label);
  res.json({ task_labels: labels });
});

app.post("/getTaskIDFromLabel", (req, res) => {
  const { task_ids, task_labels, selected_label } = req.body;
  const idx = task_labels.indexOf(selected_label);
  if (idx === -1) return res.status(404).json({ error: "Label not found" });
  res.json({ task_id: task_ids[idx] });
});

app.post("/getMethodIDsForTask", (req, res) => {
  const { task_id } = req.body;
  const task = tasksData.find(t => t.task_id === task_id);
  if (!task) return res.status(404).json({ error: "Task not found" });
  res.json({ method_ids: task.linked_method_ids });
});

app.post("/getMethodLabels", (req, res) => {
  const { method_ids } = req.body;
  const labels = methodsData
    .filter(m => method_ids.includes(m.method_id))
    .map(m => m.method_label);
  res.json({ method_labels: labels });
});

app.post("/getMethodDetails", (req, res) => {
  const { method_id } = req.body;
  const method = methodsData.find(m => m.method_id === method_id);
  if (!method) return res.status(404).json({ error: "Method not found" });
  const modality = modalitiesData.find(md => md.modality_id === method.modality_id);
  res.json({
    method_label: method.method_label,
    modality: modality ? modality.modality_label : null,
    reference: method.primary_reference || null
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
