const CELL_LINE = 0.0175;
const empty = value => value === null || value === undefined || value === "";
const imageType = type => type === "image" || type === "signature";
const optionId = option => option.id ?? String(option.value);
const linked = (field, definition) => field.definitionId === definition.id || (definition.type === "table" && field.definitionId?.startsWith(`${definition.id}:`));

export function readFieldAnswer({ definition, fields = [] }) {
    const placed = fields.filter(field => linked(field, definition));
    if (definition.type === "table") {
        const rows = [];
        for (const field of placed) {
            const [, row, key] = field.definitionId.split(":");
            const column = definition.columns?.find(item => item.key === key);
            if (!column || !/^\d+$/.test(row) || Number(row) >= definition.rowCount) continue;
            rows[Number(row)] ??= {};
            rows[Number(row)][key] = fieldValue(field, column.type ?? "text");
        }
        return Array.from({ length: rows.length }, (_, index) => rows[index] ?? {});
    }
    if (definition.type === "multiChoice") return placed.map(field => field.optionId ?? definition.options?.find(option => option.value === field.choice)?.id ?? String(field.choice));
    const field = placed[0];
    if (!field) return null;
    if (["singleChoice", "scale"].includes(definition.type)) return field.optionId ?? optionId(definition.options?.find(option => option.value === field.choice) ?? { value: field.choice });
    return fieldValue(field, definition.type);
}

function fieldValue(field, type) {
    if (imageType(type)) return field.imageUrl ? { imageUrl: field.imageUrl, imageName: field.imageName ?? "" } : type === "signature" ? field.text ?? "" : null;
    if (type === "checkbox") return field.answerValue ?? field.choice ?? false;
    if (["number", "currency"].includes(type) && field.text !== "" && Number.isFinite(Number(field.text))) return Number(field.text);
    return field.text ?? "";
}

export function applyFieldAnswer({ definition, value, fields = [] }) {
    const existing = fields.filter(field => linked(field, definition));
    const others = fields.filter(field => !linked(field, definition));
    const issues = [];
    const issue = message => issues.push({ code: "invalid-answer", definitionId: definition.id, severity: "error", message });
    if (empty(value) || (Array.isArray(value) && value.length === 0)) return { fields: others, issues };
    const base = (id, target, old) => ({ ...old, id: old?.id ?? `d-${id}`, definitionId: id, label: definition.label,
        page: target.page ?? definition.page ?? 0, xFraction: old?.xFraction ?? target.xFraction,
        yFraction: old?.yFraction ?? target.yFraction, widthFraction: old?.widthFraction ?? target.widthFraction,
        heightFraction: old?.heightFraction ?? target.heightFraction ?? definition.heightFraction ?? 0.025, fontSize: old?.fontSize ?? target.fontSize ?? definition.fontSize ?? 11 });
    const payload = (type, answer) => imageType(type) && typeof answer === "object" ? { imageUrl: answer?.imageUrl, imageName: answer?.imageName ?? "", text: "", answerValue: undefined } : type === "checkbox" ? { choice: Boolean(answer), answerValue: Boolean(answer), mark: answer ? "check" : undefined, text: "" } : { imageUrl: undefined, imageName: undefined, text: String(answer), answerValue: undefined };
    let additions = [];
    if (["singleChoice", "multiChoice", "scale"].includes(definition.type)) {
        const selected = definition.type === "multiChoice" ? (Array.isArray(value) ? [...new Set(value)] : []) : [value];
        if (definition.type === "multiChoice" && !Array.isArray(value)) issue("Select an array of option IDs.");
        for (const id of selected) {
            const option = definition.options?.find(item => optionId(item) === String(id));
            if (!option) { issue(`Unknown choice ${id}.`); continue; }
            const width = option.widthFraction ?? 0.02;
            const target = { ...option, yFraction: option.yFraction ?? definition.yFraction };
            if (option.targetAnchor === "center" || (definition.type === "scale" && !option.targetAnchor)) { target.xFraction -= width / 2; target.yFraction -= width / 3; }
            // A choice change moves the mark to its own target, never the previous one.
            const old = existing.find(field => field.optionId === optionId(option));
            additions.push({ ...base(definition.id, target, old), id: old?.id ?? `d-${definition.id}-${optionId(option)}`,
                optionId: optionId(option), choice: option.value ?? optionId(option), mark: option.mark ?? (definition.type === "scale" ? "ring" : "check"), text: "" });
        }
    } else if (definition.type === "table") {
        if (!Array.isArray(value) || value.length > definition.rowCount) issue("Answer rows exceed the printed table capacity.");
        else value.forEach((row, index) => {
            for (const column of definition.columns ?? []) {
                const answer = row?.[column.key];
                if (empty(answer)) continue;
                const id = `${definition.id}:${index}:${column.key}`;
                const rowTop = (definition.yFraction ?? definition.firstRowYFraction) + (definition.rowHeights ? definition.rowHeights.slice(0, index).reduce((sum, height) => sum + height, 0) : index * definition.rowHeightFraction);
                const rowHeight = definition.rowHeights?.[index] ?? definition.rowHeightFraction;
                // Centre one line of text in the printed row so it never touches either ruling.
                const pad = Math.max(0, (rowHeight - CELL_LINE) / 2);
                additions.push({ ...base(id, { ...column, yFraction: rowTop + pad, heightFraction: rowHeight - pad }, existing.find(field => field.definitionId === id)),
                    label: `${column.label ?? column.key}, row ${index + 1}`, cellType: column.type ?? "text", rowIndex: index, columnKey: column.key, ...payload(column.type ?? "text", answer) });
            }
        });
    } else additions = [{ ...base(definition.id, definition, existing[0]), ...payload(definition.type, value) }];
    return { fields: issues.length ? fields : [...others, ...additions], issues };
}

