/* Form 016 — Consent form and needs-assessment interview questions.
 * One file, four physical pages: [0] English consent (595.5×842 page),
 * [1] English questions, [2] Filipino consent, [3] Filipino questions.
 * There is no separate Filipino PDF; both languages are mapped here with
 * en-/fil- IDs. Recording consent is one exclusive choice per language,
 * ticked inside the printed "[ ]". Interview questions print no answer
 * space: each answer starts at the end of its question's last printed line
 * and continues on a labelled continuation sheet. Aliases follow the
 * earlier scanner fields (f1-f6); its separate checkboxes c1-c4 are not
 * aliased because they are now one exclusive choice. */
import { blank, narrative, onLine } from "./helpers.js";

const mark = (id, label, page, x, top) => ({ id, value: id, label, page, mark: "check", targetAnchor: "top-left", xFraction: x, yFraction: top, widthFraction: 0.014, heightFraction: 0.012 });

// [id suffix, printed number, question, last line top, last line end x]
const EN_QUESTIONS = [
    ["roles", "A.1", "What are your roles in your community or organization?", 0.239, 0.691],
    ["serving-length", "A.2", "How long have you been serving in your community or organization?", 0.263, 0.801],
    ["serving-reason", "A.3", "What is the main reason for serving your community or organization?", 0.288, 0.807],
    ["challenges", "B.1", "What are the challenges/problems that your community or organization is facing?", 0.359, 0.887],
    ["challenges-duration", "B.1.1", "How long have these challenges/problems been existing?", 0.383, 0.743],
    ["challenges-evidence", "B.1.2", "Do you have any information or data that demonstrate the extent and seriousness of these challenges/problems?", 0.434, 0.62],
    ["solutions", "B.2", "What are your ways of solving the challenges/problems of your community or organization?", 0.478, 0.33],
    ["evaluation", "B.2.1", "How do you evaluate the effectiveness of your programs for your community or organization?", 0.529, 0.485],
    ["future-projects", "B.2.2", "What are your future projects/programs for your community or organization?", 0.552, 0.889],
    ["short-term-goals", "B.2.3", "What are your short-term goals in your community or organization?", 0.577, 0.819],
    ["long-term-goals", "B.2.4", "What are your long-term goals in your community or organization?", 0.601, 0.813],
    ["suggestions", "C.1", "What are your suggestions to improve the projects or programs in your community?", 0.694, 0.321],
    ["aspirations", "C.2", "What are your aspirations for your community?", 0.711, 0.616],
];

const FIL_QUESTIONS = [
    ["roles", "A.1", "Ano ang iyong tungkulin sa iyong komunidad o organisasyon?", 0.235, 0.773],
    ["serving-length", "A.2", "Gaano ka na katagal kabahagi/naglilingkod sa iyong komunidad o organisasyon?", 0.287, 0.363],
    ["serving-reason", "A.3", "Ano ang pangunahing dahilan kung bakit ka naglilingkod sa iyong komunidad o organisasyon?", 0.34, 0.48],
    ["challenges", "B.1", "Ano ang mga hamon na kinakaharap ng iyong komunidad o organisasyon?", 0.405, 0.886],
    ["challenges-duration", "B.1.1", "Gaano na ninyo katagal kinakaharap ang mga hamong ito?", 0.431, 0.779],
    ["challenges-evidence", "B.1.2", "Mayroon ba kayong mga impormasyon o halimbawa na magpapakita kung gaano kalaki ang mga problemang ito?", 0.483, 0.651],
    ["solutions", "B.2", "Ano ang inyong mga paraan sa paglutas ng mga problema kinakaharap ng inyong komunidad o organisasyon?", 0.535, 0.543],
    ["evaluation", "B.2.1", "Paano ninyo sinusuri ang pagiging epektibo ng inyong mga programa para sa komunidad o organisasyon?", 0.588, 0.581],
    ["future-projects", "B.2.2", "Ano ang inyong mga planong proyekto o programa para sa inyong komunidad o organisasyon sa hinaharap?", 0.64, 0.629],
    ["short-term-goals", "B.2.3", "Ano ang inyong mga panandaliang layunin o nais marating ng inyong komunidad o organisasyon?", 0.692, 0.51],
    ["long-term-goals", "B.2.4", "Ano ang inyong mga pangmatagalang layunin o nais marating ng inyong komunidad o organisasyon?", 0.745, 0.573],
    ["suggestions", "D.1", "Ano ang inyong mga mungkahi upang mapabuti ang mga proyekto o programa sa inyong komunidad?", 0.823, 0.521],
    ["aspirations", "D.2", "Ano ang iyong pangarap para sa inyong komunidad?", 0.849, 0.695],
];

