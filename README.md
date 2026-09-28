\# PDF Report Generator



A small Express API that queries a SQLite database, renders the results into a real PDF with Playwright (headless Chromium), and serves the finished file by link. The client asks for a report, then downloads it from a URL. The PDF bytes never travel inside a JSON response.



\*\*Dataset:\*\* Option A, the little shop (200 randomly seeded orders from the last 30 days).



\*\*Stack:\*\* Node.js 24, Express 5, SQLite (`node:sqlite`), Playwright.



\## How to run



```bash

npm install

npx playwright install chromium

npm run seed     # creates report.db with 200 orders (safe to run twice)

npm start        # API on http://localhost:3000

```



\## API



| Method | Endpoint | What it does |

|--------|----------|--------------|

| GET | `/health` | Returns `{"status":"ok"}` |

| POST | `/reports` | Generates a report: `201` + id and file link. If one already exists for today, returns `200` with the existing id. Send `{"force": true}` to always generate a new one. |

| GET | `/reports/:id` | Returns the report record as JSON. Unknown id gives `404`. |

| GET | `/reports/:id/file` | Serves the PDF from disk. |



```bash

curl -X POST http://localhost:3000/reports

curl http://localhost:3000/reports/1

curl -o my-report.pdf http://localhost:3000/reports/1/file

```



\## How it works



1\. \*\*Query:\*\* one function runs the aggregation SQL and returns a single report object.

2\. \*\*Render:\*\* an HTML template is built from that object, and Playwright prints it to PDF. Print CSS (`thead { display: table-header-group; }` and `tr { break-inside: avoid; }`) stops rows being cut at page breaks and repeats the table header on every page.

3\. \*\*Store:\*\* the PDF is saved to `reports/<id>.pdf` and its path is saved in the `reports` table.

4\. \*\*Serve:\*\* the client downloads it from `/reports/:id/file`.



\## Aggregation SQL



```sql

\-- Totals

SELECT COUNT(\*) AS totalOrders, ROUND(SUM(amount), 2) AS totalRevenue

FROM orders;



\-- Top 5 products by revenue

SELECT product, COUNT(\*) AS orders, ROUND(SUM(amount), 2) AS revenue

FROM orders

GROUP BY product

ORDER BY revenue DESC

LIMIT 5;



\-- Orders per day, last 7 days

SELECT created\_at AS day, COUNT(\*) AS orders

FROM orders

WHERE created\_at >= date('now', '-6 days')

GROUP BY created\_at

ORDER BY created\_at;

```



\## Proof: POST → download



```

$ curl -i -X POST http://localhost:3000/reports

HTTP/1.1 201 Created

{"id":1,"file":"/reports/1/file"}



$ curl -o my-report.pdf http://localhost:3000/reports/1/file

```



The POST paused for about 1.7 seconds, and the downloaded file opened as a real 8-page PDF.



\*\*Double-click test:\*\* two simultaneous POSTs both returned `{"id":1,"file":"/reports/1/file"}`, and `reports/` contained exactly one new file (`1.pdf`). A later plain POST returned `200` with the same id. `{"force": true}` returned `201` with a new id (`3`).



!\[Page 1 of a generated report](screenshots/report-page-1.png)



\## When would I move this work out of the request? (Stage 4)



> DRAFT, rewrite in your own words.



Generating the report takes about 1.7 seconds here, which is fine for one person clicking one button, but I would move it into a background job once it takes more than a few seconds or when many users request reports at the same time, because a long request can time out and ties up the server while the user waits.



\## What the duplicate check protects against (Stage 5)



> DRAFT, rewrite in your own words.



The check stops a double-click or a retry from generating several identical reports, so the same request twice gives one file and one effect. Without a check like this, a payment or email system could charge a customer twice or send them the same email twice, which costs money and trust.



\## Project structure



```

db.js           opens report.db, creates the orders and reports tables

seed.js         clears and refills orders with 200 random rows

report-data.js  aggregation queries

render.js       HTML template + Playwright PDF rendering

server.js       Express API

```



`report.db` and `reports/` are gitignored. The seed script is the recipe for the data.

