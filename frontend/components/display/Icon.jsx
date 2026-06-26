// Icon — Quiet Fight Club's lucide subset, inlined from lucide-static@0.453.0 (ISC).
// Quiet, consistent 2px stroke. Icons are small and never decorative noise.
import React from 'react';

const QFC_ICON_PATHS = {
  "feather": "<path d=\"M12.67 19a2 2 0 0 0 1.416-.588l6.154-6.172a6 6 0 0 0-8.49-8.49L5.586 9.914A2 2 0 0 0 5 11.328V18a1 1 0 0 0 1 1z\"></path> <path d=\"M16 8 2 22\"></path> <path d=\"M17.5 15H9\"></path>",
  "pen-line": "<path d=\"M12 20h9\"></path> <path d=\"M16.376 3.622a1 1 0 0 1 3.002 3.002L7.368 18.635a2 2 0 0 1-.855.506l-2.872.838a.5.5 0 0 1-.62-.62l.838-2.872a2 2 0 0 1 .506-.854z\"></path>",
  "film": "<rect width=\"18\" height=\"18\" x=\"3\" y=\"3\" rx=\"2\"></rect> <path d=\"M7 3v18\"></path> <path d=\"M3 7.5h4\"></path> <path d=\"M3 12h18\"></path> <path d=\"M3 16.5h4\"></path> <path d=\"M17 3v18\"></path> <path d=\"M17 7.5h4\"></path> <path d=\"M17 16.5h4\"></path>",
  "clapperboard": "<path d=\"M20.2 6 3 11l-.9-2.4c-.3-1.1.3-2.2 1.3-2.5l13.5-4c1.1-.3 2.2.3 2.5 1.3Z\"></path> <path d=\"m6.2 5.3 3.1 3.9\"></path> <path d=\"m12.4 3.4 3.1 4\"></path> <path d=\"M3 11h18v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z\"></path>",
  "search": "<circle cx=\"11\" cy=\"11\" r=\"8\"></circle> <path d=\"m21 21-4.3-4.3\"></path>",
  "clock": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <polyline points=\"12 6 12 12 16 14\"></polyline>",
  "sparkles": "<path d=\"M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z\"></path> <path d=\"M20 3v4\"></path> <path d=\"M22 5h-4\"></path> <path d=\"M4 17v2\"></path> <path d=\"M5 18H3\"></path>",
  "circle-check": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <path d=\"m9 12 2 2 4-4\"></path>",
  "check": "<path d=\"M20 6 9 17l-5-5\"></path>",
  "copy": "<rect width=\"14\" height=\"14\" x=\"8\" y=\"8\" rx=\"2\" ry=\"2\"></rect> <path d=\"M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2\"></path>",
  "rotate-ccw": "<path d=\"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8\"></path> <path d=\"M3 3v5h5\"></path>",
  "x": "<path d=\"M18 6 6 18\"></path> <path d=\"m6 6 12 12\"></path>",
  "circle-alert": "<circle cx=\"12\" cy=\"12\" r=\"10\"></circle> <line x1=\"12\" x2=\"12\" y1=\"8\" y2=\"12\"></line> <line x1=\"12\" x2=\"12.01\" y1=\"16\" y2=\"16\"></line>",
  "external-link": "<path d=\"M15 3h6v6\"></path> <path d=\"M10 14 21 3\"></path> <path d=\"M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6\"></path>",
  "list-checks": "<path d=\"m3 17 2 2 4-4\"></path> <path d=\"m3 7 2 2 4-4\"></path> <path d=\"M13 6h8\"></path> <path d=\"M13 12h8\"></path> <path d=\"M13 18h8\"></path>",
  "book-open": "<path d=\"M12 7v14\"></path> <path d=\"M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z\"></path>",
  "file-text": "<path d=\"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z\"></path> <path d=\"M14 2v4a2 2 0 0 0 2 2h4\"></path> <path d=\"M10 9H8\"></path> <path d=\"M16 13H8\"></path> <path d=\"M16 17H8\"></path>",
  "arrow-right": "<path d=\"M5 12h14\"></path> <path d=\"m12 5 7 7-7 7\"></path>",
};

export function Icon({ name, size = 16, strokeWidth = 2, color = 'currentColor', style, className, title }) {
  const inner = QFC_ICON_PATHS[name];
  if (!inner) return null;
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      className={className}
      style={{ flexShrink: 0, ...style }}
      dangerouslySetInnerHTML={{ __html: (title ? '<title>' + title + '</title>' : '') + inner }}
    />
  );
}

Icon.names = Object.keys(QFC_ICON_PATHS);
