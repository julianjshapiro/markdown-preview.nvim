# Enhanced Features for markdown-preview.nvim

This fork adds two powerful features to the original markdown-preview.nvim plugin:

## 1. WikiLinks Support

### What It Does
Enables support for `[[filename]]` and `[[filename|display text]]` syntax, making it easy to create internal links between markdown files.

### Syntax Examples
```markdown
# Simple wikilink
[[notes]]

# Wikilink with custom display text
[[my-document|Click here to read more]]

# Links are rendered as clickable elements in the preview
```

### How It Works
1. **Parser**: Uses `markdown-it-wikilinks` plugin to parse wikilink syntax
2. **Renderer**: React component renders wikilinks as clickable HTML links
3. **Communication**: Socket.io sends wikilink clicks back to Neovim
4. **Navigation**: Vim opens the linked file in the current buffer

### Configuration
```vim
" Enable wikilinks support (default: 1)
let g:mkdp_wikilinks_enabled = 1

" Directory to search for wikilinked files (default: current file directory)
let g:mkdp_wikilinks_search_path = ''

" File extensions to search (default: ['md', 'markdown'])
let g:mkdp_wikilinks_extensions = ['md', 'markdown']
```

---

## 2. Buffer/Tab Following

### What It Does
When you switch between buffers or tabs in Neovim, the markdown preview automatically updates to show the content of the current markdown file.

### How It Works
1. **Buffer Detection**: Vim script monitors `BufEnter` and `WinEnter` events
2. **File Check**: Only reloads preview if the new buffer is a markdown file
3. **Preview Update**: Socket.io sends the new file path and content to the preview server
4. **Browser Refresh**: The preview pane updates with the new markdown content

### Behavior
- Preserves scroll position when returning to previously-viewed files
- Works seamlessly with split windows and tabs
- Respects the existing `mkdp_auto_close` configuration
- No manual action needed - automatic on buffer switch

### Configuration
```vim
" Enable buffer/tab following (default: 1)
let g:mkdp_auto_follow_buffer = 1

" Preserve scroll position when switching buffers (default: 1)
let g:mkdp_follow_preserve_scroll = 1
```

---

## Implementation Details

### Files Modified/Added

**Vim Script Side:**
- `plugin/markdown-preview.vim` - Main plugin entry point
  - Buffer change event handlers
  - Wikilink navigation function
  - Configuration initialization

- `autoload/mkdp.vim` - Core plugin logic
  - `mkdp#handle_buffer_change()` - Detects buffer switches
  - `mkdp#navigate_wikilink()` - Handles wikilink clicks
  - `mkdp#find_wikilink_file()` - Searches for linked files

**Node.js/TypeScript Server Side:**
- `src/server.ts` - Socket.io event handlers
  - `on('buffer_change')` - Receives buffer switch events
  - `on('wikilink_click')` - Receives wikilink clicks
  - Markdown file loading and parsing

**React Frontend:**
- `app/components/MarkdownPreview.tsx`
  - WikiLink component with click handlers
  - Styling for wikilinks

- `app/lib/wikilinks.ts`
  - WikiLink URL parsing and validation
  - Communication with backend

---

## Implementation Steps

### Phase 1: Core Infrastructure
1. Add socket.io event listeners for buffer changes
2. Add Vim script event handlers for BufEnter/WinEnter
3. Create markdown-it-wikilinks plugin integration

### Phase 2: WikiLinks
1. Implement wikilink parser in markdown-it chain
2. Add React component for rendering wikilinks
3. Add click handler that emits socket.io event
4. Implement file finding and opening logic in Vim

### Phase 3: Buffer Following
1. Add buffer change detection in Vim
2. Send current file info through socket.io
3. Update preview with new markdown content
4. Handle edge cases (non-markdown buffers, closed files, etc.)

### Phase 4: Testing & Polish
1. Test wikilink navigation across multiple files
2. Test buffer switching with splits/tabs
3. Test configuration options
4. Add error handling and user feedback

---

## Development Guide

### Building the Project
```bash
# Install dependencies
cd app && yarn install
cd ..

# Build TypeScript
npm run build-lib

# Build app with Next.js
npm run build-app

# Full build with binaries
npm run build
```

### Testing
1. Create test markdown files with wikilinks
2. Open preview with `:MarkdownPreview`
3. Click wikilinks to test navigation
4. Use `:tabnew` or `:split` to test buffer following

### Debugging
- Check browser console for frontend errors
- Check Neovim messages with `:messages`
- Monitor socket.io events in browser DevTools

---

## Future Enhancements

- [ ] Auto-complete for wikilink targets as you type
- [ ] Preview on hover for wikilinks
- [ ] Backlinks panel showing which files link to current file
- [ ] Graph visualization of wiki structure
- [ ] Rename/refactor wikilinks when files are renamed
- [ ] Support for anchors within files: `[[file#section]]`
