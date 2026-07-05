/**
 * WikiLinks Plugin for markdown-it
 * Parses [[filename]] and [[filename|display text]] syntax
 */

import * as path from 'path';
import * as fs from 'fs';

export interface WikilinkOptions {
  searchPath?: string;
  extensions?: string[];
  basePath?: string;
  linkPrefix?: string;
}

export interface WikilinkMatch {
  filename: string;
  displayText: string;
  href?: string;
}

/**
 * Parse wikilink syntax: [[filename]] or [[filename|display text]]
 */
export function parseWikilink(text: string): WikilinkMatch | null {
  // Match [[filename]] or [[filename|display text]]
  const wikilinkRegex = /^\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]$/;
  const match = text.match(wikilinkRegex);

  if (!match) {
    return null;
  }

  return {
    filename: match[1].trim(),
    displayText: match[2]?.trim() || match[1].trim(),
  };
}

/**
 * Find a file matching the wikilink in the search path
 */
export function findWikilinkFile(
  filename: string,
  searchPath: string,
  extensions: string[] = ['md', 'markdown'],
): string | null {
  // Try exact match first
  if (fs.existsSync(filename)) {
    return filename;
  }

  // Try in search path with each extension
  for (const ext of extensions) {
    const withExtension = `${filename}.${ext}`;
    const fullPath = path.join(searchPath, withExtension);
    if (fs.existsSync(fullPath)) {
      return fullPath;
    }
  }

  // Try without extension assumption (direct filename)
  const directPath = path.join(searchPath, filename);
  if (fs.existsSync(directPath)) {
    return directPath;
  }

  return null;
}

/**
 * Create markdown-it plugin for wikilinks
 */
export function wikilinkPlugin(
  md: any,
  options: WikilinkOptions = {},
): void {
  const defaults: Required<WikilinkOptions> = {
    searchPath: options.searchPath || process.cwd(),
    extensions: options.extensions || ['md', 'markdown'],
    basePath: options.basePath || '',
    linkPrefix: options.linkPrefix || '#wikilink:',
  };

  // Store options in md instance for use in render rules
  (md as any).__wikilinkOptions = defaults;

  /**
   * Inline rule for wikilinks
   */
  md.inline.ruler.push('wikilink', (state: any, silent: boolean) => {
    const pos = state.pos;
    const max = state.posMax;

    // Check for opening [[
    if (pos + 1 >= max) return false;
    if (state.src[pos] !== '[' || state.src[pos + 1] !== '[') return false;

    // Find closing ]]
    let closePos = pos + 2;
    while (closePos < max) {
      if (
        state.src[closePos] === ']' &&
        state.src[closePos + 1] === ']'
      ) {
        break;
      }
      closePos++;
    }

    if (closePos >= max) return false; // No closing ]]

    const content = state.src.slice(pos + 2, closePos);
    const wikilink = parseWikilink(`[[${content}]]`);

    if (!wikilink) return false;

    if (!silent) {
      const token = state.push('wikilink_open', 'a', 1);
      token.attrSet('href', `${defaults.linkPrefix}${wikilink.filename}`);
      token.meta = wikilink;

      const textToken = state.push('text', '', 0);
      textToken.content = wikilink.displayText;

      state.push('wikilink_close', 'a', -1);
    }

    state.pos = closePos + 2;
    return true;
  });

  /**
   * Render rules for wikilinks
   */
  md.renderer.rules.wikilink_open = (tokens: any[], idx: number) => {
    const token = tokens[idx];
    const href = token.attrGet('href');
    return `<a href="${href}" class="wikilink" data-wikilink-target="${token.meta.filename}">`;
  };

  md.renderer.rules.wikilink_close = () => '</a>';
}

/**
 * Export types for use in other modules
 */
export default wikilinkPlugin;
