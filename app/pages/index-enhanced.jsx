/**
 * Enhanced markdown preview page with wikilinks and buffer following support
 * This file patches the original index.jsx with new functionality
 */

// This serves as a guide for integrating the new features into app/pages/index.jsx
// The integration should be done by:
//
// 1. Import wikilinks plugin at the top:
//    import wikilinkPlugin from '../pages/wikilinks'
//
// 2. Add wikilinks plugin to markdown-it chain (around line 240):
//    .use(wikilinkPlugin, {
//      linkPrefix: '#wikilink:'
//    })
//
// 3. Add CSS for wikilinks styling in index.jsx:
//    a.wikilink {
//      color: #4183c4;
//      text-decoration: underline;
//      cursor: pointer;
//      border-bottom: 1px dotted #4183c4;
//    }
//
//    a.wikilink:hover {
//      background-color: rgba(65, 131, 196, 0.1);
//    }
//
// 4. Add event listener for wikilink clicks (in componentDidMount):
//    document.addEventListener('click', this.handleWikilinkClick)
//
// 5. Add handler method:
//    handleWikilinkClick = (e) => {
//      const link = e.target.closest('a.wikilink')
//      if (!link) return
//
//      e.preventDefault()
//      const target = link.getAttribute('data-wikilink-target')
//      if (window.io && window.io.connected) {
//        window.io.emit('wikilink_clicked', { target, timestamp: Date.now() })
//      }
//    }
//
// 6. Clean up in componentWillUnmount:
//    document.removeEventListener('click', this.handleWikilinkClick)
//
// 7. Add buffer change listener (in componentDidMount):
//    if (window.io) {
//      window.io.on('buffer_changed', this.handleBufferChange)
//    }
//
// 8. Add buffer change handler:
//    handleBufferChange = (payload) => {
//      if (!payload.buffer.isMarkdown || !payload.content) return
//
//      this.props.data = {
//        ...this.props.data,
//        content: payload.content.split('\n'),
//        name: payload.buffer.name
//      }
//      this.refresh(this.props)
//    }
