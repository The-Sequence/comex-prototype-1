/* Form 022 — Peer evaluation form. One page.
 * Evaluator details on their underlines; a 9-row member grid with five
 * 1-3 criteria and a Total Score column whose value can be calculated
 * explicitly from the five criteria in that row. "Comments about the
 * members" prints no space, so it continues on a labelled sheet. */
import { grid, narrative, onLine } from "./helpers.js";

const CRITERIA = ["quality", "responsibility", "teamwork", "contribution", "attitude"];
const rating = (key, label, x, w) => ({ key, label: `${label} (1-3)`, type: "number", x, w, constraints: { min: 1, max: 3 } });

const table = grid("members", "Team members and ratings (alphabetical order)", {
    rowLines: [0.5879, 0.6151, 0.6419, 0.6691, 0.6962, 0.7231, 0.7499, 0.7771, 0.8042, 0.8314], section: "Ratings", required: true, fontSize: 10,
    columns: [
        { key: "name", label: "Name of member", x: 0.052, w: 0.26 },
        rating("quality", "Quality", 0.318, 0.08), rating("responsibility", "Responsibility", 0.404, 0.135), rating("teamwork", "Teamwork", 0.545, 0.106),
        rating("contribution", "Contribution", 0.657, 0.125), rating("attitude", "Attitude", 0.788, 0.085),
        { key: "total", label: "Total score", type: "number", x: 0.879, w: 0.07, total: { kind: "rowSum", columns: CRITERIA } },
    ],
});

const fields = [
    onLine("evaluator", "Evaluator's name", { x: 0.191, w: 0.257, textTop: 0.253, textHeight: 0.015, section: "Evaluator", required: true }),
    onLine("section", "Section", { x: 0.106, w: 0.343, textTop: 0.283, textHeight: 0.015, section: "Evaluator", required: true }),
    onLine("group-number", "Group number", { x: 0.17, w: 0.277, textTop: 0.313, textHeight: 0.015, section: "Evaluator", required: true }),
    table,
    narrative("comments", "Comments about the members", { x: 0.25, y: 0.8505, w: 0.69, h: 0.0145, section: "Comments", fontSize: 9 }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-022-en.pdf": { pageCount: 1, fields, aliases: { f1: "evaluator", f2: "section", f3: "group-number" } } };
