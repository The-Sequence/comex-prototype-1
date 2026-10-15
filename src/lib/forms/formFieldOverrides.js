/* =========================================================================
 * FILE: src/config/formFieldOverrides.js
 * MODULE: Hand-authored field definitions, merged over the generated ones
 * -------------------------------------------------------------------------
 * PURPOSE:
 *   Describes the questions that scripts/extractFormFields.mjs cannot find on
 *   its own — chiefly the forms that are TABLES.
 *
 * WHY THIS FILE EXISTS SEPARATELY FROM formFields.js:
 *   formFields.js is GENERATED. Anything corrected by hand in there is lost
 *   the next time the extractor runs, which makes hand-correcting it a trap.
 *   This file is never generated, so corrections here survive. getFieldsForFile
 *   merges the two, with these entries winning.
 *
 * WHY TABLES CANNOT BE AUTO-DETECTED:
 *   The extractor reads the TEXT layer. A ruled table's grid is vector
 *   graphics — the lines are drawn, not written — so from the text layer an
 *   attendance sheet is a column header and twenty row numbers floating in
 *   space, with nothing to say where the cells are. The column edges below
 *   were measured from the rendered pages instead.
 *
 * ACCURACY, HONESTLY:
 *   Column boundaries are read off the rendered page to the nearest point or
 *   two, not extracted from the PDF's drawing operators. They land answers in
 *   the right cell, which is what matters; they are not claimed to be exact
 *   to the hairline. As everywhere else in this editor, every placed answer
 *   stays draggable, so a cell that sits a little high is a nudge to fix
 *   rather than a wrong file.
 *
 * SUPABASE MIGRATION NOTE:
 *   Becomes rows in a `form_fields` table alongside the generated ones, with
 *   a `source` column distinguishing "scanned" from "authored". Nothing about
 *   the shape needs to change.
 * ========================================================================= */

/* ---------------------------------------------------------------- START:
 * FORM_FIELD_OVERRIDES
 * Keyed by PDF file name, same as FORM_FIELDS. Each entry REPLACES the
 * generated fields for that file when `replace` is true, or is appended to
 * them otherwise — table forms replace, because what the scanner found on
 * them is noise rather than a partial answer.
 * ------------------------------------------------------------------------ */
export const FORM_FIELD_OVERRIDES = {
    /* ---- Image answers (photos, map screenshots) ------------------------
     * The scanner reads text rules only, so it never offers a picture slot.
     * These three forms ask for photos; each entry is APPENDED to the
     * scanned fields. Positions sit just under the printed heading and
     * stay draggable and resizable, since the forms also allow "another
     * sheet" for longer sections. */
    "comex-form-001-en.pdf": {
        fields: [
            {
                id: "img-location-photos",
                label: "C. Photos of the location of the chosen community",
                type: "image",
                page: 0,
                xFraction: 0.6,
                yFraction: 0.596,
                widthFraction: 0.18,
            },
            {
                id: "img-map-screenshot",
                label: "D. Map screenshot (Google Maps, NU Fairview to the community)",
                type: "image",
                page: 0,
                xFraction: 0.8,
                yFraction: 0.596,
                widthFraction: 0.16,
            },
        ],
    },
    "comex-form-013-en.pdf": {
        fields: [
            {
                id: "img-before-during-after",
                label: "IV. Photos before, during, and after the Community Engagement",
                type: "image",
                page: 0,
                xFraction: 0.62,
                yFraction: 0.236,
                widthFraction: 0.3,
            },
        ],
    },
    "comex-form-014-en.pdf": {
        fields: [
            {
                id: "img-before-during-after",
                label: "III. Photos before, during, and after the event",
                type: "image",
                page: 0,
                xFraction: 0.62,
                yFraction: 0.358,
                widthFraction: 0.3,
            },
        ],
    },

    /* ---- 010 Attendance Sheet — page is 612 x 792 ------------------------
     * Header rules for EVENT and TIME & DATE, then a 20-row, 3-column table.
     * Row pitch measured from the printed row numbers: y 590 down to 89. */
    "comex-form-010-en.pdf": {
        replace: true,
        fields: [
            {
                id: "event",
                label: "Event",
                type: "text",
                page: 0,
                xFraction: 0.155,
                yFraction: 0.1793,
                widthFraction: 0.42,
            },
            {
                id: "timedate",
                label: "Time & Date",
                type: "text",
                page: 0,
                xFraction: 0.712,
                yFraction: 0.1793,
                widthFraction: 0.24,
            },
            {
                id: "attendance",
                label: "Attendance",
                type: "table",
                page: 0,
                rowCount: 20,
                firstRowYFraction: 0.2424,
                rowHeightFraction: 0.0333,
                columns: [
                    { key: "name", label: "Name", xFraction: 0.139, widthFraction: 0.37 },
                    {
                        key: "department",
                        label: "School / Department",
                        xFraction: 0.49,
                        widthFraction: 0.29,
                    },
                    {
                        key: "signature",
                        label: "Signature",
                        xFraction: 0.792,
                        widthFraction: 0.135,
                    },
                ],
            },
        ],
    },

    /* ---- 021 Community Service Daily Time Record — page is 596 x 842 -----
     * A header block of five single cells, then a 10-row, 6-column table
     * running from just under the column headings down to TOTAL HOURS. */
    "comex-form-021-en.pdf": {
        replace: true,
        fields: [
            {
                id: "student",
                label: "Name of Student",
                type: "text",
                page: 0,
                xFraction: 0.272,
                yFraction: 0.2015,
                widthFraction: 0.29,
            },
            {
                id: "term",
                label: "Term, AY, Section",
                type: "text",
                page: 0,
                xFraction: 0.594,
                yFraction: 0.2015,
                widthFraction: 0.17,
            },
            {
                id: "group",
                label: "Group #",
                type: "text",
                page: 0,
                xFraction: 0.865,
                yFraction: 0.2015,
                widthFraction: 0.1,
            },
            {
                id: "community",
                label: "Name of the Chosen Community",
                type: "text",
                page: 0,
                xFraction: 0.41,
                yFraction: 0.2265,
                widthFraction: 0.17,
            },
            {
                id: "pointperson",
                label: "Point Person",
                type: "text",
                page: 0,
                xFraction: 0.62,
                yFraction: 0.2385,
                widthFraction: 0.3,
            },
            {
                id: "dtr",
                label: "Daily time record",
                type: "table",
                page: 0,
                rowCount: 10,
                firstRowYFraction: 0.3016,
                rowHeightFraction: 0.0274,
                columns: [
                    { key: "date", label: "Date", xFraction: 0.112, widthFraction: 0.085 },
                    { key: "timeIn", label: "Time in", xFraction: 0.202, widthFraction: 0.1 },
                    { key: "timeOut", label: "Time out", xFraction: 0.307, widthFraction: 0.15 },
                    { key: "name", label: "Name", xFraction: 0.465, widthFraction: 0.14 },
                    {
                        key: "designation",
                        label: "Designation",
                        xFraction: 0.61,
                        widthFraction: 0.155,
                    },
                    {
                        key: "signature",
                        label: "Signature",
                        xFraction: 0.77,
                        widthFraction: 0.14,
                    },
                ],
            },
            {
                id: "totalhours",
                label: "Total hours",
                type: "text",
                page: 0,
                xFraction: 0.33,
                yFraction: 0.5665,
                widthFraction: 0.12,
            },
        ],
    },
};
/* ------------------------------------------------------------------ END:
 * FORM_FIELD_OVERRIDES
 * ------------------------------------------------------------------------ */
