\# PDF Report Generator



A small Express API that queries a SQLite database, renders the results into a real PDF with Playwright, and serves the finished file by link.



\*\*Dataset:\*\* Option A, the little shop (200 seeded random orders).



\## How to run



```bash

npm install

npx playwright install chromium

npm run seed     # creates report.db with 200 orders (safe to run twice)

npm start        # API on http://localhost:3000

```



\## Usage



```bash

curl -X POST http://localhost:3000/reports      # generate (201) or reuse today's (200)

curl http://localhost:3000/reports/1            # report record

curl -o my-report.pdf http://localhost:3000/reports/1/file   # download the PDF

```



\## Aggregation SQL



```sql

\-- Totals

SELECT COUNT(\*) AS totalOrders, ROUND(SUM(amount), 2) AS totalRevenue FROM orders;



\-- Top 5 products by revenue

SELECT product, COUNT(\*) AS orders, ROUND(SUM(amount), 2) AS revenue

FROM orders GROUP BY product ORDER BY revenue DESC LIMIT 5;



\-- Orders per day, last 7 days

SELECT created\_at AS day, COUNT(\*) AS orders

FROM orders WHERE created\_at >= date('now', '-6 days')

GROUP BY created\_at ORDER BY created\_at;

```



\## Proof: POST → download



TODO: paste your POST response and a note that the downloaded PDF opened.



!\[Page 1 of a generated report](screenshots/report-page-1.png)



\## When would I move this work out of the request? (Stage 4)



TODO: one sentence of your own. (Hint: a POST took about 1.7 seconds.)



\## What the duplicate check protects against (Stage 5)



TODO: two sentences of your own: what the check protects against, and one real-world example where a missing check costs money.



