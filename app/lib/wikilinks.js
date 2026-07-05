/*
 * Wikilinks Plugin for markdown-it (compiled)
 */
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function wikilinkPlugin(md, options) {
    if (options === void 0) { options = {}; }
    var linkPrefix = options.linkPrefix || '#wikilink:';
    function parseWikilink(text) {
        var match = text.match(/^\[\[([^\|\]]+)(?:\|([^\]]+))?\]\]$/);
        if (!match)
            return null;
        return {
            filename: match[1].trim(),
            displayText: (match[2] || match[1]).trim(),
        };
    }
    function wikilinkRule(state, silent) {
        var pos = state.pos;
        var max = state.posMax;
        if (pos + 1 >= max)
            return false;
        if (state.src[pos] !== '[' || state.src[pos + 1] !== '[') {
            return false;
        }
        var closePos = pos + 2;
        while (closePos < max) {
            if (state.src[closePos] === ']' && state.src[closePos + 1] === ']') {
                break;
            }
            closePos++;
        }
        if (closePos >= max)
            return false;
        var content = state.src.slice(pos + 2, closePos);
        var wikilink = parseWikilink("[[" + content + "]]");
        if (!wikilink)
            return false;
        if (!silent) {
            var token = state.push('wikilink_open', 'a', 1);
            token.attrSet('href', linkPrefix + encodeURIComponent(wikilink.filename));
            token.attrSet('class', 'wikilink');
            token.attrSet('data-wikilink-target', wikilink.filename);
            token.meta = wikilink;
            var textToken = state.push('text', '', 0);
            textToken.content = wikilink.displayText;
            state.push('wikilink_close', 'a', -1);
        }
        state.pos = closePos + 2;
        return true;
    }
    md.inline.ruler.push('wikilink', wikilinkRule);
    md.renderer.rules.wikilink_open = function (tokens, idx) {
        var token = tokens[idx];
        var href = token.attrGet('href');
        var target = token.attrGet('data-wikilink-target');
        return "<a href=\"" + href + "\" class=\"wikilink\" data-wikilink-target=\"" + target + "\" title=\"Navigate to: " + target + "\">";
    };
    md.renderer.rules.wikilink_close = function () { return '</a>'; };
}
exports.default = wikilinkPlugin;
