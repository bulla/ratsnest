import type { PageFiles } from "./page";
import css from "./page.css" with { type: "text" };
import script from "./steps.js" with { type: "text" };
import tokens from "./tokens.css" with { type: "text" };

/**
 * The page's stylesheets and script, as text, for every page the command makes. Imported rather than
 * read from disk, so that a compiled ratsnest carries them inside it (ADR 0016).
 */
export const PAGE_FILES: PageFiles = { tokens, css, script };
