/* Form 023 — NSTP certificate of completion. One page (595.25×842).
 * Each blank is a measured underscore run; captions below the lines are
 * kept as printed. */
import { onLine } from "./helpers.js";

const line = (id, label, x, w, textTop, extra = {}) => onLine(id, label, { x, w, textTop, textHeight: 0.017, section: "certificate", required: true, ...extra });

const fields = [
    line("student-name", "Name of the student", 0.148, 0.523, 0.311),
    line("section", "NSTP 2 section", 0.732, 0.209, 0.311),
    line("instructor", "Name of NSTP instructor", 0.406, 0.536, 0.401),
    line("community", "Name of the community", 0.091, 0.851, 0.532),
    line("instructor-signature", "Signature over the printed name of the NSTP instructor", 0.071, 0.589, 0.625, { type: "signature" }),
    line("date", "Date", 0.694, 0.221, 0.625, { type: "date" }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-023-en.pdf": { pageCount: 1, fields, aliases: { f1: "student-name", f2: "section", f3: "instructor", f4: "community", f5: "instructor-signature", f6: "date" } } };
