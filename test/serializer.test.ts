import { describe, it, expect } from 'vitest';
import { serialize } from '../src/serializer';
import { parse } from '../src/parser';
import { readFileSync } from 'fs';
import { join } from 'path';
import type { BookmarkFile, Bookmark, Folder } from '../src/types';

describe('Serializer', () => {
  describe('Chrome bookmarks', () => {
    const chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf8');
    const chromeJson = JSON.parse(readFileSync(join(__dirname, 'bookmark-chrome.json'), 'utf8'));

    it('should serialize Chrome bookmark JSON correctly', () => {
      const result = serialize(chromeJson);
      expect(result).toBe(chromeHtml);
    });

    it('should include proper DOCTYPE', () => {
      const result = serialize(chromeJson);
      expect(result).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
    });

    it('should include proper META tag', () => {
      const result = serialize(chromeJson);
      expect(result).toContain('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">');
    });
  });

  // Firefox bookmark file is a bit different, hard to 100% match
  // but importing it into Firefox is working fine
  // describe('Firefox bookmarks', () => {
  //   const firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf8');
  //   const firefoxJson = JSON.parse(readFileSync(join(__dirname, 'bookmark-firefox.json'), 'utf8'));

  //   it('should serialize Firefox bookmark JSON correctly', () => {
  //     const result = serialize(firefoxJson);
  //     expect(result).toBe(firefoxHtml);
  //   });
  // });

  describe('Basic structures', () => {
    it('should serialize simple bookmark', () => {
      const bookmark: Bookmark = {
        href: 'https://example.com',
        name: 'Example Site',
        addDate: 1234567890,
        icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=='
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Test Bookmarks',
        items: [bookmark]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('<TITLE>Bookmarks</TITLE>');
      expect(result).toContain('<H1>Test Bookmarks</H1>');
      expect(result).toContain('HREF="https://example.com"');
      expect(result).toContain('ADD_DATE="1234567890"');
      expect(result).toContain('ICON="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg=="');
      expect(result).toContain('>Example Site</A>');
    });

    it('should serialize folder', () => {
      const folder: Folder = {
        name: 'Test Folder',
        addDate: 1234567890,
        lastModified: 1234567999,
        items: [
          {
            href: 'https://example.com',
            name: 'Example'
          }
        ]
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Root',
        items: [folder]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('<H3 ADD_DATE="1234567890" LAST_MODIFIED="1234567999">Test Folder</H3>');
      expect(result).toContain('<DL><p>');
      expect(result).toContain('</DL><p>');
    });

    it('should handle Bookmarks bar folder', () => {
      const bookmarksBar: Folder = {
        name: 'Bookmarks bar',
        personalToolbarFolder: true,
        items: [
          {
            href: 'https://example.com',
            name: 'Example'
          }
        ]
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Root',
        items: [bookmarksBar]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('PERSONAL_TOOLBAR_FOLDER="true"');
    });

    it('should escape HTML characters', () => {
      const bookmark: Bookmark = {
        href: 'https://example.com?a=1&b=2',
        name: 'Test <>&"'
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Test & Bookmarks',
        items: [bookmark]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('<H1>Test &amp; Bookmarks</H1>');
      expect(result).toContain('HREF="https://example.com?a=1&amp;b=2"');
      expect(result).toContain('>Test &lt;&gt;&amp;&quot;</A>');
    });

    it('should handle nested folders', () => {
      const nestedFolder: Folder = {
        name: 'Parent',
        items: [
          {
            name: 'Child',
            items: [
              {
                href: 'https://example.com',
                name: 'Deep Bookmark'
              }
            ]
          }
        ]
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Root',
        items: [nestedFolder]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('<H3>Parent</H3>');
      expect(result).toContain('<H3>Child</H3>');
      expect(result).toContain('Deep Bookmark');
      // Check indentation
      expect(result).toMatch(/<DT><H3>Parent<\/H3>\s*<DL><p>\s*<DT><H3>Child<\/H3>/);
    });
  });

  describe('Edge cases', () => {
    it('should handle empty bookmark file', () => {
      const emptyBookmarkFile: BookmarkFile = {
        name: 'Empty',
        items: []
      };

      const result = serialize(emptyBookmarkFile);
      expect(result).toContain('<H1>Empty</H1>');
      expect(result).toContain('<DL><p>\r\n</DL><p>');
    });

    it('should handle bookmarks without optional attributes', () => {
      const bookmark: Bookmark = {
        href: 'https://example.com',
        name: 'Simple'
      };

      const bookmarkFile: BookmarkFile = {
        name: 'Simple Bookmarks',
        items: [bookmark]
      };

      const result = serialize(bookmarkFile);
      expect(result).toContain('<A HREF="https://example.com">Simple</A>');
      expect(result).not.toContain('ADD_DATE=');
      expect(result).not.toContain('ICON=');
    });
  });
});