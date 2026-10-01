import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

// A-1.3/91 Daily Report, drawn to match the MEVA paper form.
const A4 = [595.28, 841.89];
const MARGIN = 36;
const RED = rgb(0.886, 0.118, 0.153);
const INK = rgb(0.1, 0.1, 0.1);
const LINE = rgb(0.25, 0.25, 0.25);
const WHITE = rgb(1, 1, 1);
const ROMAN = ["i)", "ii)", "iii)", "iv)", "v)", "vi)"];

// Standard PDF fonts only cover WinAnsi; replace anything else so a stray
// character in a transcript never breaks report generation.
function clean(value) {
  if (value === undefined || value === null) return "";
  return String(value)
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[–—]/g, "-")
    .replace(/²/g, "2")
    .replace(/[^\x09\x0a\x0d\x20-\x7e -ÿ]/g, "?");
}

function list(value) {
  if (Array.isArray(value)) return value.map(clean).filter(Boolean);
  const text = clean(value);
  return text ? [text] : [];
}

function wrap(text, font, size, width) {
  const lines = [];
  for (const paragraph of clean(text).split("\n")) {
    let line = "";
    for (const word of paragraph.split(/\s+/).filter(Boolean)) {
      const next = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(next, size) <= width) {
        line = next;
      } else {
        if (line) lines.push(line);
        line = word;
        while (font.widthOfTextAtSize(line, size) > width && line.length > 1) {
          let cut = line.length - 1;
          while (cut > 1 && font.widthOfTextAtSize(line.slice(0, cut), size) > width) cut--;
          lines.push(line.slice(0, cut));
          line = line.slice(cut);
        }
      }
    }
    lines.push(line);
  }
  return lines;
}

class Sheet {
  constructor(doc, fonts) {
    this.doc = doc;
    this.fonts = fonts;
    this.width = A4[0] - MARGIN * 2;
    this.newPage();
  }

  newPage() {
    this.page = this.doc.addPage(A4);
    this.y = A4[1] - MARGIN;
    this.page.drawRectangle({
      x: MARGIN - 6,
      y: MARGIN - 6,
      width: this.width + 12,
      height: A4[1] - MARGIN * 2 + 12,
      borderColor: LINE,
      borderWidth: 0.8,
    });
  }

  ensure(height) {
    if (this.y - height < MARGIN) {
      this.newPage();
      this.header(true);
    }
  }

  text(value, x, y, { size = 8.5, bold = false, color = INK } = {}) {
    this.page.drawText(clean(value), {
      x,
      y,
      size,
      font: bold ? this.fonts.bold : this.fonts.regular,
      color,
    });
  }

  box(x, y, w, h) {
    this.page.drawRectangle({ x, y, width: w, height: h, borderColor: LINE, borderWidth: 0.6 });
  }

  header(continued = false) {
    const top = this.y;
    this.text("Procedure for Project Scheduling & Monitoring", MARGIN + 4, top - 18, { size: 13, bold: true });
    this.text(`A-1.3/91 - Daily Report${continued ? " (continued)" : ""}`, MARGIN + 4, top - 36, {
      size: 13,
      bold: true,
    });
    const logoX = MARGIN + this.width - 118;
    this.page.drawSvgPath("M 0 0 L 13 -20 L 26 0 Z", { x: logoX, y: top - 34, color: RED });
    this.text("meva", logoX + 30, top - 34, { size: 26, bold: true });
    this.y = top - 50;
    this.page.drawLine({
      start: { x: MARGIN - 6, y: this.y },
      end: { x: MARGIN + this.width + 6, y: this.y },
      thickness: 0.8,
      color: LINE,
    });
    this.y -= 14;
  }

  section(title) {
    this.ensure(30);
    const h = 13;
    this.page.drawRectangle({ x: MARGIN, y: this.y - h, width: this.width, height: h, color: RED });
    const w = this.fonts.bold.widthOfTextAtSize(title, 9);
    this.text(title, MARGIN + (this.width - w) / 2, this.y - 9.5, { size: 9, bold: true, color: WHITE });
    this.y -= h;
  }

