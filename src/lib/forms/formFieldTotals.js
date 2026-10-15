/* ---------------------------------------------------------------- START:
 * formFieldTotals — explicit, explainable totals for printed total fields.
 *
 * A total is only ever calculated from what its definition names:
 *   { kind: "sum", tableId, column }            sum of a table's number column
 *   { kind: "hours", tableId, timeIn, timeOut } elapsed hours per row, summed
 *   { kind: "average", fields: [...], decimals } mean of the answered fields
 *   column { kind: "rowSum", columns: [...] }   per-row sum inside one table
 * Rows that cannot be read (non-numbers, a missing time-out, time-out before
 * time-in) are reported as issues and left out — nothing is guessed. The
 * user applies a calculated value explicitly, and can always type their own.
 * ------------------------------------------------------------------------ */
import { readFieldAnswer } from "./formFieldAnswers.js";

const blank = (value) => value === null || value === undefined || value === "";
const round = (value, decimals = 2) => Math.round(value * 10 ** decimals) / 10 ** decimals;

function minutes(value) {
    const match = /^(\d{1,2}):(\d{2})/.exec(String(value ?? ""));
    if (!match) return null;
    const total = Number(match[1]) * 60 + Number(match[2]);
    return Number(match[1]) < 24 && Number(match[2]) < 60 ? total : null;
}

export function computeFieldTotal({ definition, definitions = [], fields = [] }) {
    const rule = definition.total;
    const issues = [];
    const issue = (message) => issues.push({ code: "total-input", severity: "warning", definitionId: definition.id, message });
    if (!rule) return { value: null, issues };
    const table = rule.tableId && definitions.find((item) => item.id === rule.tableId);
    const rows = table ? readFieldAnswer({ definition: table, fields }) : [];

    if (rule.kind === "sum") {
        let total = 0;
        let counted = 0;
        rows.forEach((row, index) => {
            const raw = row?.[rule.column];
            if (blank(raw)) return;
            const number = Number(raw);
            if (!Number.isFinite(number)) { issue(`Row ${index + 1}: "${raw}" is not a number, so it was left out.`); return; }
            total += number;
            counted += 1;
        });
        return { value: counted ? round(total) : null, issues };
    }

    if (rule.kind === "hours") {
        let total = 0;
        let counted = 0;
        rows.forEach((row, index) => {
            const start = row?.[rule.timeIn];
            const end = row?.[rule.timeOut];
            if (blank(start) && blank(end)) return;
            if (blank(start) || blank(end)) { issue(`Row ${index + 1}: needs both time-in and time-out before its hours can count.`); return; }
            const from = minutes(start);
            const to = minutes(end);
            if (from === null || to === null) { issue(`Row ${index + 1}: times must be written as HH:MM.`); return; }
            if (to < from) { issue(`Row ${index + 1}: time-out is before time-in, so its hours were left out.`); return; }
            total += (to - from) / 60;
            counted += 1;
        });
        return { value: counted ? round(total) : null, issues };
    }

    if (rule.kind === "average") {
        const values = [];
        for (const id of rule.fields ?? []) {
            const target = definitions.find((item) => item.id === id);
            if (!target) continue;
            const value = readFieldAnswer({ definition: target, fields });
            if (blank(value)) continue;
            const number = Number(value);
            if (Number.isFinite(number)) values.push(number);
            else issue(`"${target.label ?? id}" is not a number, so it was left out.`);
        }
        const expected = rule.fields?.length ?? 0;
        if (values.length < expected) issue(`Average of ${values.length} of ${expected} ratings; the rest are unanswered.`);
        return { value: values.length ? round(values.reduce((sum, value) => sum + value, 0) / values.length, rule.decimals ?? 2) : null, issues };
    }

    issue(`Unknown total rule ${rule.kind}.`);
    return { value: null, issues };
}

export function computeRowTotal({ column, row = {} }) {
    const rule = column.total;
    if (rule?.kind !== "rowSum") return { value: null, issues: [] };
    const numbers = rule.columns.map((key) => Number(row[key]));
    const missing = rule.columns.filter((key, index) => blank(row[key]) || !Number.isFinite(numbers[index]));
    if (missing.length) return { value: null, issues: [{ code: "total-input", severity: "warning", message: `Fill ${missing.join(", ")} first.` }] };
    return { value: round(numbers.reduce((sum, value) => sum + value, 0)), issues: [] };
}
/* ------------------------------------------------------------------ END:
 * formFieldTotals
 * ------------------------------------------------------------------------ */
