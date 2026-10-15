/* =========================================================================
 * FILE: src/lib/documentExport.js
 * MODULE: Saving an edited document back out as PDF or Word
 * -------------------------------------------------------------------------
 * PURPOSE:
 *   Turns what the user has filled in or written into a real file on their
 *   device. The right technique depends entirely on what the SOURCE document
 *   was:
 *
 *     PDF source  -> PDF out   exportFilledPdf()  stamps into the original
 *     PDF source  -> print     printFilledPdf()   prints that same stamped PDF
 *     DOCX source -> Word out  exportHtmlAsDocx() rebuilds real paragraphs
 *     DOCX source -> PDF/print printHtmlToPdf()   the browser's own engine
 *
 * ---------------------------------------------------------------------------
 * WHY A PDF IS NEVER OFFERED AS "DOWNLOAD AS WORD"
 * ---------------------------------------------------------------------------
 *   There used to be a PDF -> Word route that rendered each finished page to
 *   a PNG and placed those pictures in a .docx. The file opened in Word, but
 *   every page was an IMAGE: nothing could be selected, corrected or retyped.
 *   That is not what "download as Word" means to anyone who asks for it, and
 *   a document that looks editable but is not is worse than no option at all.
 *   It has been removed rather than relabelled — a PDF's contents genuinely
 *   cannot be turned into editable Word text without reverse-engineering the
 *   layout, which is exactly the damage this whole rewrite exists to avoid.
 *   Word output remains available for documents that are genuinely Word
 *   documents to begin with.
 *
 * ---------------------------------------------------------------------------
 * WHY A PDF IS FILLED AND NOT REWRITTEN
 * ---------------------------------------------------------------------------
 *   A PDF has no paragraphs. Every glyph is placed at an absolute coordinate,
 *   and the file records positions, not structure. There is no operation for
 *   "insert a word and reflow the rest" because there is nothing to reflow.
 *
 *   So the original page is never modified — it is kept exactly as the office
 *   produced it, and the user's answers are drawn ON TOP at the coordinates
 *   they placed them. The layout cannot break, because the layout is never
 *   touched. This is the same approach Adobe Fill & Sign and DocuSign take,
 *   for the same reason.
 *
 * ========================================================================= */
import { embedHelvetica, fontFaceFor, LINE_HEIGHT, metricsFromFonts } from "./pdfFontMetrics.js";


/* ---------------------------------------------------------------- START:
 * triggerDownload — hand a Blob to the browser as a file.
 *
 * Uses an anchor with `download` rather than window.open, because a Blob URL
 * opened in a tab shows the file instead of saving it, and on iOS Safari
 * frequently shows nothing at all. The object URL is revoked on the next
 * frame — immediately would race the download starting in Safari.
 *
 * @param {Blob} blob
 * @param {string} fileName
 * ------------------------------------------------------------------------ */

export function triggerDownload(blob, fileName) {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.rel = "noopener";

    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);

    requestAnimationFrame(() => URL.revokeObjectURL(url));
}
/* ------------------------------------------------------------------ END:
 * triggerDownload
 * ------------------------------------------------------------------------ */

/* ---------------------------------------------------------------- START:
 * safeFileName — a name every filesystem will accept.
 * @param {string} name
 * @param {string} extension - Without the dot.
 * ------------------------------------------------------------------------ */
function safeFileName(name, extension) {
    const base = (name || "document")
        .replace(/\.[^.]+$/, "")
        .replace(/[^\w\s.-]/g, "")
        .replace(/\s+/g, "-")
        .slice(0, 80);

    return `${base || "document"}.${extension}`;
}
/* ------------------------------------------------------------------ END:
 * safeFileName
 * ------------------------------------------------------------------------ */