  // One table row: [number, label, value] with optional extra columns.
  row(cells, { height = 13, boldCols = [1] } = {}) {
    this.ensure(height);
    let x = MARGIN;
    cells.forEach(([value, width, align], index) => {
      this.box(x, this.y - height, width, height);
      const bold = boldCols.includes(index);
      const font = bold ? this.fonts.bold : this.fonts.regular;
      const lines = wrap(value, font, 8, width - 8);
      lines.slice(0, Math.max(1, Math.floor((height - 3) / 10))).forEach((line, i) => {
        let tx = x + 4;
        if (align === "center") tx = x + (width - font.widthOfTextAtSize(line, 8)) / 2;
        if (align === "right") tx = x + width - 4 - font.widthOfTextAtSize(line, 8);
        this.text(line, tx, this.y - 9.5 - i * 10, { size: 8, bold });
      });
      x += width;
    });
    this.y -= height;
  }

  gap(size = 8) {
    this.y -= size;
  }

  // A numbered block with a heading row and a free-text body below it.
  block(number, title, body, minHeight = 46) {
    const bodyWidth = this.width - 28;
    const lines = wrap(body, this.fonts.regular, 8.5, bodyWidth - 8);
    const height = Math.max(minHeight, lines.length * 11 + 8);
    this.ensure(13 + Math.min(height, 120));
    const startY = this.y;
    this.row([["", 28], [title, bodyWidth]]);
    let remaining = lines;
    let first = true;
    while (remaining.length) {
      const fit = Math.max(1, Math.floor((this.y - MARGIN - 8) / 11));
      const chunk = remaining.slice(0, fit);
      const h = Math.max(first ? minHeight : 20, chunk.length * 11 + 8);
      this.box(MARGIN, this.y - h, 28, h);
      this.box(MARGIN + 28, this.y - h, bodyWidth, h);
      chunk.forEach((line, i) => this.text(line, MARGIN + 32, this.y - 11 - i * 11, { size: 8.5 }));
      if (first) {
        const numberY = (startY + this.y - h) / 2 - 3;
        this.text(String(number), MARGIN + 11, numberY, { size: 8.5, bold: true });
      }
      this.y -= h;
      remaining = remaining.slice(chunk.length);
      first = false;
      if (remaining.length) {
        this.newPage();
        this.header(true);
      }
    }
  }
}

function activities(report) {
  const out = [];
  const add = (title, items) => {
    const values = list(items);
    if (!values.length) return;
    out.push(title.toUpperCase());
    values.forEach((item) => out.push(`- ${item}`));
    out.push("");
  };
  add("Day type", report.day_type);
  add("Location", report.location);
  add("Work completed", report.work_completed);
  add("Technical checks", report.technical_checks);
  add("Pour details", report.pour_details);
  add("Discussion points", report.discussion_points);
  const instructions = Array.isArray(report.instructions) ? report.instructions : [];
  if (instructions.length) {
    out.push("INSTRUCTIONS GIVEN TO CLIENT SIDE");
    instructions.forEach((item) =>
      out.push(`- ${clean(item.instruction)} (Responsible: ${clean(item.responsible) || "-"}; By: ${clean(item.by) || "-"})`),
    );
    out.push("");
  }
  add("MEVA material movement", report.material_movement);
  add("Damaged / missing material", report.damaged_or_missing);
  add("Material requests", report.material_requests);
  add("Safety observations", report.safety_observations);
  add("Delays", report.delays);
  add("Client feedback", report.client_feedback);
  add("Pending", report.pending);
  add("Next visit", report.next_visit);
  add("Photos discussed on the call", report.photos);
  add("Needs confirmation", report.needs_confirmation);
  return out.join("\n").trim();
}

async function embedPhoto(doc, photo) {
  const bytes = photo.bytes;
  if (photo.contentType === "image/png") return doc.embedPng(bytes);
  return doc.embedJpg(bytes);
}

