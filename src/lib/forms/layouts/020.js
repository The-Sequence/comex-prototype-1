/* Form 020 — NSTP community service materials request. One page.
 * Student/group details on their underlines; a 10-row Item / Quantity /
 * Date needed grid; signatures in the space above each printed caption.
 * The printed approver's name is kept; only a signature is collected. */
import { blank, grid, onLine } from "./helpers.js";

const detail = (id, label, x, w, textTop, extra = {}) => onLine(id, label, { x, w, textTop, textHeight: 0.018, section: "A. Student/Group Information", required: true, ...extra });

const fields = [
    detail("project-title", "Project title", 0.291, 0.348, 0.232),
    detail("section", "NSTP section/class", 0.366, 0.271, 0.256),
    detail("group-leader", "Group leader/assistant leader", 0.473, 0.162, 0.279),
    detail("contact-number", "Contact number", 0.335, 0.301, 0.302, { type: "tel" }),
    detail("professor", "NSTP 2 professor", 0.346, 0.294, 0.326),
    grid("materials", "B. Materials request", {
        rowLines: [0.4632, 0.4853, 0.5074, 0.5298, 0.552, 0.5744, 0.5965, 0.6186, 0.641, 0.6631, 0.6852], section: "B. Materials Request", required: true, fontSize: 10,
        columns: [{ key: "item", label: "Item description", x: 0.162, w: 0.372 }, { key: "quantity", label: "Quantity", type: "number", x: 0.542, w: 0.091 }, { key: "date-needed", label: "Date needed", type: "date", x: 0.641, w: 0.237 }],
    }),
    blank("requested-by-signature", "Requested by (signature over printed name of group leader)", { type: "signature", x: 0.094, y: 0.738, w: 0.383, h: 0.038, section: "Signatures", required: true }),
    blank("recommended-by-signature", "Recommended for approval (signature over printed name of NSTP instructor)", { type: "signature", x: 0.094, y: 0.828, w: 0.399, h: 0.038, section: "Signatures" }),
    blank("approved-by-signature", "Approved by: NSTP Coordinator (signature)", { type: "signature", x: 0.602, y: 0.738, w: 0.3, h: 0.038, section: "Signatures" }),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-020-en.pdf": { pageCount: 1, fields, aliases: { f1: "project-title", f2: "section", f3: "group-leader", f4: "contact-number", f5: "professor" } } };
