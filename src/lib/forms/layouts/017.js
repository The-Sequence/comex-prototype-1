/* Form 017 — Survey consent and community needs survey (Filipino only).
 * Three pages: [0] consent with one "[ ]" agreement box, name, signature
 * and date; [1] three items and [2] six items, each a 7-point scale whose
 * instruction is "Pakibilugan" (encircle): the ring is centred on the
 * measured printed digit. Legacy scales s2-s10 match these nine items in
 * order with the same values, so they are aliased, as are c1 and f1-f3. */
import { blank, onLine } from "./helpers.js";

const DIGITS = [0.177, 0.235, 0.294, 0.353, 0.412, 0.471, 0.53];
const RING = 0.03;
const ringHeight = (RING * 612) / 1.6 / 792;

function scale(id, label, page, digitTop, section) {
    const cy = digitTop + 0.0095;
    return {
        id, label, type: "scale", page, section, required: true,
        xFraction: 0.16, yFraction: +(cy - 0.012).toFixed(4), widthFraction: 0.4, heightFraction: 0.024,
        options: DIGITS.map((x, index) => ({
            id: String(index + 1), value: String(index + 1), label: String(index + 1), page, mark: "ring", targetAnchor: "top-left",
            xFraction: +(x + 0.0055 - RING / 2).toFixed(4), yFraction: +(cy - ringHeight / 2).toFixed(4), widthFraction: RING, heightFraction: +ringHeight.toFixed(4),
        })),
    };
}

const fields = [
    blank("consent", "Naiintindihan ko ang mga layunin ng survey at ako ay sumasang-ayon na lumahok nang boluntaryo.", { type: "checkbox", x: 0.117, y: 0.5855, w: 0.014, h: 0.0125, section: "Pahintulot", required: true }),
    onLine("name", "Pangalan", { x: 0.215, w: 0.273, textTop: 0.647, textHeight: 0.015, section: "Pahintulot", required: true }),
    onLine("signature", "Lagda (Signature)", { type: "signature", x: 0.672, w: 0.131, textTop: 0.647, textHeight: 0.015, section: "Pahintulot", required: true }),
    onLine("date", "Petsa (Date)", { type: "date", x: 0.242, w: 0.273, textTop: 0.666, textHeight: 0.015, section: "Pahintulot", required: true }),
    scale("tutorial", "1. Edukasyon — Tutorial Programs", 1, 0.648, "1. Pangangailangan sa Edukasyon"),
    scale("literacy", "1. Edukasyon — Literacy and Numeracy Programs", 1, 0.735, "1. Pangangailangan sa Edukasyon"),
    scale("skills-training", "2. Karagdagang Kaalaman — Skills Training", 1, 0.857, "2. Pangangailangan sa Karagdagang Kaalaman"),
    scale("livelihood", "2. Karagdagang Kaalaman — Livelihood workshops", 2, 0.197, "2. Pangangailangan sa Karagdagang Kaalaman"),
    scale("green-space", "3. Kalikasan — Pagpapalawak ng Luntiang Espasyo", 2, 0.321, "3. Pangangailangan sa Kalikasan at Kapaligiran"),
    scale("urban-gardening", "3. Kalikasan — Urban Gardening", 2, 0.426, "3. Pangangailangan sa Kalikasan at Kapaligiran"),
    scale("beautification", "3. Kalikasan — Tulong sa Pagpapaganda ng Komunidad", 2, 0.53, "3. Pangangailangan sa Kalikasan at Kapaligiran"),
    scale("mental-health", "4. Kalusugan — Mental Health and Wellness Program", 2, 0.673, "4. Pangangailangan sa Kalusugan"),
    scale("hygiene", "4. Kalusugan — Health and Hygiene Campaigns", 2, 0.76, "4. Pangangailangan sa Kalusugan"),
].map((field, order) => ({ ...field, order }));

const ALIASES = { c1: "consent", f1: "name", f2: "signature", f3: "date", s2: "tutorial", s3: "literacy", s4: "skills-training", s5: "livelihood", s6: "green-space", s7: "urban-gardening", s8: "beautification", s9: "mental-health", s10: "hygiene" };

export default { "comex-form-017-fil.pdf": { pageCount: 3, fields, aliases: ALIASES } };
