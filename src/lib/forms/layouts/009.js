/* Form 009 — Progress report. Two pages.
 * Page 1: header lines, three ruled tables (report proper 7 rows; updated
 * budget 5 rows plus a Total; personnel 3 rows) measured from the rulings,
 * and narratives VII-IX. VII and VIII print "you may use another sheet",
 * so they point to labelled continuation sheets; IX has two short lines.
 * Page 2: approval sheet; signatures go in the space above each printed role. */
import { blank, grid, narrative } from "./helpers.js";

const P1 = 0;
const P2 = 1;

const fields = [
    { ...blank("title", "I. Title of the Community Engagement", { page: P1, x: 0.4, y: 0.19, w: 0.54, h: 0.0175, section: "I-III", required: true }), order: 0 },
    { ...blank("community", "II. Chosen Community/Stakeholders/Participants", { page: P1, x: 0.492, y: 0.207, w: 0.448, h: 0.0175, section: "I-III", required: true }), order: 1 },
    { ...blank("reporting-period", "III. Reporting Period", { page: P1, x: 0.245, y: 0.225, w: 0.4, h: 0.0175, section: "I-III", required: true }), order: 2 },
    {
        ...grid("report-proper", "IV. Report Proper", {
            page: P1,
            rowLines: [0.3723, 0.3903, 0.4086, 0.4266, 0.4446, 0.4626, 0.4806, 0.4989],
            section: "IV. Report Proper",
            fontSize: 10,
            columns: [
                { key: "date", label: "Date", type: "date", x: 0.2, w: 0.089, fontSize: 9 },
                { key: "activities", label: "Activities", x: 0.296, w: 0.172 },
                { key: "materials", label: "Materials used", x: 0.475, w: 0.171 },
                { key: "cost", label: "Cost", type: "currency", x: 0.653, w: 0.146 },
            ],
        }),
        order: 3,
    },
    {
        ...grid("budget", "V. Updated Budget Request for the Succeeding Phases", {
            page: P1,
            rowLines: [0.5857, 0.6037, 0.6227, 0.641, 0.659, 0.677],
            section: "V. Updated Budget",
            fontSize: 10,
            columns: [
                { key: "materials", label: "Materials needed", x: 0.131, w: 0.147 },
                { key: "quantity", label: "Quantity", type: "number", x: 0.284, w: 0.147 },
                { key: "price", label: "Price per quantity", type: "currency", x: 0.437, w: 0.147 },
                { key: "amount", label: "Amount", type: "currency", x: 0.59, w: 0.146 },
                { key: "purpose", label: "Purpose", x: 0.743, w: 0.146 },
            ],
        }),
        order: 4,
    },
    // Entered by the user; never computed from the rows.
    { ...blank("budget-total", "V. Total amount", { page: P1, type: "currency", x: 0.59, y: 0.678, w: 0.146, h: 0.0165, section: "V. Updated Budget" }), order: 5 },
    {
        ...grid("personnel", "VI. Personnel Involved and Equivalent Hours", {
            page: P1,
            rowLines: [0.7613, 0.7796, 0.7976, 0.8156],
            section: "VI. Personnel",
            fontSize: 10,
            columns: [
                { key: "name", label: "Name of personnel", x: 0.062, w: 0.287 },
                { key: "role", label: "Role", x: 0.356, w: 0.287 },
                { key: "hours", label: "Equivalent hours", type: "number", x: 0.65, w: 0.287 },
            ],
        }),
        order: 6,
    },
    { ...narrative("challenges", "VII. Challenges/Issues/Problems Encountered", { page: P1, x: 0.79, y: 0.835, w: 0.15, h: 0.0155, section: "VII-IX" }), order: 7 },
    { ...narrative("resolutions", "VIII. Resolution/s to the Challenges/Issues/Problems Encountered", { page: P1, x: 0.15, y: 0.869, w: 0.79, h: 0.0135, section: "VII-IX" }), order: 8 },
    { ...narrative("next-plans", "IX. Plans for the Next Part of the Community Engagement", { page: P1, x: 0.565, y: 0.883, w: 0.375, h: 0.035, section: "VII-IX", required: true }), order: 9 },
    { ...blank("prepared-by-signature", "X. Prepared by: Project Head (signature)", { page: P2, type: "signature", x: 0.08, y: 0.197, w: 0.4, h: 0.031, section: "X. Approval Sheet" }), order: 10 },
    { ...blank("endorsed-by-signature", "X. Endorsed by: COMEX Representative/Program Chairperson/School Dean (signature)", { page: P2, type: "signature", x: 0.52, y: 0.197, w: 0.4, h: 0.031, section: "X. Approval Sheet" }), order: 11 },
    { ...blank("approved-by-signature", "X. Approved by: Community Extension and NSTP Office Head (signature)", { page: P2, type: "signature", x: 0.3, y: 0.302, w: 0.4, h: 0.0155, section: "X. Approval Sheet" }), order: 12 },
];

export default { "comex-form-009-en.pdf": { pageCount: 2, fields } };
