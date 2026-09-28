import express from "express";
import path from "node:path";
import fs from "node:fs";
import { db } from "./db.js";
import { getReportData, getAllOrders } from "./report-data.js";
import { buildHtml, renderPdf } from "./render.js";

const app = express();
app.use(express.json());

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

let inFlight = null; // the report currently being generated, if any

async function createReport() {
  const createdAt = new Date().toISOString();
  const { lastInsertRowid } = db
    .prepare("INSERT INTO reports (path, created_at) VALUES (?, ?)")
    .run("", createdAt);
  const id = Number(lastInsertRowid);
  const filePath = `reports/${id}.pdf`;

  try {
    const html = buildHtml(getReportData(), getAllOrders());
    await renderPdf(html, filePath);
    db.prepare("UPDATE reports SET path = ? WHERE id = ?").run(filePath, id);
    return id;
  } catch (err) {
    db.prepare("DELETE FROM reports WHERE id = ?").run(id); // no half-finished records
    throw err;
  }
}

// Generate a report: query -> render -> store -> return link
app.post("/reports", async (req, res) => {
  const force = req.body?.force === true;

  try {
    if (!force) {
      // Guard 1: a report is being generated right now -> wait for it, same id
      if (inFlight) {
        const id = await inFlight;
        return res.status(200).json({ id, file: `/reports/${id}/file` });
      }

      // Guard 2: a finished report already exists for today -> reuse it
      const today = new Date().toISOString().slice(0, 10);
      const existing = db
        .prepare(
          "SELECT id FROM reports WHERE path != '' AND substr(created_at, 1, 10) = ? ORDER BY id DESC LIMIT 1"
        )
        .get(today);
      if (existing) {
        return res.status(200).json({ id: existing.id, file: `/reports/${existing.id}/file` });
      }

      inFlight = createReport();
      try {
        const id = await inFlight;
        return res.status(201).json({ id, file: `/reports/${id}/file` });
      } finally {
        inFlight = null;
      }
    }

    // force: true -> always make a fresh one
    const id = await createReport();
    return res.status(201).json({ id, file: `/reports/${id}/file` });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: "Report generation failed" });
  }
});

// Report record (JSON only, never the file bytes)
app.get("/reports/:id", (req, res) => {
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
  if (!row) return res.status(404).json({ error: "Report not found" });
  res.json({ id: row.id, created_at: row.created_at, file: `/reports/${row.id}/file` });
});

// The only endpoint that moves the bytes
app.get("/reports/:id/file", (req, res) => {
  const row = db.prepare("SELECT * FROM reports WHERE id = ?").get(req.params.id);
  if (!row || !fs.existsSync(row.path)) {
    return res.status(404).json({ error: "Report not found" });
  }
  res.sendFile(path.resolve(row.path));
});

const PORT = 3000;
app.listen(PORT, () => console.log(`Listening on http://localhost:${PORT}`));