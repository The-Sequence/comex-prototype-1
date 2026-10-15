/* Form 001 — Community engagement proposal. Three pages.
 * Page 1: category boxes (measured cell rulings), title, background and
 * details outline. The outline prints headings without answer space, so
 * each narrative gets the room left on its heading line and a labelled
 * continuation sheet. Location photos and map have no printed space at all:
 * they always go on continuation sheets (render.sheet), never over wording.
 * Page 2: duration, budget table (5 rows + total), transport, work plan
 * (6 printed rows). Page 3: approval signatures and the office checklist
 * "to be accomplished by the COMEX/NSTP Office".
 * Legacy f1/f2 were free text on the shuttle Yes/No lines; they are not
 * aliased to the new choice and remain reviewable as freehand answers. */
import { blank, grid, narrative } from "./helpers.js";

const P1 = 0;
const P2 = 1;
const P3 = 2;
const r = (value) => +value.toFixed(4);

/* A tick centred in a measured box. */
const box = (id, label, page, x0, x1, top, bottom) => {
    const size = Math.min(0.016, (bottom - top) * 0.8);
    return { id, value: id, label, page, mark: "check", targetAnchor: "top-left", xFraction: r((x0 + x1) / 2 - size / 2), yFraction: r((top + bottom) / 2 - size / 2), widthFraction: r(size), heightFraction: r(size) };
};

const pointer = (id, label, page, x, top, w, section, extra = {}) => narrative(id, label, { page, x, y: top, w, h: 0.0145, section, fontSize: 9, ...extra });

