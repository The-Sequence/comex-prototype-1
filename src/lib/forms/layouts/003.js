/* Form 003 — Manifestation of consent for the seminar/workshop/training. English and Filipino, one page each.
 * Each blank is the measured underscore run of the printed letter; answers
 * sit on the line and never cover the institutional wording. Aliases map
 * the earlier scanner IDs (f1-f11, verified in order on both languages).
 * Email (the twelfth blank) was not mapped before. */
import { onLine } from "./helpers.js";

const ALIASES = { f1: "date", f2: "position", f3: "community", f4: "school", f5: "program-title", f6: "schedule", f7: "signature", f8: "designation", f9: "organization", f10: "address", f11: "mobile" };

const EN = [
    { ...onLine("date", "Date", { x: 0.119, w: 0.222, textTop: 0.241, textHeight: 0.015, type: "date", section: "letter", required: true }), order: 0 },
    { ...onLine("position", "Your position", { x: 0.293, w: 0.393, textTop: 0.363, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 1 },
    { ...onLine("community", "Community / Barangay / Organization", { x: 0.06, w: 0.482, textTop: 0.382, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 2 },
    { ...onLine("school", "School / Department", { x: 0.06, w: 0.482, textTop: 0.418, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 3 },
    { ...onLine("program-title", "Seminar / workshop / training title", { x: 0.363, w: 0.556, textTop: 0.436, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 4 },
    { ...onLine("schedule", "Runs from", { x: 0.226, w: 0.372, textTop: 0.455, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 5 },
    { ...onLine("signature", "Signature above printed name", { x: 0.589, w: 0.33, textTop: 0.626, textHeight: 0.014, type: "signature", section: "signatory", required: true }), order: 6 },
    { ...onLine("designation", "Designation", { x: 0.589, w: 0.33, textTop: 0.675, textHeight: 0.014, type: "text", section: "signatory", required: true }), order: 7 },
    { ...onLine("organization", "Community / Barangay / Organization (signatory)", { x: 0.589, w: 0.331, textTop: 0.724, textHeight: 0.016, type: "text", section: "signatory", required: true }), order: 8 },
    { ...onLine("address", "Address", { x: 0.671, w: 0.241, textTop: 0.762, textHeight: 0.015, type: "text", section: "signatory", required: false }), order: 9 },
    { ...onLine("mobile", "Mobile number", { x: 0.732, w: 0.175, textTop: 0.78, textHeight: 0.015, type: "tel", section: "signatory", required: false }), order: 10 },
    { ...onLine("email", "Email address", { x: 0.723, w: 0.186, textTop: 0.797, textHeight: 0.015, type: "email", section: "signatory", required: false }), order: 11 },
];

const FIL = [
    { ...onLine("date", "Petsa", { x: 0.133, w: 0.219, textTop: 0.241, textHeight: 0.015, type: "date", section: "letter", required: true }), order: 0 },
    { ...onLine("position", "Posisyon", { x: 0.389, w: 0.393, textTop: 0.363, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 1 },
    { ...onLine("community", "Komunidad / Barangay / Organisasyon", { x: 0.208, w: 0.385, textTop: 0.381, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 2 },
    { ...onLine("school", "Paaralan / Departamento", { x: 0.364, w: 0.285, textTop: 0.418, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 3 },
    { ...onLine("program-title", "Pamagat ng seminar / workshop / pagsasanay", { x: 0.311, w: 0.611, textTop: 0.436, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 4 },
    { ...onLine("schedule", "Gaganapin mula sa", { x: 0.254, w: 0.286, textTop: 0.454, textHeight: 0.015, type: "text", section: "letter", required: true }), order: 5 },
    { ...onLine("signature", "Lagda sa itaas ng pangalan", { x: 0.589, w: 0.33, textTop: 0.644, textHeight: 0.014, type: "signature", section: "signatory", required: true }), order: 6 },
    { ...onLine("designation", "Katungkulan", { x: 0.589, w: 0.33, textTop: 0.694, textHeight: 0.014, type: "text", section: "signatory", required: true }), order: 7 },
    { ...onLine("organization", "Komunidad / Barangay / Organisasyon (lumagda)", { x: 0.589, w: 0.331, textTop: 0.743, textHeight: 0.016, type: "text", section: "signatory", required: true }), order: 8 },
    { ...onLine("address", "Tirahan", { x: 0.665, w: 0.241, textTop: 0.781, textHeight: 0.015, type: "text", section: "signatory", required: false }), order: 9 },
    { ...onLine("mobile", "Mobile number", { x: 0.732, w: 0.175, textTop: 0.798, textHeight: 0.015, type: "tel", section: "signatory", required: false }), order: 10 },
    { ...onLine("email", "Email address", { x: 0.723, w: 0.186, textTop: 0.815, textHeight: 0.015, type: "email", section: "signatory", required: false }), order: 11 },
];

export default {
    "comex-form-003-en.pdf": { pageCount: 1, fields: EN, aliases: ALIASES },
    "comex-form-003-fil.pdf": { pageCount: 1, fields: FIL, aliases: ALIASES },
};
