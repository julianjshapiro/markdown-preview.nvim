/**
 * WikiLink Parser for Frontend
 * Parses and validates wikilink URLs
 */

export interface ParsedWikiLink {
  target: string;
  anchor?: string;
  isValid: boolean;
  error?: string;
}

/**
 * Parse a wikilink URL (format: #wikilink:filename or #wikilink:filename#anchor)
 */
export function parseWikiLinkURL(url: string): ParsedWikiLink {
  const wikilinkPrefix = '#wikilink:';

  if (!url.startsWith(wikilinkPrefix)) {
    return {
      target: '',
      isValid: false,
      error: 'Not a wikilink URL',
    };
  }

  const content = url.slice(wikilinkPrefix.length);

  // Split by # to get target and anchor
  const parts = content.split('#');
  const target = parts[0].trim();
  const anchor = parts.length > 1 ? parts[1].trim() : undefined;

  if (!target) {
    return {
      target: '',
      isValid: false,
      error: 'Empty wikilink target',
    };
  }

  return {
    target,
    anchor,
    isValid: true,
  };
}

/**
 * Validate a wikilink target filename
 */
export function validateWikiLinkTarget(target: string): boolean {
  // Basic validation: no empty strings, no path traversal
  if (!target || target.length === 0) {
    return false;
  }

  // Check for path traversal attempts
  if (target.includes('..') || target.includes('~')) {
    return false;
  }

  return true;
}

/**
 * Extract all wikilinks from HTML content
 */
export function extractWikiLinksFromHTML(
  html: string,
): Array<{ target: string; element: HTMLElement }> {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const wikilinks: Array<{ target: string; element: HTMLElement }> = [];

  const links = doc.querySelectorAll('a.wikilink[data-wikilink-target]');
  links.forEach((link) => {
    const target = link.getAttribute('data-wikilink-target');
    if (target) {
      wikilinks.push({
        target,
        element: link as HTMLElement,
      });
    }
  });

  return wikilinks;
}

/**
 * Create a wikilink URL
 */
export function createWikiLinkURL(
  target: string,
  anchor?: string,
): string {
  let url = `#wikilink:${encodeURIComponent(target)}`;
  if (anchor) {
    url += `#${encodeURIComponent(anchor)}`;
  }
  return url;
}

export default {
  parseWikiLinkURL,
  validateWikiLinkTarget,
  extractWikiLinksFromHTML,
  createWikiLinkURL,
};