const fields = [
    {
        id: "category", label: "I. Category of community engagement", type: "singleChoice", page: P1, section: "I. Category and Type", required: true,
        xFraction: 0.294, yFraction: 0.268, widthFraction: 0.412, heightFraction: 0.145,
        options: [
            box("institutional", "Institutional-driven Community Initiative", P1, 0.294, 0.345, 0.268, 0.286),
            box("college", "College-driven Initiative", P1, 0.294, 0.345, 0.286, 0.304),
            box("extension-service", "Extension Service", P1, 0.294, 0.345, 0.395, 0.413),
        ],
    },
    {
        id: "engagement-type", label: "I. Type of community engagement", type: "singleChoice", page: P1, section: "I. Category and Type", required: true,
        xFraction: 0.405, yFraction: 0.322, widthFraction: 0.414, heightFraction: 0.145,
        options: [
            box("extension-program", "Community Extension Program", P1, 0.407, 0.459, 0.322, 0.341),
            box("seminar", "Seminar/Workshop/Training", P1, 0.407, 0.459, 0.341, 0.359),
            box("other-program", "Others (please specify) — under the initiatives", P1, 0.407, 0.459, 0.359, 0.377),
            box("outreach", "Outreach Project", P1, 0.405, 0.457, 0.431, 0.449),
            box("other-service", "Others (please specify) — under Extension Service", P1, 0.405, 0.457, 0.449, 0.467),
        ],
    },
    { ...blank("engagement-type-other-program", "Others (please specify) — initiative type", { page: P1, x: 0.68, y: 0.36, w: 0.135, h: 0.016, section: "I. Category and Type", fontSize: 9 }), visibleWhen: { fieldId: "engagement-type", operator: "equals", value: "other-program" } },
    { ...blank("engagement-type-other-service", "Others (please specify) — extension service type", { page: P1, x: 0.678, y: 0.4505, w: 0.135, h: 0.016, section: "I. Category and Type", fontSize: 9 }), visibleWhen: { fieldId: "engagement-type", operator: "equals", value: "other-service" } },

    { ...narrative("title", "II. Title of the Community Engagement", { page: P1, x: 0.405, y: 0.4845, w: 0.535, h: 0.0165, section: "II. Title", required: true }), type: "text" },
    pointer("community-description", "III.A. Brief Description of the Chosen Community/Stakeholders/Participants", P1, 0.665, 0.5535, 0.275, "III. Background", { required: true }),
    { ...blank("target-number", "III.B. Target Number of Community/Stakeholders/Participants", { page: P1, type: "number", x: 0.64, y: 0.5675, w: 0.3, h: 0.0165, section: "III. Background", required: true }) },
    { ...blank("img-location-photos", "III.C. Photos of the location of the chosen community", { page: P1, type: "image", x: 0.682, y: 0.6015, w: 0.258, h: 0.0135, section: "III. Background" }), render: { sheet: true } },
    { ...blank("img-map-screenshot", "III.D. Map screenshot (Google Maps, NU Fairview to the community)", { page: P1, type: "image", x: 0.79, y: 0.6155, w: 0.15, h: 0.0145, section: "III. Background" }), render: { sheet: true } },
    pointer("community-issues", "III.E. Issues in the Community/Issues Faced by the Stakeholders/Participants", P1, 0.692, 0.6625, 0.248, "III. Background", { required: true }),
    pointer("rationale", "III.F. Rationale for Choosing the Chosen Community/Stakeholders/Participants", P1, 0.783, 0.6765, 0.157, "III. Background", { required: true }),

    pointer("engagement-description", "IV.A. Brief Description of the Community Engagement", P1, 0.566, 0.7465, 0.374, "IV. Details", { required: true }),
    pointer("objectives", "IV.B. Objectives of the Community Engagement", P1, 0.514, 0.7635, 0.426, "IV. Details", { required: true }),
    pointer("sustainability", "IV.C. Sustainability of the Community Engagement", P1, 0.538, 0.7805, 0.402, "IV. Details", { required: true }),
    pointer("sdg-core-values", "IV.D. Aligned UN Sustainable Development Goals and National University Core Values", P1, 0.852, 0.7985, 0.088, "IV. Details", { required: true }),
    pointer("implementer", "IV.E. Implementer/Facilitator (main proponent; school or department)", P1, 0.874, 0.8185, 0.066, "IV. Details", { required: true }),
    { ...blank("program-head", "IV.F.1. Program Head", { page: P1, x: 0.35, y: 0.8675, w: 0.59, h: 0.0165, section: "IV.F. Management Team", required: true }) },
    pointer("committees", "IV.F.2. Program Committees and Members", P1, 0.532, 0.8855, 0.408, "IV.F. Management Team", { required: true }),

    pointer("cooperating-agencies", "IV.G. Cooperating Agencies/Schools/Departments", P2, 0.534, 0.1415, 0.406, "IV. Details"),
    { ...blank("start-date", "IV.H.1. Date of the Start of the Community Engagement", { page: P2, type: "date", x: 0.641, y: 0.1935, w: 0.299, h: 0.0165, section: "IV.H. Duration", required: true }) },
    { ...blank("end-date", "IV.H.2. Date of the End of the Community Engagement", { page: P2, type: "date", x: 0.635, y: 0.2115, w: 0.305, h: 0.0165, section: "IV.H. Duration", required: true }) },
    { ...blank("actual-budget", "V.A. Actual Budget", { page: P2, type: "currency", x: 0.27, y: 0.2805, w: 0.3, h: 0.0165, section: "V. Budget", required: true }) },
    {
        ...grid("budget-breakdown", "V.B. Breakdown of Actual Budget", {
            page: P2, section: "V. Budget", fontSize: 10,
            rowLines: [0.3679, 0.3859, 0.4048, 0.4228, 0.4411, 0.4591],
            columns: [
                { key: "materials", label: "Materials needed", x: 0.131, w: 0.147 },
                { key: "quantity", label: "Quantity", type: "number", x: 0.284, w: 0.147 },
                { key: "price", label: "Price per quantity", type: "currency", x: 0.437, w: 0.147 },
                { key: "amount", label: "Amount", type: "currency", x: 0.59, w: 0.146 },
                { key: "purpose", label: "Purpose", x: 0.743, w: 0.146 },
            ],
        }),
    },
    // Entered by the user; never computed from the rows.
    { ...blank("budget-total", "V.B. Total Amount", { page: P2, type: "currency", x: 0.59, y: 0.4597, w: 0.146, h: 0.0165, section: "V. Budget", fontSize: 10 }) },
    pointer("budget-source", "V.C. Source of Budget (office the budget comes from)", P2, 0.637, 0.4925, 0.303, "V. Budget", { required: true }),
    { ...blank("transport-mode", "VI.A. Mode of Transportation", { page: P2, x: 0.355, y: 0.5595, w: 0.585, h: 0.0165, section: "VI. Transportation", required: true }) },
    {
        id: "shuttle", label: "VI.B. Are you going to use NU Fairview's shuttle?", type: "singleChoice", page: P2, section: "VI. Transportation", required: true,
        xFraction: 0.118, yFraction: 0.577, widthFraction: 0.585, heightFraction: 0.016,
        options: [box("yes", "Yes", P2, 0.559, 0.614, 0.577, 0.592), box("no", "No", P2, 0.645, 0.7, 0.577, 0.592)],
    },
    {
        ...grid("work-plan", "VII. Program Work Plan", {
            page: P2, section: "VII. Work Plan", fontSize: 9,
            rowLines: [0.7544, 0.7723, 0.7903, 0.8083, 0.8266, 0.8446, 0.8627],
            columns: [
                { key: "phase", label: "Phase of the project (date)", x: 0.169, w: 0.128 },
                { key: "activities", label: "Activities", x: 0.303, w: 0.121 },
                { key: "output", label: "Output / target", x: 0.43, w: 0.121 },
                { key: "person", label: "Person in charge", x: 0.558, w: 0.121 },
                { key: "materials", label: "Materials needed", x: 0.685, w: 0.145 },
            ],
        }),
    },

    { ...blank("prepared-by-signature", "VIII. Prepared by: Project Head (signature)", { page: P3, type: "signature", x: 0.08, y: 0.197, w: 0.4, h: 0.031, section: "VIII. Approval Sheet" }) },
    { ...blank("endorsed-by-signature", "VIII. Endorsed by: COMEX Representative/Program Chairperson/School Dean (signature)", { page: P3, type: "signature", x: 0.52, y: 0.197, w: 0.4, h: 0.031, section: "VIII. Approval Sheet" }) },
    { ...blank("recommending-approval-signature", "VIII. Recommending approval: Community Extension and NSTP Office Head (signature)", { page: P3, type: "signature", x: 0.3, y: 0.302, w: 0.4, h: 0.031, section: "VIII. Approval Sheet" }) },
    {
        id: "approving-offices", label: "VIII. Offices that need to sign and approve (to be accomplished by the COMEX/NSTP Office)", type: "multiChoice", page: P3, section: "Office use",
        xFraction: 0.08, yFraction: 0.432, widthFraction: 0.86, heightFraction: 0.052,
        options: [
            box("academic-services", "Office of the Academic Services Director", P3, 0.081, 0.095, 0.437, 0.448),
            box("senior-academic", "Office of the Senior Academic Director", P3, 0.543, 0.558, 0.437, 0.448),
            box("administrative-services", "Office of the Administrative Services Director", P3, 0.081, 0.096, 0.472, 0.483),
            box("executive", "Office of the Executive Director", P3, 0.543, 0.558, 0.472, 0.483),
        ],
    },
].map((field, order) => ({ ...field, order }));

export default { "comex-form-001-en.pdf": { pageCount: 3, fields } };
