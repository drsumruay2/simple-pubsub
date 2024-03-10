import express from "express";
import { runSimulation } from "./simulation";

const app = express();
app.use(express.json()); // Add this line if you are using JSON requests
app.listen(4000, () => {
  console.log(`server running on port 4000`);
});
app.post("/api/run-simulate", async (req, res) => {
  // run simulation here.
  await runSimulation();
  res.send("Simulation completed");
});
