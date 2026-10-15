/* Form 018 — Project proposal form (NSTP). Two pages (595.5×842).
 * Memo header values follow the printed colons. Outline items print no
 * answer space: answers start after each heading and continue on labelled
 * sheets; the community map is a picture and always goes on its own sheet.
 * Measured grids: 2.5 time frame (4 rows), 2.6 materials (4 rows), and on
 * page 2, 2.9 committees (5 rows). */
import { blank, grid, narrative } from "./helpers.js";

const header = (id, label, top) => blank(id, label, { x: 0.315, y: top, w: 0.56, h: 0.0165, section: "Memo", required: true });
const item = (id, label, page, top, end, section, extra = {}) => narrative(id, label, { page, x: end + 0.006, y: top, w: Math.max(0.04, 0.875 - end - 0.006), h: 0.0145, section, fontSize: 9, required: true, ...extra });

const fields = [
    { ...header("date", "Date", 0.2395), type: "date" },
    header("for", "For", 0.2725),
    header("thru", "Thru", 0.3045),
    header("from", "From", 0.3375),
    header("subject", "Subject", 0.3915),
    item("history", "1.1 History of the chosen community", 0, 0.472, 0.643, "I. Brief Background"),
    item("physical-structure", "1.2 Physical structure of the community", 0, 0.488, 0.69, "I. Brief Background"),
    { ...blank("map", "1.3 Map of the community (from NU Fairview to the community)", { type: "image", x: 0.846, y: 0.5045, w: 0.03, h: 0.0145, section: "I. Brief Background", required: true }), render: { sheet: true } },
    item("chosen-need", "1.4 Chosen need in the community (based on the community interview)", 0, 0.537, 0.339, "I. Brief Background"),
    item("objectives", "2.1 Objectives of the proposed project", 0, 0.603, 0.682, "II. Details"),
    item("summary", "2.2 Summary of the proposed project", 0, 0.619, 0.659, "II. Details"),
    item("sdgs", "2.3 UN SDG(s) aligned with the proposed project", 0, 0.636, 0.777, "II. Details"),
    item("core-values", "2.4 NU core values aligned with the proposed project", 0, 0.652, 0.845, "II. Details"),
    grid("time-frame", "2.5 Proposed time frame of project implementation", {
        rowLines: [0.7187, 0.7357, 0.7526, 0.7695, 0.7868], section: "II. Details", fontSize: 9,
        columns: [{ key: "when", label: "Date and time", x: 0.253, w: 0.187 }, { key: "tasks", label: "Tasks to accomplish", x: 0.446, w: 0.423 }],
    }),
    grid("materials", "2.6 Materials needed", {
        rowLines: [0.8553, 0.8723, 0.8892, 0.9061, 0.9231], section: "II. Details", fontSize: 9,
        columns: [{ key: "item", label: "Item", x: 0.253, w: 0.437 }, { key: "quantity", label: "Quantity", type: "number", x: 0.696, w: 0.173 }],
    }),
    item("target-participants", "2.7 Target participants for the proposed project", 0, 0.939, 0.802, "II. Details"),
    item("venue", "2.8 Proposed venue for the project", 1, 0.194, 0.637, "II. Details"),
    grid("committees", "2.9 Committees-in-charge", {
        page: 1, rowLines: [0.2771, 0.294, 0.311, 0.3279, 0.3448, 0.3618], section: "II. Details", fontSize: 9,
        columns: [{ key: "names", label: "Names", x: 0.253, w: 0.365 }, { key: "roles", label: "Roles", x: 0.624, w: 0.245 }],
    }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-018-en.pdf": { pageCount: 2, fields } };
