/**
 * Buffer Follower Module
 * Handles buffer/tab changes in Neovim and updates preview
 */

import * as fs from 'fs';
import * as path from 'path';

export interface BufferChangeEvent {
  bufferPath: string;
  bufferName: string;
  isMarkdown: boolean;
  content?: string;
  timestamp: number;
}

export interface BufferFollowerOptions {
  preserveScroll?: boolean;
  excludePatterns?: string[];
  maxContentSize?: number; // bytes
}

/**
 * Check if a file is a markdown file
 */
export function isMarkdownFile(filepath: string): boolean {
  const markdownExtensions = ['.md', '.markdown', '.mdown', '.mkd', '.mdwn'];
  const ext = path.extname(filepath).toLowerCase();
  return markdownExtensions.includes(ext);
}

/**
 * Load file content safely
 */
export async function loadFileContent(
  filepath: string,
  maxSize: number = 10 * 1024 * 1024,
): Promise<string | null> {
  try {
    const stats = await fs.promises.stat(filepath);

    if (stats.size > maxSize) {
      console.warn(
        `File ${filepath} exceeds max size of ${maxSize} bytes`,
      );
      return null;
    }

    const content = await fs.promises.readFile(filepath, 'utf-8');
    return content;
  } catch (error) {
    console.error(`Failed to load file ${filepath}:`, error);
    return null;
  }
}

/**
 * Create a buffer change event
 */
export async function createBufferChangeEvent(
  bufferPath: string,
  bufferName: string,
  maxContentSize?: number,
): Promise<BufferChangeEvent | null> {
  const isMarkdown = isMarkdownFile(bufferPath);

  if (!isMarkdown) {
    return {
      bufferPath,
      bufferName,
      isMarkdown: false,
      timestamp: Date.now(),
    };
  }

  let content: string | undefined;
  try {
    const fileContent = await loadFileContent(bufferPath, maxContentSize);
    if (fileContent !== null) {
      content = fileContent;
    }
  } catch (error) {
    console.error(`Error reading buffer ${bufferPath}:`, error);
  }

  return {
    bufferPath,
    bufferName,
    isMarkdown,
    content,
    timestamp: Date.now(),
  };
}

/**
 * Check if buffer change should trigger preview update
 */
export function shouldUpdatePreview(
  event: BufferChangeEvent,
  options: BufferFollowerOptions = {},
): boolean {
  const { excludePatterns = [] } = options;

  // Don't update if not markdown
  if (!event.isMarkdown) {
    return false;
  }

  // Check exclude patterns
  for (const pattern of excludePatterns) {
    if (event.bufferPath.includes(pattern)) {
      return false;
    }
  }

  return true;
}

/**
 * Get scroll position information from preview
 */
export interface ScrollPosition {
  scrollPercent: number;
  headingId?: string;
}

/**
 * Format event for socket.io transmission
 */
export function formatBufferChangeEvent(
  event: BufferChangeEvent,
  scrollPosition?: ScrollPosition,
): object {
  return {
    buffer: {
      path: event.bufferPath,
      name: event.bufferName,
      isMarkdown: event.isMarkdown,
    },
    content: event.content || '',
    timestamp: event.timestamp,
    scroll: scrollPosition,
  };
}

/**
 * Debounce buffer changes to avoid excessive updates
 */
export class BufferChangeDebouncer {
  private timeout: NodeJS.Timeout | null = null;
  private lastEvent: BufferChangeEvent | null = null;
  private readonly delay: number;
  private readonly callback: (event: BufferChangeEvent) => void;

  constructor(
    callback: (event: BufferChangeEvent) => void,
    delay: number = 300,
  ) {
    this.callback = callback;
    this.delay = delay;
  }

  public debounce(event: BufferChangeEvent): void {
    this.lastEvent = event;

    if (this.timeout) {
      clearTimeout(this.timeout);
    }

    this.timeout = setTimeout(() => {
      if (this.lastEvent) {
        this.callback(this.lastEvent);
      }
      this.timeout = null;
    }, this.delay);
  }

  public cancel(): void {
    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = null;
    }
  }
}

export default {
  isMarkdownFile,
  loadFileContent,
  createBufferChangeEvent,
  shouldUpdatePreview,
  formatBufferChangeEvent,
  BufferChangeDebouncer,
};