/* ---------------------------------------------------------------- START:
 * exportFilledPdf — PDF source, PDF out.
 *
 * Loads the ORIGINAL bytes and draws each field onto the page it belongs to.
 * Nothing existing is removed or re-laid-out.
 *
 * COORDINATES:
 *   Fields are stored as fractions of the page (see PdfFillEditor for why),
 *   so they survive any zoom level or screen size. Converting back to PDF
 *   space means multiplying by the real page size and flipping the Y axis —
 *   the DOM measures down from the top, PDF measures up from the bottom.
 *
 * @param {object} args
 * @param {ArrayBuffer|Uint8Array} args.sourceBytes - The original PDF.
 * @param {Array} args.fields - [{ page, xFraction, yFraction, text, fontSize }]
 * @param {string} args.fileName
 * ------------------------------------------------------------------------ */
export async function exportFilledPdfBlob({ sourceBytes, fields = [], definitions, acceptContinuations }) {
    const bytes = await buildFilledPdfBytes({ sourceBytes, fields, definitions, acceptContinuations });
    return new Blob([bytes], { type: "application/pdf" });
}

export async function exportFilledPdf({ sourceBytes, fields = [], fileName, definitions, acceptContinuations }) {
    const bytes = await buildFilledPdfBytes({ sourceBytes, fields, definitions, acceptContinuations });
    triggerDownload(
        new Blob([bytes], { type: "application/pdf" }),
        safeFileName(fileName, "pdf")
    );
}
/* ------------------------------------------------------------------ END:
 * exportFilledPdf
 * ------------------------------------------------------------------------ */

/* ---------------------------------------------------------------- START:
 * printFilledPdf — PDF source, straight to the print sheet.
 *
 * Prints the SAME bytes exportFilledPdf would have downloaded, rather than
 * printing the on-screen editor. That matters: the editor shows drag handles,
 * selection rings and a toolbar, none of which belong on paper, and its
 * canvas is rendered at screen resolution. Going through the real stamped PDF
 * means what prints is exactly what downloading would have given you.
 *
 * The file is opened in a hidden iframe and printed from there, so the app
 * itself is never replaced and no popup blocker is involved.
 *
 * @param {object} args
 * @param {ArrayBuffer|Uint8Array} args.sourceBytes
 * @param {Array} args.fields
 * @param {string} args.fileName
 * ------------------------------------------------------------------------ */
export async function printFilledPdf({ sourceBytes, fields = [], fileName, definitions, acceptContinuations }) {
    const bytes = await buildFilledPdfBytes({ sourceBytes, fields, definitions, acceptContinuations });
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));

    const frame = document.createElement("iframe");
    frame.setAttribute("aria-hidden", "true");
    frame.title = safeFileName(fileName, "pdf");
    frame.style.position = "fixed";
    frame.style.right = "0";
    frame.style.bottom = "0";
    frame.style.width = "0";
    frame.style.height = "0";
    frame.style.border = "0";

    frame.onload = () => {
        try {
            frame.contentWindow.focus();
            frame.contentWindow.print();
        } catch {
            /* Some browsers refuse to drive a plugin-rendered PDF's print
             * from script. Opening it in a tab still lets the user print it
             * themselves, which beats appearing to do nothing. */
            window.open(url, "_blank", "noopener,noreferrer");
        }
        /* Cleaned up on a delay: print() returns immediately in some browsers
         * while the dialog is still reading from the document. */
        setTimeout(() => {
            frame.remove();
            URL.revokeObjectURL(url);
        }, 60000);
    };

    frame.src = url;
    document.body.appendChild(frame);
}
/* ------------------------------------------------------------------ END:
 * printFilledPdf
 * ------------------------------------------------------------------------ */

/* ---------------------------------------------------------------- START:
 * buildFilledPdfBytes (module-private)
 * Draws every placed answer onto a copy of the original and returns the
 * finished bytes. Shared by the download and print routes so the two can
 * never drift apart.
 * ------------------------------------------------------------------------ */
