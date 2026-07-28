/** Turns "Jane's Bakery!" into "janes-bakery". Appends a short random
 * suffix at the call site if uniqueness matters (see storeService.js). */
export function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}
