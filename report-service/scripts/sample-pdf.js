import { writeFile } from "node:fs/promises";
import { renderReportPdf } from "../lib/pdf.js";

// Renders a sample report (30 Sep Tower B visit) to check the layout locally.
const report = {
  report_status: "complete", day_type: "slab", project_code: "IN-CHN-2417", project_name: "Greenfield Residences – Tower B (G+14)",
  client: "Sri Balaji Constructions Pvt. Ltd.", visit_date: "2026-09-30", location: "Tower B, 5th floor",
  meva_representative: "Karthik S.", meva_designation: "Site Engineer – Formwork",
  client_representatives: "Ramesh K. (Site In-charge), Murugan (Foreman)", in_time: "09:40", out_time: "13:15",
  systems: [
    { product: "Slab formwork system", quantity: "600", unit: "m²", remarks: "420 m² erected at 5F (~70%)" },
    { product: "Wall formwork panels – lift core", quantity: "16", unit: "nos", remarks: "14 erected; 2 damaged faces set aside" },
    { product: "Floor props (3.5 m)", quantity: "180", unit: "nos", remarks: "Client requests 40 more" },
    { product: "Column formwork", quantity: "12", unit: "sets", remarks: "Stripped from 4F, being cleaned" },
    { product: "Release agent", quantity: "200", unit: "L", remarks: "Skipped again" },
  ],
  labour_gang: "Carpenter gang under foreman Murugan: 12 carpenters + 8 helpers.",
  equipment: "1 tower crane shared with Block A; morning lifts delayed ~1.5 hrs.", weather: "Clear",
  work_completed: ["420 of 600 m² slab formwork erected at 5th floor", "14 lift-core wall panels erected"],
  technical_checks: ["Cantilever prop spacing not as per drawing"],
  discussion_points: ["Release agent skipped again", "Crane sharing delayed lifts"],
  instructions: [
    { instruction: "Add props at 1.2 m spacing along cantilever edge", responsible: "Ramesh K.", by: "Thu 1 Oct" },
    { instruction: "Apply release agent on all panels before pour", responsible: "Murugan", by: "Fri 2 Oct" },
  ],
  damaged_or_missing: ["2 lift-core wall panels with damaged faces"], material_requests: ["40 additional props"],
  pending: ["Confirm 40 props with depot – Karthik"], next_visit: "Thu 1 Oct – pre-pour inspection",
  photos: ["5F slab shuttering | ~70% decked", "Cantilever edge | props too far apart"], needs_confirmation: ["out_time"],
};
await writeFile(process.argv[2] || "sample-report.pdf", await renderReportPdf(report));
console.log("written");

