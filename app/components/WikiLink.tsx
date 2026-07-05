/**
 * WikiLink Component
 * Renders clickable wikilinks in the markdown preview
 */

import React, { useCallback } from 'react';
import { socket } from '../lib/socket';

interface WikiLinkProps {
  href: string;
  target: string;
  children: React.ReactNode;
}

export const WikiLink: React.FC<WikiLinkProps> = ({
  href,
  target,
  children,
}) => {
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();

      // Emit wikilink click event to Neovim
      if (socket && socket.connected) {
        socket.emit('wikilink_clicked', {
          target: target,
          timestamp: Date.now(),
        });
      } else {
        console.warn('Socket.io not connected, cannot navigate wikilink');
      }
    },
    [target],
  );

  return (
    <a
      href={href}
      onClick={handleClick}
      className="wikilink"
      data-wikilink-target={target}
      title={`Navigate to: ${target}`}
    >
      {children}
    </a>
  );
};

export default WikiLink;
