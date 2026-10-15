/* Form 010 — Attendance sheet. One page.
 * Event / time-and-date underlines measured from the underscore runs; the
 * table is the printed 20-row grid (rulings at 0.2406 … 0.9068), columns
 * Name | School/Department | Signature. IDs match the earlier override, so
 * existing drafts keep their answers. */
import { grid, onLine } from "./helpers.js";

const ROW_LINES = [0.2406, 0.2741, 0.3072, 0.3407, 0.3739, 0.4073, 0.4405, 0.4736, 0.5071, 0.5402, 0.5737, 0.6069, 0.6403, 0.6735, 0.707, 0.7401, 0.7736, 0.8068, 0.8402, 0.8734, 0.9068];

const fields = [
    { ...onLine("event", "Event", { x: 0.169, w: 0.396, textTop: 0.172, textHeight: 0.015, section: "event", required: true }), order: 0 },
    { ...onLine("timedate", "Time & date", { x: 0.696, w: 0.22, textTop: 0.172, textHeight: 0.015, section: "event", required: true }), order: 1 },
    {
        ...grid("attendance", "Attendance", {
            rowLines: ROW_LINES,
            section: "attendance",
            columns: [
                // The printed row number occupies the first 0.04 of the Name cell.
                { key: "name", label: "Name", x: 0.142, w: 0.324 },
                { key: "department", label: "School / Department", x: 0.477, w: 0.231 },
                { key: "signature", label: "Signature", type: "signature", x: 0.718, w: 0.199 },
            ],
        }),
        order: 2,
    },
];

export default { "comex-form-010-en.pdf": { pageCount: 1, fields } };
