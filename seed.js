import { db } from "./db.js";

const customers = ["Ayesha", "Bilal", "Sara", "Omar", "Hina", "Zain", "Fatima", "Ali", "Noor", "Hamza"];
const products = ["Laptop Stand", "Wireless Mouse", "USB-C Hub", "Desk Lamp", "Notebook", "Water Bottle"];

const pick = (list) => list[Math.floor(Math.random() * list.length)];

function randomAmount() {
  return Math.round((5 + Math.random() * 195) * 100) / 100; // 5.00 to 200.00
}

function randomDate() {
  const d = new Date();
  d.setDate(d.getDate() - Math.floor(Math.random() * 30)); // 0 to 29 days ago
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

// Start clean so running the seed twice still leaves exactly one copy
db.exec("DELETE FROM orders");

db.exec("DELETE FROM sqlite_sequence WHERE name = 'orders'");

const insert = db.prepare(
  "INSERT INTO orders (customer, product, amount, created_at) VALUES (?, ?, ?, ?)"
);

db.exec("BEGIN");
for (let i = 0; i < 200; i++) {
  insert.run(pick(customers), pick(products), randomAmount(), randomDate());
}
db.exec("COMMIT");

const { count } = db.prepare("SELECT COUNT(*) AS count FROM orders").get();
console.log(`Seeded. orders row count: ${count}`);