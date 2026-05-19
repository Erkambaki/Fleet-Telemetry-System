import express from "express";
import cors from "cors";
import telemetryRouter from "./routes/telemetry";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use("/", telemetryRouter);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.listen(PORT, () => {
  console.log(`Fleet telemetry API running on http://localhost:${PORT}`);
});

export default app;
