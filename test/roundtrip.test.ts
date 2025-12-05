import { describe, it, expect } from 'vitest';
import { parse, serialize } from '../src';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Roundtrip Tests', () => {
  describe('Chrome bookmarks', () => {
    const chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf8');

    it('should maintain data integrity through parse -> serialize -> parse', () => {
      // Parse HTML to JSON
      const parsed = parse(chromeHtml);

      // Serialize back to HTML
      const serialized = serialize(parsed);

      // Parse again
      const reparsed = parse(serialized);

      // Should be identical to original parsed data
      expect(reparsed).toEqual(parsed);
    });

    it('should produce identical HTML after roundtrip', () => {
      const parsed = parse(chromeHtml);
      const serialized = serialize(parsed);

      // The serialized HTML should be functionally equivalent
      // (may have minor formatting differences but same content)
      const reparsed = parse(serialized);
      const reserialized = serialize(reparsed);

      expect(reserialized).toBe(serialized);
    });
  });

  describe('Firefox bookmarks', () => {
    const firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf8');

    it('should maintain data integrity through parse -> serialize -> parse', () => {
      const parsed = parse(firefoxHtml);
      const serialized = serialize(parsed);
      const reparsed = parse(serialized);

      expect(reparsed).toEqual(parsed);
    });
  });

  describe('Complex structures', () => {
    it('should handle complex nested structures', () => {
      const complexBookmarkFile = {
        name: 'Complex Test',
        items: [
          {
            name: 'Folder 1',
            addDate: 1234567890,
            lastModified: 1234567999,
            items: [
              {
                href: 'https://example.com',
                name: 'Bookmark 1',
                addDate: 1234567800,
                icon: 'data:image/png;base64,test'
              },
              {
                name: 'Subfolder',
                items: [
                  {
                    href: 'https://sub.example.com',
                    name: 'Sub Bookmark'
                  }
                ]
              }
            ]
          },
          {
            href: 'https://root.com',
            name: 'Root Bookmark',
            addDate: 1234567000
          }
        ]
      };

      // Roundtrip test
      const serialized = serialize(complexBookmarkFile);
      const reparsed = parse(serialized);
      const reserialized = serialize(reparsed);

      expect(reparsed).toEqual(complexBookmarkFile);
      expect(reserialized).toBe(serialized);
    });

    it('should handle special characters in names and URLs', () => {
      const specialCharsBookmarkFile = {
        name: 'Test & < > " \'',
        items: [
          {
            href: 'https://example.com?a=1&b=2&c=<>"\'',
            name: 'Special & < > " \' chars',
            addDate: 1234567890
          }
        ]
      };

      const serialized = serialize(specialCharsBookmarkFile);
      const reparsed = parse(serialized);

      expect(reparsed).toEqual(specialCharsBookmarkFile);
    });

    // Only chrome supports Bookmarks bar folder
    it('should handle Bookmarks bar folder', () => {
      const bookmarksBarFile = {
        name: 'Bookmarks',
        items: [
          {
            name: 'Bookmarks bar',
            personalToolbarFolder: true,
            items: [
              {
                href: 'https://important.com',
                name: 'Important Site'
              }
            ]
          }
        ]
      };

      const serialized = serialize(bookmarksBarFile);
      const reparsed = parse(serialized);

      expect(reparsed).toEqual(bookmarksBarFile);
      expect(serialized).toContain('PERSONAL_TOOLBAR_FOLDER="true"');
    });
  });
});