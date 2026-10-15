/* Form 015 — Personal reflection form. One page; "you may use another sheet
 * if needed". Key takeaways (10 ruled lines) and recommendations (5) are
 * paragraphs whose 11.5pt line height equals the printed 13.8pt line pitch,
 * so each wrapped line sits on its rule; more text continues on sheets.
 * Aliases follow the earlier scanner order (f1-f4, f14, f19). */
import { narrative, onLine } from "./helpers.js";

const fields = [
    onLine("title", "I. Title of the activity/project/program", { x: 0.515, w: 0.42, textTop: 0.196, textHeight: 0.015, section: "details", required: true }),
    onLine("date", "II. Date of the activity/project/program", { type: "date", x: 0.518, w: 0.421, textTop: 0.232, textHeight: 0.015, section: "details", required: true }),
    onLine("venue", "III. Venue of the activity/project/program", { x: 0.54, w: 0.398, textTop: 0.266, textHeight: 0.015, section: "details", required: true }),
    narrative("takeaways", "IV. Key takeaways", { x: 0.06, y: 0.3335, w: 0.87, h: 0.1745, section: "reflection", required: true, fontSize: 11.5 }),
    narrative("recommendations", "V. Recommendations", { x: 0.06, y: 0.5425, w: 0.87, h: 0.0873, section: "reflection", required: true, fontSize: 11.5 }),
    onLine("volunteer-signature", "Name and signature of volunteer", { type: "signature", x: 0.309, w: 0.383, textTop: 0.719, textHeight: 0.015, section: "volunteer", required: true }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-015-en.pdf": { pageCount: 1, fields, aliases: { f1: "title", f2: "date", f3: "venue", f4: "takeaways", f14: "recommendations", f19: "volunteer-signature" } } };
