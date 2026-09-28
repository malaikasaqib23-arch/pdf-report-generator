import { getReportData, getAllOrders } from "./report-data.js";
import { buildHtml, renderPdf } from "./render.js";

await renderPdf(buildHtml(getReportData(), getAllOrders()), "reports/test.pdf");
console.log("Wrote reports/test.pdf");