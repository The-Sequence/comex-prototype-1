/* Form 006 — Checklist of criteria for program proposal. One page.
 * Rows and columns measured from the PDF's table rulings. Printed column order is NO then YES.
 * Endorsed By / Noted By print no answer space; those approvals happen in
 * the engagement workflow, not on this page. */
import { blank, choiceRow } from "./helpers.js";

const COLUMNS = [{ id: "no", label: "No", x0: 0.760, x1: 0.849 }, { id: "yes", label: "Yes", x0: 0.849, x1: 0.938 }];

// [printed number, printed section, printed question, row top, row bottom]
const ROWS = [
    ["1", "Relevance to academic and research programs", "Is the program reflective of the identity of NU Fairview as a higher educational institution?", 0.207, 0.24],
    ["2", "Relevance to academic and research programs", "Is it going to be built and maintained based on the existing academic/research programs of the school?", 0.24, 0.274],
    ["3", "Relevance to academic and research programs", "Is the program relevant to the core competencies of the school or department?", 0.274, 0.29],
    ["4", "Collaboration and participation", "Does it involve the input and collaboration of the target group?", 0.308, 0.325],
    ["5", "Collaboration and participation", "Is the target group willing to take part in the implementation, monitoring and evaluation of the program?", 0.325, 0.358],
    ["6", "Collaboration and participation", "Are There assurances that cooperating departments or agencies will support the program?", 0.358, 0.391],
    ["7", "Collaboration and participation", "Will it be conducted with a community that NU Fairview has an existing MOA/MOU?", 0.391, 0.424],
    ["8", "Value Oriented", "Does the program promote social transformation and is aligned with the mission, vision, and core values of the University?", 0.441, 0.475],
    ["9", "Financing and Sustainability", "Is the program not financially demanding so as not to sap the financial resources allotted by the school/department and the University for community extension activities?", 0.492, 0.541],
    ["10", "Financing and Sustainability", "Is there a good number of appropriate personnel (students/staff/community people) who will implement the program both on the side of the school and target group?", 0.541, 0.59],
    ["11", "Financing and Sustainability", "Is there any external funding agency that shall support the program?", 0.59, 0.607],
    ["12", "Financing and Sustainability", "Is the proponent capable of managing the program sustainably?", 0.607, 0.625],
    ["13", "Financing and Sustainability", "Will the program contribute to the holistic growth of the community?", 0.625, 0.642],
    ["14", "Evidence-based Need and Significance", "Does the program have a clearly stated background, significance, intended outcomes and projects to support and realize the objectives?", 0.659, 0.692],
    ["15", "Evidence-based Need and Significance", "Are there formal studies, community assessments and problem analyses that were conducted?", 0.692, 0.726],
    ["16", "Evidence-based Need and Significance", "Does the program have specific and measurable results?", 0.726, 0.743],
];

const fields = [
    ...ROWS.map(([number, heading, question, top, bottom], order) => ({
        ...choiceRow(`criterion-${number}`, `${number}. ${question}`, { top, bottom, x: 0.108, w: 0.83, columns: COLUMNS, section: "criteria", required: true }),
        order,
        help: heading,
    })),
    { ...blank("assessed-by-signature", "Assessed by: Program Head (signature)", { x: 0.08, y: 0.815, w: 0.4, h: 0.03, type: "signature", section: "approval" }), order: ROWS.length },
];

export default { "comex-form-006-en.pdf": { pageCount: 1, fields } };
