/* ---------------------------------------------------------------- START:
 * formFieldRenderPlan — one measured layout for preview AND export.
 *
 * Coordinates in the plan are PDF points measured from the TOP-left of the
 * page (DOM convention); the exporter flips Y. Text is wrapped to the field's
 * width and bounded by its height. Overflow is never clipped silently:
 *   render.overflow "error" (default)  -> an error issue blocks export;
 *   render.overflow "continuation"     -> the page keeps a pointer line and
 *                                         the full answer goes to a labelled
 *                                         continuation sheet, appended only
 *                                         when the user explicitly accepts.
 * Hidden conditional answers stay stored but are not rendered. Answers with
 * no matching definition (freehand, legacy) still render; answers on pages
 * the PDF lacks are reported rather than dropped.
 * ------------------------------------------------------------------------ */
import { isFieldVisible, readFieldAnswer } from "./formFieldAnswers.js";

const MIN_POINTER_FONT = 6;

export function fitImageRect(box, image) {
    if (!image?.width || !image?.height) return { ...box };
    const scale = box.height ? Math.min(box.width / image.width, box.height / image.height) : box.width / image.width;
    const width = image.width * scale;
    const height = image.height * scale;
    // Centered inside a bounded box; top-aligned when only the width is known.
    return { x: box.x + (box.width - width) / 2, y: box.height ? box.y + (box.height - height) / 2 : box.y, width, height };
}

export function wrapText(text, maxWidth, size, measure) {
    const lines = [];
    for (const paragraph of String(text).split(/\r?\n/)) {
        let line = "";
        for (const word of paragraph.split(/\s+/).filter(Boolean)) {
            const candidate = line ? `${line} ${word}` : word;
            if (measure(candidate, size) <= maxWidth) { line = candidate; continue; }
            if (line) lines.push(line);
            // A single word wider than the field is broken by characters.
            let rest = word;
            while (measure(rest, size) > maxWidth && rest.length > 1) {
                let cut = rest.length - 1;
                while (cut > 1 && measure(rest.slice(0, cut), size) > maxWidth) cut -= 1;
                lines.push(rest.slice(0, cut));
                rest = rest.slice(cut);
            }
            line = rest;
        }
        lines.push(line);
    }
    while (lines.length > 1 && lines.at(-1) === "") lines.pop();
    return lines;
}

