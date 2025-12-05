import type { BookmarkFile, Folder, Bookmark } from './types';

export function serialize(bookmarkFile: BookmarkFile): string {
  const lines: string[] = [];

  // DOCTYPE and comments
  lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
  lines.push('<!-- This is an automatically generated file.');
  lines.push('     It will be read and overwritten.');
  lines.push('     DO NOT EDIT! -->');
  lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
  lines.push('<TITLE>Bookmarks</TITLE>');
  lines.push(`<H1>${escapeHtml(bookmarkFile.name)}</H1>`);

  // Root DL container
  lines.push('<DL><p>');
  serializeItems(bookmarkFile.items, lines, 1);
  lines.push('</DL><p>');

  return lines.join('\r\n');
}

function serializeItems(items: (Bookmark | Folder)[], lines: string[], indent: number): void {
  const indentStr = '    '.repeat(indent);

  for (const item of items) {
    if (isFolder(item)) {
      // Folder
      const attrs = [];
      if (item.addDate !== undefined) {
        attrs.push(`ADD_DATE="${item.addDate}"`);
      }
      if (item.lastModified !== undefined) {
        attrs.push(`LAST_MODIFIED="${item.lastModified}"`);
      }
      if (item.personalToolbarFolder !== undefined) {
        attrs.push(`PERSONAL_TOOLBAR_FOLDER="${item.personalToolbarFolder}"`);
      }

      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';
      lines.push(`${indentStr}<DT><H3${attrStr}>${escapeHtml(item.name)}</H3>`);
      lines.push(`${indentStr}<DL><p>`);
      serializeItems(item.items, lines, indent + 1);
      lines.push(`${indentStr}</DL><p>`);
    } else {
      // Bookmark
      const attrs = [`HREF="${escapeHtml(item.href)}"`];
      if (item.addDate !== undefined) {
        attrs.push(`ADD_DATE="${item.addDate}"`);
      }
      if (item.lastModified !== undefined) {
        attrs.push(`LAST_MODIFIED="${item.lastModified}"`);
      }
      if (item.iconUri !== undefined) {
        attrs.push(`ICON_URI="${escapeHtml(item.iconUri)}"`);
      }
      if (item.icon !== undefined) {
        attrs.push(`ICON="${escapeHtml(item.icon)}"`);
      }

      const attrStr = ' ' + attrs.join(' ');
      lines.push(`${indentStr}<DT><A${attrStr}>${escapeHtml(item.name)}</A>`);
    }
  }
}

function isFolder(item: Bookmark | Folder): item is Folder {
  return 'items' in item;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

