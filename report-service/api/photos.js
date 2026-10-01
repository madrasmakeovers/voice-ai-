import { json } from "../lib/http.js";
import { verifyUploadToken } from "../lib/security.js";
import { addPhoto, loadPhotos, loadReport } from "../lib/store.js";

const MAX_PHOTOS = 12;
const MAX_BYTES = 4 * 1024 * 1024;
const TYPES = new Set(["image/jpeg", "image/png"]);

function params(request) {
  const url = new URL(request.url);
  return { id: url.searchParams.get("id"), token: url.searchParams.get("t"), caption: url.searchParams.get("caption") };
}

// Upload page: report summary and the photos already attached.
export async function GET(request) {
  const { id, token } = params(request);
  if (!verifyUploadToken(id, token)) return json(403, { error: "invalid link" });
  const record = await loadReport(id);
  if (!record) return json(404, { error: "report not found" });
  const photos = await loadPhotos(id);
  return json(200, {
    projectName: record.report.project_name || record.report.project_code || "",
    visitDate: record.report.visit_date || "",
    engineer: record.report.meva_representative || "",
    captions: (record.report.photos || []).slice(0, MAX_PHOTOS),
    photos: photos.map((photo) => ({ caption: photo.caption, url: photo.url })),
    maxPhotos: MAX_PHOTOS,
  });
}

// Adds one resized photo (raw image body) to the report.
export async function POST(request) {
  const { id, token, caption } = params(request);
  if (!verifyUploadToken(id, token)) return json(403, { error: "invalid link" });
  const contentType = (request.headers.get("content-type") || "").split(";")[0];
  if (!TYPES.has(contentType)) return json(415, { error: "send a JPEG or PNG image" });
  if (!(await loadReport(id))) return json(404, { error: "report not found" });
  const bytes = new Uint8Array(await request.arrayBuffer());
  if (!bytes.length || bytes.length > MAX_BYTES) return json(413, { error: "image must be under 4 MB" });
  if ((await loadPhotos(id)).length >= MAX_PHOTOS) return json(409, { error: `at most ${MAX_PHOTOS} photos` });
  const photos = await addPhoto(id, { bytes, contentType, caption: (caption || "").slice(0, 140) });
  return json(200, { count: photos.length });
}
