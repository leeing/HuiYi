/**
 * Split `content` into pages of at most `charsPerPage` characters.
 * Splits at the last whitespace boundary within the limit to avoid mid-word cuts.
 * Always returns at least one element (may be empty string if content is "").
 */
export function paginate(content: string, charsPerPage: number): string[] {
  if (content.length === 0) return [""];
  if (content.length <= charsPerPage) return [content];

  const pages: string[] = [];
  let remaining = content;

  while (remaining.length > 0) {
    if (remaining.length <= charsPerPage) {
      pages.push(remaining);
      break;
    }

    // Find the last whitespace within the limit
    const slice = remaining.slice(0, charsPerPage);
    const lastSpace = slice.lastIndexOf(" ");

    let boundary: number;
    if (lastSpace > 0) {
      boundary = lastSpace; // cut before the space
    } else {
      boundary = charsPerPage; // no whitespace found — hard cut
    }

    pages.push(remaining.slice(0, boundary).trimEnd());
    remaining = remaining.slice(boundary).trimStart();
  }

  return pages;
}
