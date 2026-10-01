import { sendReportEmail } from "../lib/email.js";
import { baseUrl, json } from "../lib/http.js";
import { renderReportPdf } from "../lib/pdf.js";
import { isReportId, uploadToken, verifyRelaySignature } from "../lib/security.js";
import { loadReport, savePdf, saveReport } from "../lib/store.js";

// Called by the Dino report_relay plugin once, right after a site call ends.
export async function POST(request) {
  const raw = await request.text();
  if (!verifyRelaySignature(raw, request.headers.get("x-report-signature"))) {
    return json(401, { error: "invalid signature" });
  }
  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return json(400, { error: "invalid JSON" });
  }
  const id = payload.executionId;
  const report = payload.report;
  if (!isReportId(id) || !report || typeof report !== "object") {
    return json(400, { error: "executionId and report are required" });
  }

  // The agent only sets visit_date when the engineer reports a different day.
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(report.visit_date || ""))) {
    report.visit_date = new Date(Date.now() + 330 * 60 * 1000).toISOString().slice(0, 10);
  }

  const existing = await loadReport(id);
  if (existing?.emailedAt) return json(200, { id, duplicate: true });

  const pdf = await renderReportPdf(report);
  const pdfBlob = await savePdf(id, pdf);
  const uploadUrl = `${baseUrl(request)}/upload.html?id=${id}&t=${uploadToken(id)}`;
  const record = {
    id,
    callId: payload.callId || null,
    receivedAt: existing?.receivedAt || new Date().toISOString(),
    report,
    pdfUrl: pdfBlob.url,
  };
  await saveReport(id, record);
  await sendReportEmail({ report, pdf, uploadUrl, pdfUrl: pdfBlob.url, photoCount: 0, idempotencyKey: `report-${id}` });
  await saveReport(id, { ...record, emailedAt: new Date().toISOString() });
  return json(200, { id });
}
