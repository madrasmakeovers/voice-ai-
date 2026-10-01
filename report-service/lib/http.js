export function json(status, body) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });
}

export function baseUrl(request) {
  return (process.env.PUBLIC_BASE_URL || new URL(request.url).origin).replace(/\/$/, "");
}
