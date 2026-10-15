/* ---------------------------------------------------------------- START:
 * pdfFontMetrics — the exporter's own Helvetica measurements, for preview.
 *
 * The editor previews with the same widths pdf-lib uses when it writes the
 * file, so a line that wraps on screen wraps identically in the export.
 * ------------------------------------------------------------------------ */
export const LINE_HEIGHT = 1.2;

export const fontFaceFor = (field) =>
    field?.bold && field?.italic ? "boldItalic" : field?.bold ? "bold" : field?.italic ? "italic" : "regular";

export function metricsFromFonts(fonts) {
    return {
        widthOfText: (text, size, field) => fonts[fontFaceFor(field)].widthOfTextAtSize(text, size),
        lineHeight: (size) => size * LINE_HEIGHT,
    };
}

export async function embedHelvetica(pdfDoc) {
    const { StandardFonts } = await import("pdf-lib");
    return {
        regular: await pdfDoc.embedFont(StandardFonts.Helvetica),
        bold: await pdfDoc.embedFont(StandardFonts.HelveticaBold),
        italic: await pdfDoc.embedFont(StandardFonts.HelveticaOblique),
        boldItalic: await pdfDoc.embedFont(StandardFonts.HelveticaBoldOblique),
    };
}

let previewMetrics;
export function loadPreviewFontMetrics() {
    previewMetrics ??= (async () => {
        const { PDFDocument } = await import("pdf-lib");
        return metricsFromFonts(await embedHelvetica(await PDFDocument.create()));
    })();
    return previewMetrics;
}
/* ------------------------------------------------------------------ END:
 * pdfFontMetrics
 * ------------------------------------------------------------------------ */
