/* Form 012 — Evaluation form (English and Filipino), one page each.
 * Header underlines measured from the underscore runs. The 7-point matrix
 * prints "check the box"; columns 1-7 are the measured cell rulings and each
 * statement row (nine statements plus the overall rating) is a scale whose
 * tick goes in the centre of the chosen cell. Numbered group headings carry
 * no answer. Legacy s1 sat on a heading row, so it is deliberately NOT
 * aliased; its old answer remains reviewable as a freehand mark. */
import { blank, choiceRow, onLine } from "./helpers.js";

const EDGES = [0.7405, 0.7691, 0.7977, 0.8263, 0.855, 0.8835, 0.9121, 0.9408];
const SCALE = EDGES.slice(0, -1).map((x0, index) => ({ id: String(index + 1), value: String(index + 1), label: String(index + 1), x0, x1: EDGES[index + 1] }));

const ALIASES = { f1: "title", f2: "dates", f3: "venue", f4: "name", f5: "age", f6: "sex", f7: "role", f8: "comments" };

function ratings(groups, overall) {
    const rows = [];
    groups.forEach(([heading, statements], group) => statements.forEach(([statement, top, bottom], index) => {
        rows.push(choiceRow(`rating-${group + 1}-${index + 1}`, statement, { top, bottom, x: 0.068, w: 0.873, columns: SCALE, type: "scale", section: "ratings", required: true }));
        rows.at(-1).help = heading;
    }));
    rows.push(choiceRow("rating-overall", overall[0], { top: overall[1], bottom: overall[2], x: 0.068, w: 0.873, columns: SCALE, type: "scale", section: "ratings", required: true }));
    return rows;
}

function layout(header, groups, overall, comments) {
    const top = header.map(([id, label, x, w, textTop, extra], order) => ({ ...onLine(id, label, { x, w, textTop, textHeight: 0.015, section: "details", ...extra }), order }));
    const rows = ratings(groups, overall).map((field, index) => ({ ...field, order: top.length + index }));
    const commentsField = { ...blank("comments", comments.label, { x: 0.06, y: comments.y, w: 0.87, h: 0.035, type: "paragraph", section: "comments", overflow: "continuation" }), order: top.length + rows.length };
    return { pageCount: 1, fields: [...top, ...rows, commentsField], aliases: ALIASES };
}

const EN = layout(
    [
        ["title", "I. Title of the project/program", 0.418, 0.516, 0.2, { required: true }],
        ["dates", "II. Date/s of the project/program", 0.44, 0.495, 0.236, { required: true }],
        ["venue", "III. Venue of the project/program", 0.443, 0.493, 0.271, { required: true }],
        ["name", "IV. Name (optional)", 0.237, 0.703, 0.305, {}],
        ["age", "Age (optional)", 0.195, 0.097, 0.323, { type: "number" }],
        ["sex", "Sex (optional)", 0.425, 0.097, 0.323, {}],
        ["role", "Role in the community", 0.732, 0.204, 0.323, {}],
    ],
    [
        ["1. Project/Program Planning and Implementation", [
            ["The project/program was effectively implemented.", 0.551, 0.569],
            ["The project/program objectives were clearly defined and achieved.", 0.569, 0.5873],
            ["The project/program was completed within the given timeframe.", 0.5873, 0.6053],
        ]],
        ["2. Impact on the Community/Stakeholders/Participants.", [
            ["The project/program addressed the needs of the community effectively.", 0.6233, 0.6413],
            ["The community members engaged and participated in the activities.", 0.6413, 0.6593],
            ["The project/program provided sustainable solutions to community issues.", 0.6593, 0.6776],
        ]],
        ["3. Organizers/Facilitators", [
            ["The organizers/facilitators demonstrated professionalism throughout the project/program implementation.", 0.6956, 0.731],
            ["The organizers/facilitators followed community rules and guidelines accordingly.", 0.731, 0.7664],
            ["The organizers/facilitators communicated clearly and effectively with community members.", 0.7664, 0.802],
        ]],
    ],
    ["4. Overall Rating of the Project/Program", 0.802, 0.82],
    { label: "Comments and suggestions", y: 0.8525 },
);

const FIL = layout(
    [
        ["title", "I. Pamagat ng proyekto/programa", 0.446, 0.486, 0.189, { required: true }],
        ["dates", "II. Petsa ng proyekto/programa", 0.422, 0.516, 0.225, { required: true }],
        ["venue", "III. Lokasyon ng proyekto/programa", 0.471, 0.462, 0.26, { required: true }],
        ["name", "IV. Pangalan (opsyonal)", 0.289, 0.645, 0.295, {}],
        ["age", "Edad (opsyonal)", 0.207, 0.055, 0.312, { type: "number", fontSize: 10 }],
        ["sex", "Kasarian (opsyonal)", 0.461, 0.055, 0.312, { fontSize: 9 }],
        ["role", "Gampanin sa komunidad", 0.788, 0.144, 0.312, {}],
    ],
    [
        ["1. Pagpaplano at Pagsasakatuparan ng Proyekto/Programa", [
            ["Ang proyekto/programa ay naisakatuparan nang epektibo.", 0.5402, 0.5583],
            ["Ang mga layunin ng proyekto/programa ay malinaw na naipahayag at naabot.", 0.5583, 0.5936],
            ["Ang proyekto/programa ay natapos sa tinakdang panahon.", 0.5936, 0.6116],
        ]],
        ["2. Epekto sa Komunidad/Mga Stakeholder/Mga Kalahok", [
            ["Ang proyekto/programa ay tumugon nang epektibo sa mga pangangailangan ng komunidad.", 0.6299, 0.6653],
            ["Ang mga miyembro ng komunidad ay naging aktibo at nakilahok sa mga gawain.", 0.6653, 0.7007],
            ["Ang proyekto/programa ay nagbigay ng mga pangmatagalang solusyon sa mga isyu ng komunidad.", 0.7007, 0.7363],
        ]],
        ["3. Mga Tagapag-ayos/Tagapagpadaloy", [
            ["Ang mga tagapag-ayos/tagapagpadaloy ay nagpakita ng propesyonalismo sa buong pagsasakatuparan ng proyekto/programa.", 0.7544, 0.7897],
            ["Ang mga tagapag-ayos/tagapagpadaloy ay sumunod sa mga alituntunin at patakaran ng komunidad.", 0.7897, 0.8251],
            ["Ang mga tagapag-ayos/tagapagpadaloy ay malinaw at epektibong nakipag-ugnayan sa mga miyembro ng komunidad.", 0.8251, 0.8608],
        ]],
    ],
    ["4. Kabuuang Pagsusuri sa Proyekto/Programa", 0.8608, 0.8788],
    { label: "Mga komento at mungkahi", y: 0.8935 },
);

export default { "comex-form-012-en.pdf": EN, "comex-form-012-fil.pdf": FIL };
