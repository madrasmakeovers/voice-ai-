import { list, put } from "@vercel/blob";

// Reports live in Vercel Blob under reports/<executionId>/.
const base = (id) => `reports/${id}`;

async function findBlob(pathname) {
  const { blobs } = await list({ prefix: pathname, limit: 1 });
  return blobs.find((blob) => blob.pathname === pathname) || null;
}

async function readJson(pathname, fallback) {
  const blob = await findBlob(pathname);
  if (!blob) return fallback;
  const response = await fetch(`${blob.url}?v=${Date.now()}`, { cache: "no-store" });
  if (!response.ok) throw new Error(`could not read ${pathname}: HTTP ${response.status}`);
  return response.json();
}

function writeJson(pathname, value) {
  return put(pathname, JSON.stringify(value), {
    access: "public",
    contentType: "application/json",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export function loadReport(id) {
  return readJson(`${base(id)}/report.json`, null);
}

export function saveReport(id, record) {
  return writeJson(`${base(id)}/report.json`, record);
}

export function savePdf(id, bytes) {
  return put(`${base(id)}/A-1.3-91-daily-report.pdf`, Buffer.from(bytes), {
    access: "public",
    contentType: "application/pdf",
    addRandomSuffix: false,
    allowOverwrite: true,
    cacheControlMaxAge: 0,
  });
}

export function loadPhotos(id) {
  return readJson(`${base(id)}/photos.json`, []);
}

export async function addPhoto(id, { bytes, contentType, caption }) {
  const photos = await loadPhotos(id);
  const extension = contentType === "image/png" ? "png" : "jpg";
  const blob = await put(`${base(id)}/photos/${photos.length + 1}.${extension}`, Buffer.from(bytes), {
    access: "public",
    contentType,
    addRandomSuffix: true,
  });
  photos.push({ url: blob.url, contentType, caption });
  await writeJson(`${base(id)}/photos.json`, photos);
  return photos;
}

export async function fetchPhotoBytes(photos) {
  return Promise.all(
    photos.map(async (photo) => {
      const response = await fetch(photo.url);
      if (!response.ok) throw new Error(`could not read photo: HTTP ${response.status}`);
      return { ...photo, bytes: new Uint8Array(await response.arrayBuffer()) };
    }),
  );
}