// Asynchronous cell completions (image reads) must merge into the caller's latest fields, not a render-time snapshot.
export function applyCellAnswer({ definition, rowIndex, column, value, fields = [] }) {
    const rows = readFieldAnswer({ definition, fields });
    while (rows.length <= rowIndex) rows.push({});
    rows[rowIndex] = { ...rows[rowIndex], [column.key]: value };
    return applyFieldAnswer({ definition, value: rows, fields });
}

export function isFieldVisible({ definition, answers }) {
    const condition = definition.visibleWhen;
    if (!condition) return true;
    const value = answers?.[condition.fieldId];
    if (condition.operator === "equals") return value === condition.value;
    if (condition.operator === "includes") return Array.isArray(value) && value.includes(condition.value);
    if (condition.operator === "notEmpty") return !empty(value) && (!Array.isArray(value) || value.length > 0);
    return false;
}

export function isAnswered({ definition, value }) {
    if (empty(value)) return false;
    if (definition.type === "table") return Array.isArray(value) && value.some(row => Object.values(row ?? {}).some(answer => !empty(answer)));
    if (Array.isArray(value)) return value.length > 0;
    if (imageType(definition.type) && typeof value === "object") return Boolean(value.imageUrl);
    return typeof value === "string" ? value.trim().length > 0 : true;
}

// Old drafts used positional scanner IDs; verified aliases move them to authored IDs.
// An answer already stored under the authored ID wins, and unmatched answers stay as they are.
export function applyLayoutAliases({ fields = [], aliases = {}, definitions = [] }) {
    const known = new Set(definitions.map(definition => definition.id));
    const taken = new Set(fields.map(field => field.definitionId).filter(Boolean));
    return fields.map(field => {
        const target = aliases[field.definitionId];
        if (!target || !known.has(target) || taken.has(target)) return field;
        taken.add(target);
        return { ...field, definitionId: target, legacyDefinitionId: field.definitionId };
    });
}

// Typed limits (e.g. a 1-7 rating) are reported to the user, never silently clamped.
export function isOutOfRange(definition, value) {
    if (empty(value)) return false;
    const number = Number(value);
    if (!Number.isFinite(number)) return ["number", "currency"].includes(definition.type);
    const { min, max } = definition.constraints ?? {};
    return (min !== undefined && number < min) || (max !== undefined && number > max);
}

// Splits placed answers for review: linked to a current question, left over from an earlier
// layout (a definition ID that no longer exists), or placed freely by the user.
export function classifyPlacements({ fields = [], definitions = [] }) {
    const groups = { matched: [], legacy: [], freehand: [] };
    for (const field of fields) {
        if (!field.definitionId) groups.freehand.push(field);
        else if (definitions.some(definition => linked(field, definition))) groups.matched.push(field);
        else groups.legacy.push(field);
    }
    return groups;
}
