import { sendReportEmail } from "../lib/email.js";
import { json } from "../lib/http.js";
import { renderReportPdf } from "../lib/pdf.js";
import { verifyUploadToken } from "../lib/security.js";
import { fetchPhotoBytes, loadPhotos, loadReport, savePdf, saveReport } from "../lib/store.js";

// Rebuilds the PDF with the uploaded photos and emails the updated report.
export async function POST(request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  if (!verifyUploadToken(id, url.searchParams.get("t"))) return json(403, { error: "invalid link" });
  const record = await loadReport(id);
  if (!record) return json(404, { error: "report not found" });
  const photos = await loadPhotos(id);
  if (!photos.length) return json(400, { error: "add at least one photo first" });

  const pdf = await renderReportPdf(record.report, { photos: await fetchPhotoBytes(photos) });
  const pdfBlob = await savePdf(id, pdf);
  await sendReportEmail({
    report: record.report,
    pdf,
    pdfUrl: pdfBlob.url,
    photoCount: photos.length,
    idempotencyKey: `report-${id}-photos-${photos.length}`,
  });
  await saveReport(id, { ...record, pdfUrl: pdfBlob.url, photosEmailedAt: new Date().toISOString(), photoCount: photos.length });
  return json(200, { photoCount: photos.length });
}
