/* Form 013 — End of community engagement and terminal report. One page.
 * Narratives II/III print "you may use another sheet": they point to
 * continuation sheets. IV prints no photo space, so before/during/after
 * photos each go on their own labelled sheet. V and VI are the measured
 * 5-row expenses and 3-row personnel grids; VII approvals use the space
 * above each printed role. */
import { blank, grid, narrative } from "./helpers.js";

const photo = (id, label, x) => ({ ...blank(id, label, { type: "image", x, y: 0.2415, w: 0.1, h: 0.0145, section: "IV. Photos", required: true }), render: { sheet: true } });

const fields = [
    { ...blank("title", "I. Title of the Community Engagement", { x: 0.4, y: 0.19, w: 0.54, h: 0.0165, section: "I-III", required: true }) },
    narrative("executive-summary", "II. Executive Summary (include the results of the evaluation)", { x: 0.866, y: 0.2105, w: 0.074, h: 0.0145, section: "I-III", required: true, fontSize: 9 }),
    narrative("conclusion", "III. Conclusion and Recommendations", { x: 0.695, y: 0.2265, w: 0.245, h: 0.0145, section: "I-III", required: true, fontSize: 9 }),
    photo("photo-before", "IV. Photo before the community engagement", 0.625),
    photo("photo-during", "IV. Photo during the community engagement", 0.73),
    photo("photo-after", "IV. Photo after the community engagement", 0.835),
    grid("expenses", "V.A. Breakdown of Expenses", {
        rowLines: [0.3461, 0.3641, 0.3821, 0.4001, 0.4181, 0.4364], section: "V. Budget", fontSize: 10,
        columns: [{ key: "materials", label: "Materials used", x: 0.131, w: 0.202 }, { key: "amount", label: "Amount", type: "currency", x: 0.339, w: 0.226 }],
    }),
    { ...blank("expenses-total", "V. Total", { type: "currency", x: 0.339, y: 0.4369, w: 0.226, h: 0.0165, section: "V. Budget", fontSize: 10 }), total: { kind: "sum", tableId: "expenses", column: "amount" } },
    grid("personnel", "VI. Personnel involved and Equivalent Hours", {
        rowLines: [0.5216, 0.5396, 0.5576, 0.5759], section: "VI. Personnel", fontSize: 10,
        columns: [{ key: "name", label: "Name of personnel", x: 0.062, w: 0.287 }, { key: "role", label: "Role", x: 0.356, w: 0.287 }, { key: "hours", label: "Equivalent hours", type: "number", x: 0.65, w: 0.287 }],
    }),
    blank("prepared-by-signature", "VII. Prepared by: Project Head (signature)", { type: "signature", x: 0.08, y: 0.648, w: 0.4, h: 0.031, section: "VII. Approval Sheet" }),
    blank("endorsed-by-signature", "VII. Endorsed by: COMEX Representative/Program Chairperson/School Dean (signature)", { type: "signature", x: 0.52, y: 0.648, w: 0.4, h: 0.031, section: "VII. Approval Sheet" }),
    blank("approved-by-signature", "VII. Approved by: Community Extension and NSTP Office Head (signature)", { type: "signature", x: 0.3, y: 0.7535, w: 0.4, h: 0.015, section: "VII. Approval Sheet" }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-013-en.pdf": { pageCount: 1, fields } };
