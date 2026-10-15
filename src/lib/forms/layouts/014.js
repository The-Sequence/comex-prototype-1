/* Form 014 — Capacity-building services report. One page.
 * Event details on their heading lines (narratives continue on sheets),
 * before/during/after photos on labelled sheets (no printed photo space),
 * the measured 3-row personnel grid, approvals above each printed role, and
 * "attached" ticks for the two documentary attachments. */
import { blank, grid, narrative } from "./helpers.js";

const photo = (id, label, x) => ({ ...blank(id, label, { type: "image", x, y: 0.3635, w: 0.15, h: 0.0145, section: "III. Photos", required: true }), render: { sheet: true } });

const fields = [
    { ...blank("title", "I. Title of the Event", { x: 0.233, y: 0.19, w: 0.707, h: 0.0165, section: "I. Event", required: true }) },
    narrative("description", "II.A. Brief Description of the Event", { x: 0.4, y: 0.2415, w: 0.54, h: 0.0165, section: "II. Background", required: true }),
    narrative("implementer", "II.B. Implementer/Facilitator of the Event (main proponent; school or department)", { x: 0.846, y: 0.2615, w: 0.094, h: 0.0145, section: "II. Background", required: true, fontSize: 9 }),
    { ...blank("venue", "II.C. Venue of the Event", { x: 0.315, y: 0.2765, w: 0.625, h: 0.0165, section: "II. Background", required: true }) },
    { ...blank("start-date", "II.D.1. Date of the Start of the Event", { type: "date", x: 0.476, y: 0.3115, w: 0.3, h: 0.0165, section: "II.D. Duration", required: true }) },
    { ...blank("end-date", "II.D.2. Date of the End of the Event", { type: "date", x: 0.47, y: 0.3285, w: 0.3, h: 0.0165, section: "II.D. Duration", required: true }) },
    photo("photo-before", "III. Photo before the event", 0.462),
    photo("photo-during", "III. Photo during the event", 0.621),
    photo("photo-after", "III. Photo after the event", 0.78),
    grid("personnel", "IV. Personnel involved and Equivalent Hours", {
        rowLines: [0.4519, 0.4702, 0.4882, 0.5061], section: "IV. Personnel", fontSize: 10,
        columns: [{ key: "name", label: "Name of personnel", x: 0.062, w: 0.287 }, { key: "role", label: "Role", x: 0.356, w: 0.287 }, { key: "hours", label: "Equivalent hours", type: "number", x: 0.65, w: 0.287 }],
    }),
    blank("prepared-by-signature", "V. Prepared by: Project Head (signature)", { type: "signature", x: 0.08, y: 0.579, w: 0.4, h: 0.031, section: "V. Approval Sheet" }),
    blank("endorsed-by-signature", "V. Endorsed by: COMEX Representative/Program Chairperson/School Dean (signature)", { type: "signature", x: 0.52, y: 0.579, w: 0.4, h: 0.031, section: "V. Approval Sheet" }),
    blank("approved-by-signature", "V. Approved by: Community Extension and NSTP Office Head (signature)", { type: "signature", x: 0.3, y: 0.684, w: 0.4, h: 0.0145, section: "V. Approval Sheet" }),
    blank("attached-proposal", "VI. Attached: 1. Approved Proposal", { type: "checkbox", x: 0.096, y: 0.7705, w: 0.016, h: 0.014, section: "VI. Documentary Attachments" }),
    blank("attached-end-report", "VI. Attached: 2. End Activity Report", { type: "checkbox", x: 0.096, y: 0.7895, w: 0.016, h: 0.014, section: "VI. Documentary Attachments" }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-014-en.pdf": { pageCount: 1, fields } };
