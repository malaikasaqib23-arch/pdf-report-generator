import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import path from "node:path";

const esc = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export function buildHtml(report, orders) {
  const today = new Date().toISOString().slice(0, 10);

  const topRows = report.topProducts
    .map(
      (p) => `<tr><td>${esc(p.product)}</td><td>${p.orders}</td><td>$${p.revenue.toFixed(2)}</td></tr>`
    )
    .join("");

  const orderRows = orders
    .map(
      (o) =>
        `<tr><td>${o.id}</td><td>${esc(o.customer)}</td><td>${esc(o.product)}</td><td>$${o.amount.toFixed(2)}</td><td>${o.created_at}</td></tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: Arial, sans-serif; color: #222; font-size: 12px; }
    h1 { margin-bottom: 4px; }
    .date { color: #666; margin-bottom: 20px; }
    .totals { display: flex; gap: 16px; margin-bottom: 24px; }
    .card { background: #eef2ff; padding: 14px 20px; border-radius: 8px; }
    .card .num { font-size: 22px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    th, td { text-align: left; padding: 8px 10px; border-bottom: 1px solid #ddd; }
    th { background: #4f46e5; color: white; }
  </style>
</head>
<body>
  <h1>Sales Report</h1>
  <div class="date">Generated ${today}</div>

  <div class="totals">
    <div class="card"><div>Total orders</div><div class="num">${report.totalOrders}</div></div>
    <div class="card"><div>Total revenue</div><div class="num">$${report.totalRevenue.toFixed(2)}</div></div>
  </div>

  <h2>Top 5 products by revenue</h2>
  <table>
    <thead><tr><th>Product</th><th>Orders</th><th>Revenue</th></tr></thead>
    <tbody>${topRows}</tbody>
  </table>

  <h2>All orders</h2>
  <table>
    <thead><tr><th>ID</th><th>Customer</th><th>Product</th><th>Amount</th><th>Date</th></tr></thead>
    <tbody>${orderRows}</tbody>
  </table>
</body>
</html>`;
}

export async function renderPdf(html, outPath) {
  mkdirSync(path.dirname(outPath), { recursive: true });
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "load" });
    await page.pdf({
      path: outPath,
      format: "A4",
      printBackground: true,
      margin: { top: "18mm", bottom: "18mm", left: "14mm", right: "14mm" },
    });
  } finally {
    await browser.close();
  }
}