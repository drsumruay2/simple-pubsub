import express from "express";
import { runSimulation } from "./simulation";

const app = express();
app.use(express.json());
app.listen(4000, () => {
  console.log(`server is running on port 4000`);
});
app.post("/api/run-simulate", async (req, res) => {
  await runSimulation();
  res.send("Simulation completed");
});
