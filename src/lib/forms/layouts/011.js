/* Form 011 — Acknowledgement receipt. One page.
 * Ruled lines measured from the underscore runs. DATE has no printed line;
 * its answer follows the label. The organisation name has two lines, items
 * received three; IDs for those lines alias the earlier scanner fields. */
import { blank, onLine } from "./helpers.js";

const line = (textTop) => ({ x: 0.06, w: 0.87, textTop, textHeight: 0.015 });

const fields = [
    { ...blank("date", "Date", { x: 0.125, y: 0.222, w: 0.3, h: 0.0175, type: "date", section: "receipt", required: true }), order: 0 },
    // Two printed lines (0.311, 0.328) read as one answer.
    { ...blank("organization", "Name of Organization/Institution", { x: 0.06, y: 0.3085, w: 0.87, h: 0.035, type: "paragraph", section: "receipt", required: true }), order: 1 },
    { ...onLine("items-1", "Items received — line 1", { ...line(0.415), section: "items", required: true }), order: 2 },
    { ...onLine("items-2", "Items received — line 2", { ...line(0.45), section: "items" }), order: 3 },
    { ...onLine("items-3", "Items received — line 3", { ...line(0.485), section: "items", overflow: "continuation" }), order: 4 },
    { ...onLine("representative-signature", "Name and Signature of the Representative of the Organization/Institution", { ...line(0.642), type: "signature", section: "representative", required: true }), order: 5 },
    { ...onLine("representative-designation", "Designation of the Representative of the Organization/Institution", { ...line(0.729), section: "representative", required: true }), order: 6 },
];

export default { "comex-form-011-en.pdf": { pageCount: 1, fields, aliases: { f1: "organization", f3: "items-1", f4: "items-2", f5: "items-3", f6: "representative-signature", f7: "representative-designation" } } };
