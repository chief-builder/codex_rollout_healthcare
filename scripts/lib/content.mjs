// Pure helpers for checking the plan's HTML and Markdown sources. They work on
// strings so they can be unit-tested without a browser or the file system.

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/|#)/i;

/**
 * Strips any query string or fragment from a link target.
 * @param {string} target
 */
function stripSuffix(target) {
  return target.replace(/[?#].*$/, "");
}

/**
 * Relative href/src targets in an HTML document (external URLs and in-page
 * anchors are excluded).
 * @param {string} html
 * @returns {string[]}
 */
export function relativeHtmlRefs(html) {
  const refs = [...html.matchAll(/\b(?:href|src)="([^"]*)"/g)].map((m) => m[1]);
  const refresh = html.match(
    /http-equiv="refresh"\s+content="[^"]*url=([^"]+)"/i,
  );
  if (refresh) refs.push(refresh[1]);
  return refs.filter((ref) => ref && !EXTERNAL.test(ref)).map(stripSuffix);
}

/**
 * Relative link and image targets in a Markdown document.
 * @param {string} markdown
 * @returns {string[]}
 */
export function relativeMarkdownLinks(markdown) {
  const withoutCode = markdown.replace(/```[\s\S]*?```/g, "");
  return [...withoutCode.matchAll(/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g)]
    .map((m) => m[1])
    .filter((ref) => !EXTERNAL.test(ref))
    .map(stripSuffix);
}

/**
 * `<img>` tags that have no alt attribute or an empty one.
 * @param {string} html
 * @returns {string[]}
 */
export function imagesMissingAlt(html) {
  return [...html.matchAll(/<img\b[^>]*>/g)]
    .map((m) => m[0])
    .filter((tag) => !/\balt="[^"]*\S[^"]*"/.test(tag));
}

/**
 * Absolute paths from a developer machine (macOS, Linux or Windows home dirs).
 * @param {string} text
 * @returns {string[]}
 */
export function localPaths(text) {
  return [
    ...text.matchAll(/(?:\/Users\/|\/home\/|[A-Z]:\\Users\\)[\w.-]+/g),
  ].map((m) => m[0]);
}

/**
 * Alias-to-model mapping from the Markdown model table, e.g.
 * "| `coding-standard` | `openai.gpt-oss-120b` | ...".
 * @param {string} markdown
 * @returns {Map<string, string>}
 */
export function aliasModelsFromMarkdown(markdown) {
  const rows = markdown.matchAll(
    /^\|\s*`(coding-[\w-]+)`\s*\|\s*`([\w.:-]+)`/gm,
  );
  return new Map([...rows].map((m) => [m[1], m[2]]));
}

/**
 * Alias-to-model mapping from the HTML model table, where each row starts with
 * two `<td><code>` cells: alias, then model ID.
 * @param {string} html
 * @returns {Map<string, string>}
 */
export function aliasModelsFromHtml(html) {
  const rows = html.matchAll(
    /<td>\s*<code>(coding-[\w-]+)<\/code>\s*<\/td>\s*<td>\s*<code>([\w.:-]+)<\/code>/g,
  );
  return new Map([...rows].map((m) => [m[1], m[2]]));
}

/**
 * The date in a "Vendor facts verified as of YYYY-MM-DD" statement, or null.
 * @param {string} text
 * @returns {string | null}
 */
export function verifiedAsOf(text) {
  return text.match(/verified as of\s+(\d{4}-\d{2}-\d{2})/i)?.[1] ?? null;
}
