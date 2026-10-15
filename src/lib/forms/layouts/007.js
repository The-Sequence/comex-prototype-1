/* Form 007 — Checklist of criteria for seminar/workshop/training proposal. One page.
 * Rows and columns measured from the PDF's table rulings. Printed column order is YES then NO. The source prints 13 answer rows numbered 1-3 and 5-14 (no item 4); numbering is kept as printed.
 * Endorsed By / Noted By print no answer space; those approvals happen in
 * the engagement workflow, not on this page. */
import { blank, choiceRow } from "./helpers.js";

const COLUMNS = [{ id: "yes", label: "Yes", x0: 0.760, x1: 0.849 }, { id: "no", label: "No", x0: 0.849, x1: 0.938 }];

// [printed number, printed section, printed question, row top, row bottom]
const ROWS = [
    ["1", "Relevance to academic extension programs", "Is the seminar/workshop/training relevant to the needs of the participants?", 0.213, 0.236],
    ["2", "Relevance to academic extension programs", "Is the seminar/workshop/training relevant to the core competencies of the school or department?", 0.236, 0.275],
    ["3", "Relevance to academic extension programs", "Can it be repackaged into an extension program for future purposes?", 0.275, 0.297],
    ["5", "Collaboration and participation", "Does it involve the input and collaboration of the target group?", 0.321, 0.344],
    ["6", "Collaboration and participation", "Is the target group willing to take part in this activity?", 0.344, 0.383],
    ["7", "Collaboration and participation", "Will it be conducted with a community that NU Fairview has an existing MOA/MOU?", 0.383, 0.421],
    ["8", "Value Oriented", "Is the activity aligned with the mission, vision, and core values of the University?", 0.445, 0.49],
    ["9", "Financing and Sustainability", "Is the activity not financially demanding so as not to sap the financial resources allotted by the school/department and the University for community extension activities?", 0.513, 0.568],
    ["10", "Financing and Sustainability", "Is the target group willing to share its counterpart in terms of its physical or financial resources in the implementation of the activity?", 0.568, 0.607],
    ["11", "Financing and Sustainability", "Is there any external funding agency that shall support the activity?", 0.607, 0.63],
    ["12", "Financing and Sustainability", "It there any related activity to support and finance the proposed project?", 0.63, 0.653],
    ["13", "Significance", "Is it going to cater to pressing and legitimate community needs?", 0.675, 0.698],
    ["14", "Significance", "Are there formal studies, community assessments and problem analyses that were conducted?", 0.698, 0.744],
];

const fields = [
    ...ROWS.map(([number, heading, question, top, bottom], order) => ({
        ...choiceRow(`criterion-${number}`, `${number}. ${question}`, { top, bottom, x: 0.108, w: 0.83, columns: COLUMNS, section: "criteria", required: true }),
        order,
        help: heading,
    })),
    { ...blank("assessed-by-signature", "Assessed by: Program Head (signature)", { x: 0.08, y: 0.799, w: 0.4, h: 0.03, type: "signature", section: "approval" }), order: ROWS.length },
];

export default { "comex-form-007-en.pdf": { pageCount: 1, fields } };
