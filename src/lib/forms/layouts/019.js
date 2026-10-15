/* Form 019 — Manifestation of consent for the community service of NSTP
 * students (English and Filipino, one page each, 595.5×842). Blanks are the
 * measured underscore runs; the English DATE has no printed line, so its
 * answer follows the label. The title spans two printed lines in English. */
import { blank, onLine } from "./helpers.js";

const line = (id, label, x, w, textTop, extra = {}) => onLine(id, label, { x, w, textTop, textHeight: 0.014, ...extra });

const EN = [
    blank("date", "Date", { type: "date", x: 0.205, y: 0.1885, w: 0.3, h: 0.0165, section: "letter", required: true }),
    line("position", "Your position", 0.384, 0.393, 0.305, { section: "letter", required: true }),
    line("community", "Community / Barangay / Organization", 0.299, 0.236, 0.322, { section: "letter", required: true }),
    { ...blank("program-title", "Community service title", { type: "paragraph", x: 0.144, y: 0.3705, w: 0.717, h: 0.0345, section: "letter", required: true }), fontSize: 10 },
    line("schedule", "Conducted on", 0.383, 0.381, 0.408, { section: "letter", required: true }),
    line("signature", "Signature above printed name", 0.566, 0.303, 0.586, { type: "signature", section: "signatory", required: true }),
    line("designation", "Designation", 0.566, 0.303, 0.635, { section: "signatory", required: true }),
    line("organization", "Community / Barangay / Organization (signatory)", 0.566, 0.303, 0.701, { section: "signatory", required: true }),
    line("address", "Address", 0.646, 0.226, 0.733, { section: "signatory" }),
    line("mobile", "Mobile number", 0.709, 0.158, 0.75, { type: "tel", section: "signatory" }),
    line("email", "Email address", 0.7, 0.18, 0.766, { type: "email", section: "signatory" }),
].map((field, order) => ({ ...field, order }));

const FIL = [
    line("date", "Petsa", 0.219, 0.225, 0.196, { type: "date", section: "letter", required: true }),
    line("position", "Posisyon", 0.406, 0.361, 0.311, { section: "letter", required: true }),
    line("community", "Komunidad / Barangay / Organisasyon", 0.33, 0.192, 0.328, { section: "letter", required: true }),
    line("program-title", "Pamagat ng community service", 0.244, 0.617, 0.38, { section: "letter", required: true }),
    line("schedule", "Isasagawa sa (petsa)", 0.293, 0.382, 0.397, { section: "letter", required: true }),
    line("signature", "Lagda sa ibabaw ng pangalan", 0.566, 0.303, 0.601, { type: "signature", section: "signatory", required: true }),
    line("designation", "Katungkulan", 0.566, 0.303, 0.65, { section: "signatory", required: true }),
    line("organization", "Komunidad / Barangay / Organisasyon (lumagda)", 0.566, 0.303, 0.716, { section: "signatory", required: true }),
    line("address", "Tirahan", 0.64, 0.225, 0.749, { section: "signatory" }),
    line("mobile", "Mobile number", 0.709, 0.158, 0.765, { type: "tel", section: "signatory" }),
    line("email", "Email address", 0.699, 0.169, 0.782, { type: "email", section: "signatory" }),
].map((field, order) => ({ ...field, order }));

// Verified by position and printed label against the earlier scanner fields.
const EN_ALIASES = { f1: "position", f2: "community", f3: "program-title", f5: "schedule", f6: "signature", f7: "designation", f8: "organization", f9: "address", f10: "mobile", f11: "email" };
const FIL_ALIASES = { f1: "date", f2: "position", f3: "community", f4: "program-title", f5: "schedule", f6: "signature", f7: "designation", f8: "organization", f9: "address", f10: "mobile" };

export default { "comex-form-019-en.pdf": { pageCount: 1, fields: EN, aliases: EN_ALIASES }, "comex-form-019-fil.pdf": { pageCount: 1, fields: FIL, aliases: FIL_ALIASES } };
