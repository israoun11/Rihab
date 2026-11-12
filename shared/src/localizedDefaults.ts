import { DEFAULT_CONTENT } from "./defaults.js";
import { DEFAULT_CONTENT_AR, DEFAULT_CONTENT_EN } from "./translations.js";
import { localizeContent, type RawContent } from "./i18n.js";

/** Default content in every language (French original + translations), in the stored format. */
export const DEFAULT_RAW_CONTENT: RawContent = /* @__PURE__ */ localizeContent({ fr: DEFAULT_CONTENT, ar: DEFAULT_CONTENT_AR, en: DEFAULT_CONTENT_EN });
