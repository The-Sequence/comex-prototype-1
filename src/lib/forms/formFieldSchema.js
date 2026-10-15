export const FIELD_SCHEMA_VERSION = 2;
export const FIELD_TYPES = ["text", "paragraph", "number", "currency", "date", "time", "email", "tel", "checkbox", "singleChoice", "multiChoice", "scale", "signature", "image", "table"];
const CELL_TYPES = FIELD_TYPES.filter(type => !["table", "singleChoice", "multiChoice", "scale"].includes(type));
const validId = value => typeof value === "string" && value.length > 0 && !value.includes(":");

// Answers are independent of current templates. Preserve all placement payloads,
// including unknown/freehand ones, rather than reassigning their definition IDs.
export function normalizeLegacyPlacements(fields) {
    return Array.isArray(fields) ? structuredClone(fields) : [];
}

export function normalizeFieldDefinitions({ fields = [], pageCount, schemaVersion = 1 }) {
    const normalized = (Array.isArray(fields) ? fields : []).map((field, order) => {
        if (!field || typeof field !== "object") return field;
        const copy = { ...structuredClone(field), order: field.order ?? order, required: field.required ?? false,
            heightFraction: field.heightFraction ?? (field.type === "paragraph" ? 0.08 : 0.025) };
        if (field.type === "table") {
            copy.yFraction = field.yFraction ?? field.firstRowYFraction;
            copy.xFraction = field.xFraction ?? Math.min(...(field.columns ?? []).map(column => column.xFraction));
            copy.widthFraction = field.widthFraction ?? Math.max(...(field.columns ?? []).map(column => column.xFraction + column.widthFraction)) - copy.xFraction;
            copy.heightFraction = field.heightFraction ?? (field.rowHeights?.reduce((sum, height) => sum + height, 0) ?? field.rowCount * field.rowHeightFraction);
        }
        if (field.options) copy.options = field.options.map((option, index) => ({
            ...option, id: option.id ?? String(option.value ?? index + 1), value: option.value ?? option.id ?? String(index + 1),
            label: option.label ?? String(option.value ?? option.id ?? index + 1), page: option.page ?? field.page,
            yFraction: option.yFraction ?? field.yFraction, widthFraction: option.widthFraction ?? 0.018,
            heightFraction: option.heightFraction ?? 0.018, mark: option.mark ?? (field.type === "scale" ? "ring" : "check"),
            targetAnchor: option.targetAnchor ?? (field.type === "scale" ? "center" : "top-left"),
        }));
        if (field.columns) copy.columns = field.columns.map(column => ({ ...column, key: column.key ?? column.id, type: column.type ?? "text" }));
        return copy;
    });
    const issues = validateFieldDefinitions({ fields: normalized, pageCount });
    if (![1, 2].includes(schemaVersion)) issues.unshift({ code: "unsupported-schema", definitionId: null, message: `Unsupported field schema ${schemaVersion}.`, severity: "error" });
    if (!Array.isArray(fields)) issues.unshift({ code: "invalid-fields", definitionId: null, message: "Fields must be an array.", severity: "error" });
    return { schemaVersion: FIELD_SCHEMA_VERSION, fields: normalized, issues };
}

export function validateFieldDefinitions({ fields = [], pageCount }) {
    const issues = [];
    const add = (code, field, message) => issues.push({ code, definitionId: field?.id ?? null, message, severity: "error" });
    const ids = new Set();
    const bounds = (target, field) => {
        const page = target.page ?? field.page;
        if (!Number.isInteger(page) || page < 0 || (Number.isInteger(pageCount) && page >= pageCount)) add("invalid-page", field, "Field target is outside the document pages.");
        const x = target.xFraction, y = target.yFraction ?? field.yFraction;
        const width = target.widthFraction ?? 0.018, height = target.heightFraction ?? 0.025;
        if (![x, y, width, height].every(Number.isFinite) || x < 0 || y < 0 || width <= 0 || height <= 0 || x + width > 1.0001 || y + height > 1.0001) add("invalid-bounds", field, "Field target must fit inside its page.");
    };
    if (!Array.isArray(fields)) { add("invalid-fields", null, "Fields must be an array."); return issues; }
    for (const field of fields) {
        if (!field || typeof field !== "object") { add("invalid-field", null, "Each field must be an object."); continue; }
        if (!validId(field.id)) add("invalid-id", field, "Field IDs must be nonempty and cannot contain colons.");
        if (ids.has(field.id)) add("duplicate-id", field, "Field IDs must be unique.");
        ids.add(field.id);
        if (!FIELD_TYPES.includes(field.type)) add("unsupported-type", field, `Unsupported answer type: ${field.type}.`);
        bounds(field, field);
        if (["singleChoice", "multiChoice", "scale"].includes(field.type)) {
            if (!Array.isArray(field.options) || !field.options.length) add("missing-options", field, "Choices require at least one option.");
            const optionIds = new Set();
            for (const option of field.options ?? []) {
                const id = option.id ?? String(option.value);
                if (!validId(id) || optionIds.has(id)) add("invalid-option", field, "Option IDs must be unique and cannot contain colons.");
                optionIds.add(id);
                bounds(option, field);
            }
        }
        if (field.type === "table") {
            const heights = field.rowHeights ?? Array.from({ length: Math.min(1000, Math.max(0, field.rowCount ?? 0)) }, () => field.rowHeightFraction);
            if (!Number.isInteger(field.rowCount) || field.rowCount < 1 || field.rowCount > 1000 || heights.length !== field.rowCount || heights.some(height => !Number.isFinite(height) || height <= 0) || field.yFraction + heights.reduce((sum, height) => sum + height, 0) > 1.0001) add("table-capacity", field, "Table rows must fit inside their printed page.");
            if (!field.columns?.length) add("missing-columns", field, "Tables require typed columns.");
            const keys = new Set();
            const intervals = [];
            for (const column of field.columns ?? []) {
                const key = column.key ?? column.id;
                if (!validId(key)) add("invalid-column", field, "Column keys cannot contain colons.");
                if (keys.has(key)) add("duplicate-column", field, "Column keys must be unique.");
                keys.add(key);
                if (!CELL_TYPES.includes(column.type ?? "text")) add("unsupported-column-type", field, "Unsupported table cell type.");
                bounds({ ...column, page: field.page, yFraction: field.yFraction, heightFraction: heights[0] ?? 0.025 }, field);
                const right = column.xFraction + column.widthFraction;
                if (intervals.some(([left, end]) => column.xFraction < end - 0.0001 && right > left + 0.0001)) add("overlapping-columns", field, "Printed table columns must not overlap.");
                intervals.push([column.xFraction, right]);
            }
        }
        if (field.render?.overflow && !["error", "continuation"].includes(field.render.overflow)) add("invalid-overflow", field, "Choose error or continuation for overflowing content.");
        if (field.visibleWhen && (!validId(field.visibleWhen.fieldId) || !["equals", "includes", "notEmpty"].includes(field.visibleWhen.operator))) add("invalid-condition", field, "Invalid conditional visibility rule.");
    }
    for (const field of fields) if (field?.visibleWhen && !ids.has(field.visibleWhen.fieldId)) add("missing-condition-field", field, "The condition refers to a missing question.");
    return issues;
}