export async function renderReportPdf(report, { photos = [], generatedAt = new Date() } = {}) {
  const doc = await PDFDocument.create();
  doc.setTitle(`A-1.3/91 Daily Report ${clean(report.project_code)} ${clean(report.visit_date)}`);
  const fonts = {
    regular: await doc.embedFont(StandardFonts.Helvetica),
    bold: await doc.embedFont(StandardFonts.HelveticaBold),
  };
  const s = new Sheet(doc, fonts);
  const W = s.width;
  const N = 28;
  const L = 108;
  const V = W - N - L;
  s.header();

  s.section("Project Details");
  s.row([["1", N, "center"], ["Project Code", L], [report.project_code, V]], { boldCols: [0, 1] });
  s.row([["2", N, "center"], ["Project Name", L], [report.project_name, V]], { boldCols: [0, 1] });
  s.row([["3", N, "center"], ["Client", L], [report.client, V]], { boldCols: [0, 1] });
  const prodW = V - 210;
  s.row(
    [["4", N, "center"], ["Systems offered", L], ["Product Name", prodW, "center"], ["Quantity", 60, "center"], ["Unit", 45, "center"], ["Remarks", 105, "center"]],
    { boldCols: [0, 1, 2, 3, 4, 5] },
  );
  const systems = Array.isArray(report.systems) ? report.systems : [];
  const rows = Math.max(6, systems.length);
  for (let i = 0; i < rows; i++) {
    const item = systems[i] || {};
    const remarks = clean(item.remarks);
    const height = remarks.length > 28 ? 24 : 13;
    s.row(
      [["", N], [ROMAN[i] || `${i + 1})`, L, "right"], [item.product, prodW], [item.quantity, 60, "center"], [item.unit, 45, "center"], [remarks, 105]],
      { height },
    );
  }
  s.gap(10);

  s.section("Daily Reports");
  s.gap(8);
  s.row([["5", N, "center"], ["MEVA Representative", L], [report.meva_representative, V]], { boldCols: [0, 1] });
  s.row([["", N], ["Designation", L], [report.meva_designation, V]]);
  s.gap(8);
  const client = clean(report.client_representatives);
  s.row([["6", N, "center"], ["Client Representative", L], [client, V]], { boldCols: [0, 1], height: client.length > 70 ? 24 : 13 });
  s.row([["", N], ["Designation", L], [report.client_designation || "", V]]);
  s.gap(8);
  const half = (V - 60) / 2;
  s.row([["7", N, "center"], ["In Time", L], [report.in_time, half], ["Out Time", 60], [report.out_time, half]], { boldCols: [0, 1, 3] });
  s.gap(8);
  s.block(8, "Details of Labour Gang Available", report.labour_gang);
  s.gap(8);
  s.block(9, "Details other Resources Available", [report.equipment, report.weather && `Weather: ${clean(report.weather)}`].filter(Boolean).join("\n"));
  s.gap(8);
  s.block(10, "Detailed Activities", activities(report), 160);

  s.ensure(24);
  s.text(
    `Generated ${generatedAt.toISOString().slice(0, 16).replace("T", " ")} UTC from the site engineer's voice report. Status: ${clean(report.report_status) || "-"}.`,
    MARGIN,
    s.y - 14,
    { size: 7, color: rgb(0.4, 0.4, 0.4) },
  );

  if (photos.length) {
    for (let i = 0; i < photos.length; i += 2) {
      s.newPage();
      s.header(true);
      s.section(`Site Photos (${i + 1}-${Math.min(i + 2, photos.length)} of ${photos.length})`);
      const slotH = (s.y - MARGIN - 20) / 2;
      for (const [offset, photo] of photos.slice(i, i + 2).entries()) {
        const image = await embedPhoto(doc, photo);
        const top = s.y - 8 - offset * slotH;
        const scale = Math.min(W / image.width, (slotH - 24) / image.height);
        const w = image.width * scale;
        const h = image.height * scale;
        s.page.drawImage(image, { x: MARGIN + (W - w) / 2, y: top - h, width: w, height: h });
        s.text(photo.caption || `Photo ${i + offset + 1}`, MARGIN, top - h - 12, { size: 8.5 });
      }
    }
  }

  return doc.save();
}
