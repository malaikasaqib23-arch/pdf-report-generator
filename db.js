import { DatabaseSync } from "node:sqlite";

export const db = new DatabaseSync("report.db");

db.exec(`
  CREATE TABLE IF NOT EXISTS orders (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    customer   TEXT NOT NULL,
    product    TEXT NOT NULL,
    amount     REAL NOT NULL,
    created_at TEXT NOT NULL
  )
`);