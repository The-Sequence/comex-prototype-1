/* =========================================================================
 * Builders for hand-authored COMEX layouts.
 *
 * Every number passed to these comes from measuring the official PDF
 * (text and ruling positions extracted with pdf.js, checked against page
 * renders) — see docs/superpowers/verification/COMEX_FORM_COVERAGE.md.
 * Coordinates are page fractions from the top-left.
 * ========================================================================= */
const r = (value) => +value.toFixed(4);
const MARK = 0.02;

/** A blank written on: underline, box or cell. `y` is the top of the writing area. */
export function blank(id, label, { page = 0, x, y, w, h = 0.016, type = "text", section, required = false, overflow, help, fontSize } = {}) {
    return { id, label, type, page, ...(fontSize ? { fontSize } : {}), xFraction: r(x), yFraction: r(y), widthFraction: r(w), heightFraction: r(h), section, required, help, ...(overflow ? { render: { overflow } } : {}) };
}

/** A narrative area. Continuation sheets are allowed because the printed outlines are short. */
export function narrative(id, label, geometry) {
    return blank(id, label, { type: "paragraph", overflow: "continuation", ...geometry });
}

/** One question with exclusive answers, each ticked in the centre of its printed cell. */
export function choiceRow(id, label, { page = 0, top, bottom, x, w, columns, section, type = "singleChoice", mark = "check", required = false }) {
    const height = bottom - top;
    // Short printed rows get a smaller mark so the tick stays inside the ruling.
    const size = r(Math.min(MARK, height * 0.75));
    return {
        id, label, type, page, section, required,
        xFraction: r(x), yFraction: r(top), widthFraction: r(w), heightFraction: r(height),
        options: columns.map((column) => ({
            id: column.id, value: column.value ?? column.id, label: column.label, page, mark,
            xFraction: r((column.x0 + column.x1) / 2 - size / 2), yFraction: r(top + (height - size) / 2),
            widthFraction: size, heightFraction: size, targetAnchor: "top-left",
        })),
    };
}

/** A table whose answer cells are the printed grid. `rows` are the ruled row boundaries. */
export function grid(id, label, { page = 0, rowLines, columns, section, required = false, fontSize }) {
    const heights = rowLines.slice(1).map((line, index) => r(line - rowLines[index]));
    const uniform = heights.every((height) => Math.abs(height - heights[0]) < 0.0015);
    const x = Math.min(...columns.map((column) => column.x));
    const right = Math.max(...columns.map((column) => column.x + column.w));
    return {
        id, label, type: "table", page, section, required,
        xFraction: r(x), yFraction: r(rowLines[0]), widthFraction: r(right - x), heightFraction: r(rowLines.at(-1) - rowLines[0]),
        rowCount: heights.length, rowHeightFraction: r(heights[0]), ...(uniform ? {} : { rowHeights: heights }),
        // Extra column settings (limits, row totals) pass through unchanged.
        columns: columns.map(({ x, w, ...column }) => ({ ...column, type: column.type ?? "text", xFraction: r(x), widthFraction: r(w), ...(column.fontSize ?? fontSize ? { fontSize: column.fontSize ?? fontSize } : {}) })),
    };
}

/** An answer written on a printed underline. `textTop`/`textHeight` are the
 *  measured underscore run; the answer's single line sits just above it. */
export function onLine(id, label, { textTop, textHeight, ...geometry }) {
    const lineHeight = 0.0175;
    return blank(id, label, { ...geometry, y: textTop + textHeight - lineHeight, h: lineHeight });
}