export async function buildFilledPdfBytes({ sourceBytes, fields = [], definitions = [], acceptContinuations = false }) {
    const { PDFDocument, rgb } = await import("pdf-lib");
    const { buildFieldRenderPlan, fitImageRect, wrapText } = await import("./formFieldRenderPlan.js");

    const pdfDoc = await PDFDocument.load(sourceBytes);
    /* All four faces are embedded up front so a field can be bold, italic or
     * both without a second pass. The preview measures with the same faces. */
    const fonts = await embedHelvetica(pdfDoc);
    const pickFont = (field) => fonts[fontFaceFor(field)];
    const pages = pdfDoc.getPages();
    const ink = rgb(0.11, 0.13, 0.31);

    /* The same measured plan the editor previews. Errors stop the export so
     * an answer is never clipped or dropped without the user knowing. */
    const plan = buildFieldRenderPlan({
        definitions,
        fields,
        pageSizes: pages.map((page) => page.getSize()),
        fontMetrics: metricsFromFonts(fonts),
    });
    const errors = plan.issues.filter((issue) => issue.severity === "error");
    if (errors.length) throw new Error(errors.map((issue) => issue.message).join(" "));
    if (plan.continuations.length && !acceptContinuations) {
        throw new Error(`${plan.continuations.length} answer(s) need a continuation sheet. Tick "Add labelled continuation sheets" to append them after the original pages.`);
    }

    const byKind = (kind) => plan.placements.filter((placement) => placement.kind === kind);

    /* Images first, so a caption typed over a photo is not painted beneath
     * it. Embedding is async, hence the loop rather than forEach. */
    for (const placement of byKind("image")) {
        const page = pages[placement.page];
        try {
            const bytes = await (await fetch(placement.field.imageUrl)).arrayBuffer();
            const isPng = new Uint8Array(bytes)[0] === 0x89;
            const image = isPng ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
            const rect = fitImageRect(placement.box, image);
            const { height } = page.getSize();
            page.drawImage(image, { x: rect.x, y: height - rect.y - rect.height, width: rect.width, height: rect.height });
        } catch {
            /* An image that cannot be embedded must not lose the rest of the
             * user's answers — skip it and carry on. */
        }
    }

    /* ------------------------------------------------------------ START:
     * Marks — the ring around an encircled option, and the tick in a box.
     *
     * Drawn as an OUTLINE ellipse rather than a filled shape so the printed
     * digit underneath stays readable, which is the whole point of the form
     * asking for it to be encircled rather than crossed out.
     * ---------------------------------------------------------------- */
    for (const placement of byKind("mark")) {
        const page = pages[placement.page];
        const { height } = page.getSize();
        const boxWidth = placement.box.width;
        const left = placement.box.x;
        const top = height - placement.box.y;

        if (placement.mark === "check") {
            /* A tick drawn as two strokes, sized to the detected bracket. */
            const size = boxWidth;
            page.drawLine({ start: { x: left + size * 0.15, y: top - size * 0.5 }, end: { x: left + size * 0.4, y: top - size * 0.78 }, thickness: Math.max(1, size * 0.1), color: ink });
            page.drawLine({ start: { x: left + size * 0.4, y: top - size * 0.78 }, end: { x: left + size * 0.85, y: top - size * 0.16 }, thickness: Math.max(1, size * 0.1), color: ink });
            continue;
        }

        /* The ring. Height is derived from the width at the same 1.6:1 ratio
         * the on-screen glyph uses, so what was positioned is what prints. */
        const ringHeight = boxWidth / 1.6;
        page.drawEllipse({ x: left + boxWidth / 2, y: top - ringHeight / 2, xScale: boxWidth / 2, yScale: ringHeight / 2, borderColor: ink, borderWidth: Math.max(0.8, boxWidth * 0.06), opacity: 0 });
    }
    /* -------------------------------------------------------------- END:
     * Marks
     * ---------------------------------------------------------------- */

    /* Text: the plan has already wrapped and bounded every line. The baseline
     * sits one font size below each line's top, matching the on-screen box. */
    for (const placement of byKind("text")) {
        const page = pages[placement.page];
        const { height } = page.getSize();
        const font = pickFont(placement.field);
        for (const line of placement.lines) {
            const y = height - line.top - line.fontSize;
            page.drawText(line.text, { x: placement.box.x, y, size: line.fontSize, font: line.pointer ? fonts.italic : font, color: rgb(0, 0, 0) });
            /* PDF has no underline attribute — it is drawn as a rule under
             * the baseline, at the measured width of that line. */
            if (placement.field.underline && !line.pointer) {
                page.drawLine({
                    start: { x: placement.box.x, y: y - line.fontSize * 0.12 },
                    end: { x: placement.box.x + font.widthOfTextAtSize(line.text, line.fontSize), y: y - line.fontSize * 0.12 },
                    thickness: Math.max(0.4, line.fontSize * 0.05),
                    color: rgb(0, 0, 0),
                });
            }
        }
    }

    /* Continuation sheets: appended after the untouched original pages, one
     * labelled sheet per answer, paginated when the answer is long. */
    const sheetSize = pages[0]?.getSize() ?? { width: 612, height: 792 };
    const margin = 54;
    const bodySize = 11;
    const bodyLine = bodySize * LINE_HEIGHT;
    for (const continuation of plan.continuations) {
        if (continuation.kind === "image") {
            const page = pdfDoc.addPage([sheetSize.width, sheetSize.height]);
            let y = sheetSize.height - margin - 14;
            page.drawText(`Continuation sheet ${continuation.number}`, { x: margin, y, size: 14, font: fonts.bold });
            y -= 22;
            for (const [index, heading] of wrapText(`${continuation.label} — continued from page ${continuation.page + 1}`, sheetSize.width - margin * 2, 11, (text, size) => fonts.bold.widthOfTextAtSize(text, size)).entries()) {
                if (index) y -= 11 * LINE_HEIGHT;
                page.drawText(heading, { x: margin, y, size: 11, font: fonts.bold });
            }
            try {
                const bytes = await (await fetch(continuation.imageUrl)).arrayBuffer();
                const image = new Uint8Array(bytes)[0] === 0x89 ? await pdfDoc.embedPng(bytes) : await pdfDoc.embedJpg(bytes);
                const box = { x: margin, y: 0, width: sheetSize.width - margin * 2, height: y - margin - 12 };
                const rect = fitImageRect(box, image);
                page.drawImage(image, { x: rect.x, y: margin + (box.height - rect.height) / 2, width: rect.width, height: rect.height });
            } catch {
                page.drawText("This image could not be embedded.", { x: margin, y: y - 30, size: 11, font: fonts.italic });
            }
            continue;
        }
        const lines = wrapText(continuation.text, sheetSize.width - margin * 2, bodySize, (text, size) => fonts.regular.widthOfTextAtSize(text, size));
        let part = 0;
        while (part === 0 || lines.length) {
            const page = pdfDoc.addPage([sheetSize.width, sheetSize.height]);
            let y = sheetSize.height - margin - 14;
            page.drawText(`Continuation sheet ${continuation.number}${part ? " (continued)" : ""}`, { x: margin, y, size: 14, font: fonts.bold });
            y -= 22;
            for (const [index, heading] of wrapText(`${continuation.label} — continued from page ${continuation.page + 1}`, sheetSize.width - margin * 2, 11, (text, size) => fonts.bold.widthOfTextAtSize(text, size)).entries()) {
                if (index) y -= 11 * LINE_HEIGHT;
                page.drawText(heading, { x: margin, y, size: 11, font: fonts.bold });
            }
            y -= bodyLine * 1.6;
            while (lines.length && y > margin) {
                page.drawText(lines.shift(), { x: margin, y, size: bodySize, font: fonts.regular });
                y -= bodyLine;
            }
            part += 1;
        }
    }

    return pdfDoc.save();
}
/* ------------------------------------------------------------------ END:
 * buildFilledPdfBytes
 * ------------------------------------------------------------------------ */