const questions = (lang, page, list, section) => list.map(([id, number, question, top, end]) =>
    narrative(`${lang}-${id}`, `${number}. ${question}`, { page, x: end + 0.006, y: top, w: Math.max(0.04, 0.94 - end - 0.006), h: 0.0145, section, fontSize: 9 }));

const fields = [
    {
        id: "en-recording-consent", label: "IV. Use of Audio/Video Recording (check one)", type: "singleChoice", page: 0, section: "English consent", required: true,
        xFraction: 0.14, yFraction: 0.62, widthFraction: 0.74, heightFraction: 0.075,
        options: [mark("consent", "I consent to the recording of our conversation", 0, 0.143, 0.624), mark("no-consent", "I do not consent to the recording of our conversation", 0, 0.143, 0.68)],
    },
    onLine("en-respondent-name", "Respondent's name", { page: 0, x: 0.334, w: 0.281, textTop: 0.821, textHeight: 0.014, section: "English consent", required: true }),
    onLine("en-signature", "Signature", { page: 0, type: "signature", x: 0.718, w: 0.157, textTop: 0.821, textHeight: 0.014, section: "English consent", required: true }),
    onLine("en-date", "Date", { page: 0, type: "date", x: 0.195, w: 0.203, textTop: 0.84, textHeight: 0.014, section: "English consent", required: true }),
    blank("en-community-name", "Name of the Community", { page: 1, x: 0.355, y: 0.1785, w: 0.585, h: 0.0165, section: "English interview", required: true }),
    ...questions("en", 1, EN_QUESTIONS, "English interview"),
    {
        id: "fil-recording-consent", label: "IV. Paggamit ng Audio/Video Recording (pakilagyan ng tsek)", type: "singleChoice", page: 2, section: "Pahintulot (Filipino)", required: false,
        xFraction: 0.115, yFraction: 0.667, widthFraction: 0.775, heightFraction: 0.075,
        options: [mark("consent", "Ako ay pumapayag na i-record ang aming pag-uusap", 2, 0.12, 0.6715), mark("no-consent", "Ako ay hindi pumapayag na i-record ang aming pag-uusap", 2, 0.12, 0.7245)],
    },
    onLine("fil-respondent-name", "Pangalan ng respondente", { page: 2, x: 0.359, w: 0.274, textTop: 0.846, textHeight: 0.015, section: "Pahintulot (Filipino)" }),
    onLine("fil-signature", "Lagda", { page: 2, type: "signature", x: 0.703, w: 0.153, textTop: 0.846, textHeight: 0.015, section: "Pahintulot (Filipino)" }),
    onLine("fil-date", "Petsa", { page: 2, type: "date", x: 0.176, w: 0.198, textTop: 0.866, textHeight: 0.015, section: "Pahintulot (Filipino)" }),
    blank("fil-community-name", "Pangalan ng Komunidad", { page: 3, x: 0.36, y: 0.1805, w: 0.58, h: 0.0165, section: "Panayam (Filipino)" }),
    ...questions("fil", 3, FIL_QUESTIONS, "Panayam (Filipino)"),
].map((field, order) => ({ ...field, order }));

export default { "comex-form-016-en.pdf": { pageCount: 4, fields, aliases: { f1: "en-respondent-name", f2: "en-signature", f3: "en-date", f4: "fil-respondent-name", f5: "fil-signature", f6: "fil-date" } } };
