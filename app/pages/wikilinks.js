/**
 * Wikilinks Plugin for markdown-it
 * Parses and renders [[filename]] and [[filename|display text]] syntax
 */

export default function wikilinkPlugin(md, options = {}) {
  const wikilinkRegex = /\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]/g;
  const linkPrefix = options.linkPrefix || '#wikilink:';

  /**
   * Parse wikilink: [[filename]] or [[filename|display text]]
   */
  function parseWikilink(text) {
    const match = text.match(/^\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]$/);
    if (!match) return null;

    return {
      filename: match[1].trim(),
      displayText: match[2]?.trim() || match[1].trim(),
    };
  }

  /**
   * Inline rule for wikilinks
   */
  function wikilinkRule(state, silent) {
    const pos = state.pos;
    const max = state.posMax;

    // Check for opening [[
    if (pos + 1 >= max) return false;
    if (state.src[pos] !== '[' || state.src[pos + 1] !== '[') return false;

    // Find closing ]]
    let closePos = pos + 2;
    while (closePos < max) {
      if (state.src[closePos] === ']' && state.src[closePos + 1] === ']') {
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
      token.attrSet('href', `${linkPrefix}${encodeURIComponent(wikilink.filename)}`);
      token.attrSet('class', 'wikilink');
      token.attrSet('data-wikilink-target', wikilink.filename);
      token.meta = wikilink;

      const textToken = state.push('text', '', 0);
      textToken.content = wikilink.displayText;

      state.push('wikilink_close', 'a', -1);
    }

    state.pos = closePos + 2;
    return true;
  }

  // Add inline rule
  md.inline.ruler.push('wikilink', wikilinkRule);

  // Add render rules
  md.renderer.rules.wikilink_open = (tokens, idx) => {
    const token = tokens[idx];
    const href = token.attrGet('href');
    const target = token.attrGet('data-wikilink-target');
    return `<a href="${href}" class="wikilink" data-wikilink-target="${target}" title="Navigate to: ${target}">`;
  };

  md.renderer.rules.wikilink_close = () => '</a>';
}
