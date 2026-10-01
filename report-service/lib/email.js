import { requireEnv } from "./security.js";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function recipients() {
  return requireEnv("REPORT_TO")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);
}

// Sends the report PDF through Resend's HTTP API.
export async function sendReportEmail({ report, pdf, uploadUrl, pdfUrl, photoCount, idempotencyKey }) {
  const title = `Daily Report A-1.3/91 - ${report.project_code || ""} - ${report.visit_date || ""}`;
  const subject = photoCount ? `${title} (updated with ${photoCount} photo${photoCount === 1 ? "" : "s"})` : title;
  const instructions = Array.isArray(report.instructions) ? report.instructions : [];
  const html = `
    <p><b>${escapeHtml(report.project_name || report.project_code)}</b> &middot; ${escapeHtml(report.visit_date)}</p>
    <p>Site engineer: ${escapeHtml(report.meva_representative || "-")} &middot; In ${escapeHtml(report.in_time || "-")} / Out ${escapeHtml(report.out_time || "-")}</p>
    ${instructions.length ? `<p>${instructions.length} instruction${instructions.length === 1 ? "" : "s"} given to the client side.</p>` : ""}
    <p>The completed A-1.3/91 Daily Report is attached${photoCount ? ` with ${photoCount} site photo${photoCount === 1 ? "" : "s"}` : ""}.</p>
    ${uploadUrl ? `<p><a href="${escapeHtml(uploadUrl)}">Add site photos to this report</a> &mdash; an updated PDF is emailed once they are added.</p>` : ""}
    ${pdfUrl ? `<p style="color:#666;font-size:12px">PDF link: <a href="${escapeHtml(pdfUrl)}">${escapeHtml(pdfUrl)}</a></p>` : ""}`;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      authorization: `Bearer ${requireEnv("RESEND_API_KEY")}`,
      "content-type": "application/json",
      ...(idempotencyKey ? { "idempotency-key": idempotencyKey } : {}),
    },
    body: JSON.stringify({
      from: requireEnv("REPORT_FROM"),
      to: recipients(),
      subject,
      html,
      attachments: [
        {
          filename: `A-1.3-91-${report.project_code || "report"}-${report.visit_date || ""}.pdf`,
          content: Buffer.from(pdf).toString("base64"),
        },
      ],
    }),
  });
  if (!response.ok) {
    throw new Error(`email failed: HTTP ${response.status} ${(await response.text()).slice(0, 300)}`);
  }
}
