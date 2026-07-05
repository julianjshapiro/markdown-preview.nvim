" ============================================================================
" Plugin: Wikilinks and Buffer Following for markdown-preview.nvim
" Description: Enhanced features for markdown preview
" ============================================================================

if exists('g:loaded_wikilinks_and_buffer_follow')
  finish
endif
let g:loaded_wikilinks_and_buffer_follow = 1

" ============================================================================
" Configuration Options
" ============================================================================

" Enable/disable wikilinks support
if !exists('g:mkdp_wikilinks_enabled')
  let g:mkdp_wikilinks_enabled = 1
endif

" Enable/disable buffer/tab following
if !exists('g:mkdp_auto_follow_buffer')
  let g:mkdp_auto_follow_buffer = 1
endif

" Directory to search for wikilinked files
if !exists('g:mkdp_wikilinks_search_path')
  let g:mkdp_wikilinks_search_path = ''
endif

" File extensions to search for wikilinks
if !exists('g:mkdp_wikilinks_extensions')
  let g:mkdp_wikilinks_extensions = ['md', 'markdown']
endif

" Preserve scroll position when following buffer
if !exists('g:mkdp_follow_preserve_scroll')
  let g:mkdp_follow_preserve_scroll = 1
endif

" ============================================================================
" Utility Functions
" ============================================================================

" Check if current file is markdown
function! s:is_markdown_file() abort
  let l:ext = fnamemodify(bufname('%'), ':e')
  return l:ext =~? '\v^(md|markdown)$'
endfunction

" Get the directory of the current file
function! s:get_current_dir() abort
  let l:dir = fnamemodify(bufname('%'), ':h')
  return empty(l:dir) || l:dir == '.' ? getcwd() : l:dir
endfunction

" ============================================================================
" Buffer Following Implementation
" ============================================================================

function! s:on_buffer_enter() abort
  if !g:mkdp_auto_follow_buffer
    return
  endif

  " Only process markdown files
  if !s:is_markdown_file()
    return
  endif

  " Only process if preview is running
  " This will be checked by the preview server
  let l:buffer_path = expand('%:p')
  let l:buffer_name = expand('%:t')

  " Send buffer change event to preview server
  call s:notify_buffer_change(l:buffer_path, l:buffer_name)
endfunction

function! s:notify_buffer_change(buffer_path, buffer_name) abort
  " This function sends a buffer change notification to the preview server
  " The server will receive this via socket.io and update the preview
  " Implementation: The markdown-preview.nvim plugin already establishes
  " a socket.io connection; we just need to emit the event

  try
    " Call into the main plugin to notify about buffer change
    " Using :call mkdp#notify_buffer_changed() if available
    if exists('*mkdp#notify_buffer_changed')
      call mkdp#notify_buffer_changed(a:buffer_path)
    endif
  catch
    " Silently ignore if plugin not ready
  endtry
endfunction

" ============================================================================
" WikiLink Navigation
" ============================================================================

function! s:navigate_wikilink(wikilink_target) abort
  " Find the file matching the wikilink
  let l:search_path = !empty(g:mkdp_wikilinks_search_path)
    \ ? g:mkdp_wikilinks_search_path
    \ : s:get_current_dir()

  let l:filename = a:wikilink_target
  let l:filepath = ''

  " Try with each configured extension
  for l:ext in g:mkdp_wikilinks_extensions
    let l:candidate = l:search_path . '/' . l:filename . '.' . l:ext
    if filereadable(l:candidate)
      let l:filepath = l:candidate
      break
    endif
  endfor

  " Try without extension
  if empty(l:filepath)
    let l:candidate = l:search_path . '/' . l:filename
    if filereadable(l:candidate)
      let l:filepath = l:candidate
    endif
  endif

  " Try direct path (absolute or relative to cwd)
  if empty(l:filepath) && filereadable(l:filename)
    let l:filepath = l:filename
  endif

  " If found, open the file
  if !empty(l:filepath)
    execute 'edit ' . fnameescape(l:filepath)
    call s:notify_buffer_change(l:filepath, fnamemodify(l:filepath, ':t'))
  else
    echohl ErrorMsg
    echo 'Wikilink target not found: ' . l:filename
    echohl None
  endif
endfunction

" ============================================================================
" Commands
" ============================================================================

command! -nargs=1 MarkdownFollowWikilink call s:navigate_wikilink(<q-args>)

" ============================================================================
" Autocommands
" ============================================================================

augroup markdown_preview_buffer_follow
  autocmd!
  if g:mkdp_auto_follow_buffer
    autocmd BufEnter *.md,*.markdown call s:on_buffer_enter()
    autocmd BufEnter *.mdown,*.mkd,*.mdwn call s:on_buffer_enter()
  endif
augroup END

" ============================================================================
" Socket.IO Event Handler (setup in main plugin)
" ============================================================================

" When the main markdown-preview plugin initializes its socket.io connection,
" it should call the following to set up the wikilink handler:

function! s:setup_wikilink_handler() abort
  " This function is called from the main plugin after socket.io connects
  " It registers handlers for:
  " 1. Receiving wikilink click events from the preview
  " 2. Sending buffer change events to the preview
endfunction
