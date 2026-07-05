/**
 * Buffer Follower Client
 * Handles buffer/tab changes from Neovim
 */

import { socket } from './socket';

export interface BufferInfo {
  path: string;
  name: string;
  isMarkdown: boolean;
}

export interface BufferChangePayload {
  buffer: BufferInfo;
  content: string;
  timestamp: number;
  scroll?: {
    scrollPercent: number;
    headingId?: string;
  };
}

let currentBuffer: BufferInfo | null = null;
let contentCache: Map<string, string> = new Map();

/**
 * Initialize buffer follower
 */
export function initBufferFollower(
  onBufferChange: (payload: BufferChangePayload) => void,
): void {
  if (!socket) {
    console.error('Socket.io not initialized');
    return;
  }

  // Listen for buffer change events from Neovim
  socket.on('buffer_changed', (payload: BufferChangePayload) => {
    console.log('Buffer changed:', payload.buffer);

    if (!payload.buffer.isMarkdown) {
      console.log('Not a markdown file, skipping preview update');
      return;
    }

    // Cache the content
    if (payload.content) {
      contentCache.set(payload.buffer.path, payload.content);
    }

    currentBuffer = payload.buffer;
    onBufferChange(payload);
  });

  // Listen for wikilink click events and send them back to Neovim
  socket.on('wikilink_navigate', (data: { target: string }) => {
    // This is handled in the WikiLink component
    console.log('Wikilink navigate event:', data);
  });

  console.log('Buffer follower initialized');
}

/**
 * Get current buffer info
 */
export function getCurrentBuffer(): BufferInfo | null {
  return currentBuffer;
}

/**
 * Get cached content for a buffer
 */
export function getCachedContent(bufferPath: string): string | null {
  return contentCache.get(bufferPath) || null;
}

/**
 * Clear content cache
 */
export function clearContentCache(): void {
  contentCache.clear();
}

/**
 * Get current scroll position from the DOM
 */
export function getCurrentScrollPosition(): {
  scrollPercent: number;
  headingId?: string;
} {
  const scrollContainer = document.querySelector('.markdown-body');
  if (!scrollContainer) {
    return { scrollPercent: 0 };
  }

  const scrollHeight =
    scrollContainer.scrollHeight - scrollContainer.clientHeight;
  const scrollPercent =
    scrollHeight > 0
      ? (scrollContainer.scrollTop / scrollHeight) * 100
      : 0;

  // Try to find the heading closest to the top of the visible area
  const headings = scrollContainer.querySelectorAll(
    'h1[id], h2[id], h3[id], h4[id], h5[id], h6[id]',
  );
  let closestHeading: string | undefined;
  let closestDistance = Infinity;

  headings.forEach((heading) => {
    const rect = heading.getBoundingClientRect();
    const distance = Math.abs(rect.top);
    if (distance < closestDistance) {
      closestDistance = distance;
      closestHeading = heading.id;
    }
  });

  return { scrollPercent, headingId: closestHeading };
}

/**
 * Restore scroll position
 */
export function restoreScrollPosition(position: {
  scrollPercent: number;
  headingId?: string;
}): void {
  const scrollContainer = document.querySelector('.markdown-body');
  if (!scrollContainer) {
    return;
  }

  // Try to restore by heading ID first
  if (position.headingId) {
    const heading = document.getElementById(position.headingId);
    if (heading) {
      heading.scrollIntoView({ behavior: 'auto', block: 'start' });
      return;
    }
  }

  // Fall back to scroll percentage
  const scrollHeight =
    scrollContainer.scrollHeight - scrollContainer.clientHeight;
  scrollContainer.scrollTop =
    (position.scrollPercent / 100) * scrollHeight;
}

export default {
  initBufferFollower,
  getCurrentBuffer,
  getCachedContent,
  clearContentCache,
  getCurrentScrollPosition,
  restoreScrollPosition,
};
