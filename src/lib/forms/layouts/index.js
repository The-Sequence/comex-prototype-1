/* =========================================================================
 * Registry of hand-authored, measured COMEX layouts.
 *
 * Keyed by the bundled PDF file name. An authored layout is complete for its
 * file: getFieldsForFile prefers it over scanner output and overrides.
 * `aliases` map verified legacy definition IDs to their authored IDs so old
 * drafts keep their answers; unmatched legacy answers stay as freehand.
 * ========================================================================= */
import { FIELD_SCHEMA_VERSION } from "../formFieldSchema.js";
import form001 from "./001.js";
import form002 from "./002.js";
import form003 from "./003.js";
import form004 from "./004.js";
import form005 from "./005.js";
import form006 from "./006.js";
import form007 from "./007.js";
import form008 from "./008.js";
import form009 from "./009.js";
import form010 from "./010.js";
import form011 from "./011.js";
import form012 from "./012.js";
import form013 from "./013.js";
import form014 from "./014.js";
import form015 from "./015.js";
import form016 from "./016.js";
import form017 from "./017.js";
import form018 from "./018.js";
import form019 from "./019.js";
import form020 from "./020.js";
import form021 from "./021.js";
import form022 from "./022.js";
import form023 from "./023.js";
import form024 from "./024.js";

const LAYOUTS = { ...form001, ...form002, ...form003, ...form004, ...form005, ...form006, ...form007, ...form008, ...form009, ...form010, ...form011, ...form012, ...form013, ...form014, ...form015, ...form016, ...form017, ...form018, ...form019, ...form020, ...form021, ...form022, ...form023, ...form024 };

export function getAuthoredLayout(fileName) {
    const layout = LAYOUTS[fileName];
    return layout ? { schemaVersion: FIELD_SCHEMA_VERSION, aliases: {}, ...layout } : null;
}
