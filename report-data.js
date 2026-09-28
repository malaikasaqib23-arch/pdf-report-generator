import { db } from "./db.js";

export function getReportData() {
  // 1. Total orders + total revenue
  const totals = db
    .prepare("SELECT COUNT(*) AS totalOrders, ROUND(SUM(amount), 2) AS totalRevenue FROM orders")
    .get();

  // 2. Top 5 products by revenue
  const topProducts = db
    .prepare(`
      SELECT product,
             COUNT(*) AS orders,
             ROUND(SUM(amount), 2) AS revenue
      FROM orders
      GROUP BY product
      ORDER BY revenue DESC
      LIMIT 5
    `)
    .all();

  // 3. Orders per day, last 7 days
  const ordersPerDay = db
    .prepare(`
      SELECT created_at AS day,
             COUNT(*) AS orders
      FROM orders
      WHERE created_at >= date('now', '-6 days')
      GROUP BY created_at
      ORDER BY created_at
    `)
    .all();

  return {
    totalOrders: totals.totalOrders,
    totalRevenue: totals.totalRevenue,
    topProducts,
    ordersPerDay,
  };
}