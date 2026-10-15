/* Form 021 — Community service daily time record. One page (595.5×842).
 * Header values sit in their measured cells; the 10-row grid is
 * Date | Time-in | Time-out | Name | Designation | Signature. TOTAL HOURS is
 * an explicit calculation from time-in/time-out (incomplete or negative
 * intervals are reported, never guessed) that the user applies or overrides. */
import { blank, grid } from "./helpers.js";

const fields = [
    blank("student-name", "Name of student", { x: 0.272, y: 0.1935, w: 0.15, h: 0.0175, section: "Student", required: true, fontSize: 9 }),
    blank("term-section", "Term, AY, section", { x: 0.592, y: 0.1935, w: 0.188, h: 0.0175, section: "Student", required: true, fontSize: 9 }),
    blank("group-number", "Group #", { x: 0.863, y: 0.1935, w: 0.04, h: 0.0175, section: "Student", required: true, fontSize: 9 }),
    blank("community", "Name of the chosen community", { x: 0.406, y: 0.2215, w: 0.19, h: 0.0175, section: "Student", required: true, fontSize: 9 }),
    blank("point-person", "Point person", { x: 0.725, y: 0.2215, w: 0.178, h: 0.0175, section: "Student", required: true, fontSize: 9 }),
    grid("time-record", "Daily time record", {
        rowLines: [0.2884, 0.3145, 0.3407, 0.3668, 0.3932, 0.4202, 0.4473, 0.4743, 0.5016, 0.5286, 0.5557], section: "Time record", required: true, fontSize: 9,
        columns: [
            { key: "date", label: "Date", type: "date", x: 0.102, w: 0.074, fontSize: 7.5 },
            { key: "time-in", label: "Time-in", type: "time", x: 0.181, w: 0.113 },
            { key: "time-out", label: "Time-out", type: "time", x: 0.3, w: 0.113 },
            { key: "name", label: "Name", x: 0.419, w: 0.179 },
            { key: "designation", label: "Designation", x: 0.604, w: 0.167 },
            { key: "signature", label: "Signature", type: "signature", x: 0.777, w: 0.124 },
        ],
    }),
    { ...blank("total-hours", "Total hours", { type: "number", x: 0.3, y: 0.5585, w: 0.29, h: 0.0175, section: "Time record", fontSize: 10 }), total: { kind: "hours", tableId: "time-record", timeIn: "time-in", timeOut: "time-out" } },
].map((field, order) => ({ ...field, order }));

export default { "comex-form-021-en.pdf": { pageCount: 1, fields } };
