/* Form 004 — Manifestation of consent for the outreach project. English and Filipino, one page each.
 * Each blank is the measured underscore run of the printed letter; answers
 * sit on the line and never cover the institutional wording. Aliases map
 * the earlier scanner IDs (f1-f11, verified in order on both languages).
 * Email (the twelfth blank) was not mapped before. */
import { onLine } from "./helpers.js";

const ALIASES = { f1: "date", f2: "position", f3: "community", f4: "school", f5: "program-title", f6: "schedule", f7: "signature", f8: "designation", f9: "organization", f10: "address", f11: "mobile" };

const EN = [
    { ...onLine("date", "Date", { x: 0.119, w: 0.222, textTop: 0.226, textHeight: 0.015, type: "date", section: "letter", required: true }), order: 0 },
    { ...onLine("position", "Your position", { x: 0.293, w: 0.393, textTop: 0.348, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 1 },
    { ...onLine("community", "Community / Barangay / Organization", { x: 0.06, w: 0.482, textTop: 0.366, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 2 },
    { ...onLine("school", "School / Department", { x: 0.06, w: 0.482, textTop: 0.403, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 3 },
    { ...onLine("program-title", "Outreach project title", { x: 0.286, w: 0.633, textTop: 0.421, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 4 },
    { ...onLine("schedule", "Conducted on", { x: 0.292, w: 0.371, textTop: 0.439, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 5 },
    { ...onLine("signature", "Signature above printed name", { x: 0.589, w: 0.33, textTop: 0.61, textHeight: 0.014, type: "signature", section: "signatory", required: true }), order: 6 },
    { ...onLine("designation", "Designation", { x: 0.589, w: 0.33, textTop: 0.66, textHeight: 0.014, type: "text", section: "signatory", required: true }), order: 7 },
    { ...onLine("organization", "Community / Barangay / Organization (signatory)", { x: 0.589, w: 0.331, textTop: 0.709, textHeight: 0.016, type: "text", section: "signatory", required: true }), order: 8 },
    { ...onLine("address", "Address", { x: 0.671, w: 0.241, textTop: 0.747, textHeight: 0.015, type: "text", section: "signatory", required: false }), order: 9 },
    { ...onLine("mobile", "Mobile number", { x: 0.732, w: 0.175, textTop: 0.764, textHeight: 0.015, type: "tel", section: "signatory", required: false }), order: 10 },
    { ...onLine("email", "Email address", { x: 0.723, w: 0.186, textTop: 0.781, textHeight: 0.015, type: "email", section: "signatory", required: false }), order: 11 },
];

const FIL = [
    { ...onLine("date", "Petsa", { x: 0.133, w: 0.219, textTop: 0.226, textHeight: 0.015, type: "date", section: "letter", required: true }), order: 0 },
    { ...onLine("position", "Posisyon", { x: 0.314, w: 0.491, textTop: 0.348, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 1 },
    { ...onLine("community", "Komunidad / Barangay / Organisasyon", { x: 0.212, w: 0.71, textTop: 0.366, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 2 },
    { ...onLine("school", "Paaralan / Departamento", { x: 0.544, w: 0.166, textTop: 0.402, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 3 },
    { ...onLine("program-title", "Pamagat ng outreach project", { x: 0.339, w: 0.557, textTop: 0.421, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 4 },
    { ...onLine("schedule", "Isasagawa sa", { x: 0.205, w: 0.372, textTop: 0.439, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 5 },
    { ...onLine("signature", "Lagda sa itaas ng pangalan", { x: 0.589, w: 0.33, textTop: 0.603, textHeight: 0.014, type: "signature", section: "signatory", required: true }), order: 6 },
    { ...onLine("designation", "Katungkulan", { x: 0.589, w: 0.33, textTop: 0.652, textHeight: 0.014, type: "text", section: "signatory", required: true }), order: 7 },
    { ...onLine("organization", "Komunidad / Barangay / Organisasyon (lumagda)", { x: 0.589, w: 0.331, textTop: 0.701, textHeight: 0.016, type: "text", section: "signatory", required: true }), order: 8 },
    { ...onLine("address", "Tirahan", { x: 0.665, w: 0.241, textTop: 0.739, textHeight: 0.015, type: "text", section: "signatory", required: false }), order: 9 },
    { ...onLine("mobile", "Mobile number", { x: 0.732, w: 0.175, textTop: 0.756, textHeight: 0.015, type: "tel", section: "signatory", required: false }), order: 10 },
    { ...onLine("email", "Email address", { x: 0.723, w: 0.186, textTop: 0.774, textHeight: 0.015, type: "email", section: "signatory", required: false }), order: 11 },
];

export default {
    "comex-form-004-en.pdf": { pageCount: 1, fields: EN, aliases: ALIASES },
    "comex-form-004-fil.pdf": { pageCount: 1, fields: FIL, aliases: ALIASES },
};