export function buildFieldRenderPlan({ definitions = [], fields = [], pageSizes = [], fontMetrics }) {
    const byId = new Map(definitions.map(definition => [definition.id, definition]));
    const answers = Object.fromEntries(definitions.map(definition => [definition.id, readFieldAnswer({ definition, fields })]));
    const visibleCache = new Map();
    const visible = (definition, seen = new Set()) => {
        if (visibleCache.has(definition.id)) return visibleCache.get(definition.id);
        if (seen.has(definition.id)) return true;
        seen.add(definition.id);
        const parent = definition.visibleWhen && byId.get(definition.visibleWhen.fieldId);
        const result = isFieldVisible({ definition, answers }) && (!parent || visible(parent, seen));
        visibleCache.set(definition.id, result);
        return result;
    };
    const ownerOf = field => {
        if (!field.definitionId) return null;
        if (byId.has(field.definitionId)) return { definition: byId.get(field.definitionId) };
        const [tableId, , key] = field.definitionId.split(":");
        const table = byId.get(tableId);
        return table?.type === "table" ? { definition: table, column: table.columns?.find(column => column.key === key) } : null;
    };

    const placements = [];
    const pending = [];
    const issues = [];
    const hiddenFieldIds = [];
    for (const field of fields) {
        const owner = ownerOf(field);
        if (owner && !visible(owner.definition)) { hiddenFieldIds.push(field.id); continue; }
        const pageIndex = field.page ?? 0;
        const size = pageSizes[pageIndex];
        const label = field.label ?? owner?.definition.label ?? "Answer";
        if (!size) {
            issues.push({ code: "page-missing", severity: "error", fieldId: field.id, message: `"${label}" is placed on page ${pageIndex + 1}, which this PDF does not have.` });
            continue;
        }
        const base = { fieldId: field.id, definitionId: field.definitionId, page: pageIndex, field };
        const x = (field.xFraction ?? 0) * size.width;
        const top = (field.yFraction ?? 0) * size.height;
        const boundedHeight = owner ? (field.heightFraction ?? owner.definition.heightFraction) : undefined;

        // Pictures the printed form has no room for go to a labelled sheet; the page keeps a pointer line.
        if (field.imageUrl && owner?.definition.render?.sheet) {
            const width = (field.widthFraction ?? 0.25) * size.width;
            const fontSize = Math.min(field.fontSize ?? 11, 10);
            const placement = { ...base, kind: "text", box: { x, y: top, width, height: (boundedHeight ?? 0.02) * size.height }, lines: [], overflow: true };
            placements.push(placement);
            pending.push({ placement, field, label, lineHeight: fontMetrics.lineHeight(fontSize, field), fontSize, measure: (text, value) => fontMetrics.widthOfText(text, value, field), width, image: true });
            continue;
        }
        if (field.imageUrl) {
            placements.push({ ...base, kind: "image", box: { x, y: top, width: (field.widthFraction ?? 0.25) * size.width, height: boundedHeight ? boundedHeight * size.height : Math.max(0, size.height - top) } });
            continue;
        }
        if (field.mark) {
            placements.push({ ...base, kind: "mark", mark: field.mark, box: { x, y: top, width: (field.widthFraction ?? 0.03) * size.width } });
            continue;
        }
        if (!String(field.text ?? "").trim()) continue;

        const fontSize = field.fontSize ?? 11;
        const measure = (text, fontSizeValue) => fontMetrics.widthOfText(text, fontSizeValue, field);
        const lineHeight = fontMetrics.lineHeight(fontSize, field);
        const width = (field.widthFraction ?? 0.28) * size.width;
        const height = boundedHeight ? boundedHeight * size.height : size.height - top;
        const capacity = Math.max(1, Math.floor((height + 0.001) / lineHeight));
        let lines;
        try {
            lines = wrapText(field.text, width, fontSize, measure);
        } catch {
            // The PDF's standard font covers WinAnsi only; name the field and the characters instead of crashing.
            const bad = [...new Set([...String(field.text)].filter((character) => { try { measure(character, fontSize); return false; } catch { return true; } }))];
            issues.push({ code: "unsupported-characters", severity: "error", fieldId: field.id, definitionId: field.definitionId, page: pageIndex,
                message: `"${label}" on page ${pageIndex + 1} contains characters the form's font cannot print: ${bad.join(" ")}. Replace them (for example "PHP" for ₱).` });
            continue;
        }
        const toLines = (texts, fontSizeValue = fontSize) => texts.map((text, index) => ({ text, top: top + index * lineHeight, fontSize: fontSizeValue }));

        if (lines.length <= capacity) {
            placements.push({ ...base, kind: "text", box: { x, y: top, width, height }, lines: toLines(lines), overflow: false });
            continue;
        }
        const mode = owner?.column?.render?.overflow ?? owner?.definition.render?.overflow ?? "error";
        if (mode === "continuation") {
            const placement = { ...base, kind: "text", box: { x, y: top, width, height }, lines: toLines(lines.slice(0, capacity - 1)), overflow: true };
            placements.push(placement);
            pending.push({ placement, field, label, lineHeight, fontSize, measure, width });
            continue;
        }
        placements.push({ ...base, kind: "text", box: { x, y: top, width, height }, lines: toLines(lines.slice(0, capacity)), overflow: true });
        issues.push({ code: "text-overflow", severity: "error", fieldId: field.id, definitionId: field.definitionId, page: pageIndex,
            message: `"${label}" on page ${pageIndex + 1} does not fit its printed space (${lines.length} lines, room for ${capacity}). Shorten the answer${owner ? "" : " or resize the box"}.` });
    }

    // Number sheets in reading order so "sheet 1" is the first one a reader meets.
    pending.sort((a, b) => a.placement.page - b.placement.page || a.placement.box.y - b.placement.box.y || a.placement.box.x - b.placement.box.x);
    const continuations = pending.map(({ placement, field, label, lineHeight, fontSize, measure, width, image }, index) => {
        const number = index + 1;
        // Longest wording that fits; narrow printed spaces get a shorter pointer.
        let pointer;
        let pointerSize;
        for (const candidate of [`See continuation sheet ${number}`, `Continued: sheet ${number}`, `Sheet ${number}`]) {
            pointer = candidate;
            pointerSize = fontSize;
            while (pointerSize > MIN_POINTER_FONT && measure(pointer, pointerSize) > width) pointerSize -= 0.5;
            if (measure(pointer, pointerSize) <= width) break;
        }
        placement.lines.push({ text: pointer, top: placement.box.y + placement.lines.length * lineHeight, fontSize: pointerSize, pointer: true });
        placement.continuation = number;
        issues.push({ code: "continuation-required", severity: "warning", fieldId: field.id, definitionId: field.definitionId, page: placement.page,
            message: `"${label}" on page ${placement.page + 1} continues on continuation sheet ${number}.` });
        return image
            ? { number, kind: "image", fieldId: field.id, definitionId: field.definitionId, page: placement.page, label, imageUrl: field.imageUrl, imageName: field.imageName }
            : { number, kind: "text", fieldId: field.id, definitionId: field.definitionId, page: placement.page, label, text: field.text };
    });

    return { placements, continuations, issues, hiddenFieldIds };
}
/* ------------------------------------------------------------------ END:
 * formFieldRenderPlan
 * ------------------------------------------------------------------------ */
