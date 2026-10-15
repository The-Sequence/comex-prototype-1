/* Form 005 — Needs assessment report. One page.
 * The printed outline has headings but no answer space. Each item gets one
 * line beside its heading (measured text ends) and allows a labelled
 * continuation sheet, so long narratives never cover the outline. Annex
 * items get an "attached" tick in the left margin. */
import { blank, narrative } from "./helpers.js";

// [id, printed heading, x where the heading ends, heading top, section]
const ITEMS = [
    ["title", "I. Title of the Community Engagement", 0.4, 0.206, "I. Title"],
    ["leader", "II. Project Team — Leader", 0.19, 0.259, "II. Project Team"],
    ["members", "II. Project Team — Members and Roles", 0.3, 0.276, "II. Project Team"],
    ["issues", "A.1. Issues/Problems to be Addressed", 0.46, 0.363, "III. Report Proper — A. Introduction"],
    ["community", "A.2. The Chosen Community/Beneficiaries", 0.495, 0.381, "III. Report Proper — A. Introduction"],
    ["reasons", "A.3. Reason/s for Choosing the Community/Beneficiaries", 0.62, 0.398, "III. Report Proper — A. Introduction"],
    ["techniques", "B.1. Data Gathering Technique/s and Reason/s for Employing Them", 0.72, 0.45, "III. Report Proper — B. Method"],
    // The source prints "B.1." twice; the wording is kept as printed.
    ["dates-venues", "B.1. Dates and Venues", 0.326, 0.468, "III. Report Proper — B. Method"],
    ["findings", "C. Findings and Discussion", 0.34, 0.503, "III. Report Proper"],
    ["references", "D. References (if applicable)", 0.35, 0.537, "III. Report Proper"],
];

const ANNEXES = [
    ["annex-interview-guide", "1. Interview guide", 0.607],
    ["annex-guide-questions", "2. Guide questions", 0.625],
    ["annex-interviewees", "3. List of interviewees", 0.642],
    ["annex-interview-documentation", "4. Interview documentation", 0.66],
    ["annex-minutes", "5. Minutes of meetings with community representatives/members", 0.677],
    ["annex-other", "6. Other relevant documents", 0.694],
];

const fields = [
    ...ITEMS.map(([id, label, x, top, section], order) => ({
        ...narrative(id, label, { x, y: top + 0.001, w: 0.94 - x, h: 0.0175, section, required: !["references"].includes(id) }),
        ...(["title", "leader"].includes(id) ? { type: "text" } : {}),
        order,
    })),
    ...ANNEXES.map(([id, label, top], index) => ({
        ...blank(id, `Annex attached: ${label}`, { x: 0.064, y: top + 0.0005, w: 0.016, h: 0.014, type: "checkbox", section: "IV. Annexes" }),
        order: ITEMS.length + index,
    })),
];

export default { "comex-form-005-en.pdf": { pageCount: 1, fields } };
