import type { Bookmark, Folder, BookmarkFile } from './types.js';

/**
 * Serializes a BookmarkFile (Folder) object back to NETSCAPE-Bookmark-file-1 HTML format
 * @param bookmarkFile - The root folder containing all bookmarks
 * @returns HTML string in NETSCAPE-Bookmark-file-1 format
 */
export function serialize(bookmarkFile: BookmarkFile): string {
  const lines: string[] = [];

  // Write DOCTYPE and header
  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file.');
  lines.push('     It will be read and overwritten.');
  lines.push('     DO NOT EDIT! -->');
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push('<H1>Bookmarks</H1>');
  lines.push('');

  // Serialize the root folder's items
  lines.push('<DL><p>');
  serializeItems(bookmarkFile.items, lines, 1);
  lines.push('</DL><p>');

  return lines.join('\n');
}

/**
 * Recursively serializes items (bookmarks and folders) to HTML
 */
function serializeItems(
  items: (Bookmark | Folder)[],
  lines: string[],
  indentLevel: number
): void {
  const indent = '    '.repeat(indentLevel);

  for (const item of items) {
    if (isFolder(item)) {
      serializeFolder(item, lines, indentLevel, indent);
    } else {
      serializeBookmark(item, lines, indent);
    }
  }
}

/**
 * Serializes a folder to HTML
 */
function serializeFolder(
  folder: Folder,
  lines: string[],
  indentLevel: number,
  indent: string
): void {
  // Build H3 attributes
  const attrs: string[] = [];
  if (folder.addDate !== undefined) {
    attrs.push(`ADD_DATE="${folder.addDate}"`);
  }
  if (folder.lastModified !== undefined) {
    attrs.push(`LAST_MODIFIED="${folder.lastModified}"`);
  }

  const attrString = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

  // Write folder H3 tag and nested DL inside the DT
  // The DL should be a sibling of H3, both inside DT
  lines.push(`${indent}<DT><H3${attrString}>${escapeHtml(folder.name)}</H3>`);
  lines.push(`${indent}<DL><p>`);
  serializeItems(folder.items, lines, indentLevel + 1);
  lines.push(`${indent}</DL><p>`);
}

/**
 * Serializes a bookmark to HTML
 */
function serializeBookmark(bookmark: Bookmark, lines: string[], indent: string): void {
  // Build A tag attributes
  const attrs: string[] = [`HREF="${escapeHtml(bookmark.href)}"`];
  
  if (bookmark.addDate !== undefined) {
    attrs.push(`ADD_DATE="${bookmark.addDate}"`);
  }
  if (bookmark.lastModified !== undefined) {
    attrs.push(`LAST_MODIFIED="${bookmark.lastModified}"`);
  }
  if (bookmark.icon) {
    // Check if it's a data URI (Firefox format) or base64 string
    if (bookmark.icon.startsWith('data:')) {
      attrs.push(`ICON="${escapeHtml(bookmark.icon)}"`);
    } else {
      attrs.push(`ICON="${escapeHtml(bookmark.icon)}"`);
    }
  }

  const attrString = attrs.join(' ');

  // Write bookmark A tag
  lines.push(`${indent}<DT><A ${attrString}>${escapeHtml(bookmark.name)}</A>`);
}

/**
 * Checks if an item is a Folder
 */
function isFolder(item: Bookmark | Folder): item is Folder {
  return 'items' in item;
}

/**
 * Escapes HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

