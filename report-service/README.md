# Site report service

Turns a finished Dino site-inspection call into the MEVA A-1.3/91 Daily Report PDF and emails it.

1. After the call, the agent's `report_relay` integration POSTs the report to `/api/reports`, signed with `RELAY_KEY`.
2. The service renders the PDF, stores it in Vercel Blob, and emails it with a photo-upload link.
3. The engineer opens the link (`/upload.html`), adds photos, and an updated PDF with the photos is emailed.

## Environment variables

| Name | Purpose |
| --- | --- |
| `RELAY_KEY` | Shared HMAC key; must match `relayKey` in the agent's integration configuration |
| `LINK_SECRET` | Signs photo-upload links |
| `RESEND_API_KEY` | Resend API key used to send email |
| `REPORT_FROM` | Sender, e.g. `Site Reports <reports@your-domain>` (domain verified in Resend) |
| `REPORT_TO` | Comma-separated recipients |
| `BLOB_READ_WRITE_TOKEN` | Added automatically when a Vercel Blob store is connected |
| `PUBLIC_BASE_URL` | Optional; defaults to the request origin |

Deploy as a Vercel project with root directory `report-service` and output directory `public`.
`npm run sample -- out.pdf` renders a sample report locally.
