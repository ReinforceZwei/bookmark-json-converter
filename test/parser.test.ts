import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse } from '../src/parser.js';
import type { BookmarkFile } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Parser', () => {
  let chromeHtml: string;
  let firefoxHtml: string;

  beforeAll(() => {
    chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf-8');
    firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf-8');
  });

  describe('Chrome bookmark file', () => {
    let result: BookmarkFile;

    beforeAll(() => {
      result = parse(chromeHtml);
    });

    it('should parse the root folder', () => {
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
      expect(Array.isArray(result.items)).toBe(true);
    });

    it('should parse folders correctly', () => {
      const bookmarksBar = result.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      expect(bookmarksBar).toBeDefined();
      expect(bookmarksBar?.addDate).toBe(1761205082);
      expect(bookmarksBar?.lastModified).toBe(1764747611);
      expect(bookmarksBar?.items).toBeDefined();
    });

    it('should parse bookmarks correctly', () => {
      const bookmarksBar = result.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const googleBookmark = bookmarksBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      expect(googleBookmark).toBeDefined();
      if (googleBookmark && !('items' in googleBookmark)) {
        expect(googleBookmark.href).toBe('https://www.google.com/');
        expect(googleBookmark.addDate).toBe(1764747568);
        expect(googleBookmark.icon).toBeDefined();
        expect(googleBookmark.icon?.startsWith('data:image/png;base64,')).toBe(true);
      }
    });

    it('should handle nested folders', () => {
      const bookmarksBar = result.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const folder1 = bookmarksBar?.items.find(
        (item) => 'items' in item && item.name === 'Folder 1'
      ) as BookmarkFile | undefined;

      expect(folder1).toBeDefined();
      expect(folder1?.addDate).toBe(1764747589);
      expect(folder1?.lastModified).toBe(1764747677);

      const nestedFolder = folder1?.items.find(
        (item) => 'items' in item && item.name === 'Nested Folder 1'
      ) as BookmarkFile | undefined;

      expect(nestedFolder).toBeDefined();
      expect(nestedFolder?.addDate).toBe(1764747664);
      expect(nestedFolder?.lastModified).toBe(1764747689);
    });

    it('should handle empty folders', () => {
      const bookmarksBar = result.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const folder2 = bookmarksBar?.items.find(
        (item) => 'items' in item && item.name === 'Folder 2'
      ) as BookmarkFile | undefined;

      expect(folder2).toBeDefined();
      expect(folder2?.items).toEqual([]);
    });
  });

  describe('Firefox bookmark file', () => {
    let result: BookmarkFile;

    beforeAll(() => {
      result = parse(firefoxHtml);
    });

    it('should parse the root folder', () => {
      expect(result).toBeDefined();
      expect(result.items).toBeDefined();
    });

    it('should handle ICON_URI attribute', () => {
      const mozillaFolder = result.items.find(
        (item) => 'items' in item && item.name === 'Mozilla Firefox'
      ) as BookmarkFile | undefined;

      const getHelpBookmark = mozillaFolder?.items.find(
        (item) => !('items' in item) && item.href.includes('support.mozilla.org')
      );

      expect(getHelpBookmark).toBeDefined();
      if (getHelpBookmark && !('items' in getHelpBookmark)) {
        expect(getHelpBookmark.icon).toBeDefined();
      }
    });

    it('should parse folders and bookmarks correctly', () => {
      const bookmarksBar = result.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      expect(bookmarksBar).toBeDefined();
      expect(bookmarksBar?.items.length).toBeGreaterThan(0);

      const googleBookmark = bookmarksBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      expect(googleBookmark).toBeDefined();
      if (googleBookmark && !('items' in googleBookmark)) {
        expect(googleBookmark.href).toBe('https://www.google.com/');
        expect(googleBookmark.addDate).toBe(1764747568);
        expect(googleBookmark.lastModified).toBe(1764747568);
      }
    });
  });

  describe('Edge cases', () => {
    it('should handle missing attributes gracefully', () => {
      const minimalHtml = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
    <DT><A HREF="https://example.com">Example</A>
</DL><p>
      `.trim();

      const result = parse(minimalHtml);
      expect(result.items.length).toBeGreaterThan(0);

      const bookmark = result.items[0];
      if (!('items' in bookmark)) {
        expect(bookmark.href).toBe('https://example.com');
        expect(bookmark.name).toBe('Example');
        expect(bookmark.addDate).toBeUndefined();
        expect(bookmark.lastModified).toBeUndefined();
        expect(bookmark.icon).toBeUndefined();
      }
    });

    it('should throw error for invalid HTML', () => {
      expect(() => parse('invalid html')).toThrow();
    });

    it('should handle empty bookmark file', () => {
      const emptyHtml = `
<!DOCTYPE NETSCAPE-Bookmark-file-1>
<DL><p>
</DL><p>
      `.trim();

      const result = parse(emptyHtml);
      expect(result.items).toEqual([]);
    });
  });
});

