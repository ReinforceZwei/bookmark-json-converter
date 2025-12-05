import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { serialize } from '../src/serializer.js';
import type { BookmarkFile } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Serializer', () => {
  let chromeHtml: string;
  let firefoxHtml: string;

  beforeAll(() => {
    chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf-8');
    firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf-8');
  });

  describe('Basic serialization', () => {
    it('should serialize a simple bookmark', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            href: 'https://example.com',
            name: 'Example',
            addDate: 1234567890,
            lastModified: 1234567890,
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('<!DOCTYPE NETSCAPE-Bookmark-file-1>');
      expect(html).toContain('<A HREF="https://example.com"');
      expect(html).toContain('ADD_DATE="1234567890"');
      expect(html).toContain('Example</A>');
    });

    it('should serialize a folder with bookmarks', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            name: 'My Folder',
            addDate: 1234567890,
            lastModified: 1234567891,
            items: [
              {
                href: 'https://example.com',
                name: 'Example',
                addDate: 1234567892,
              },
            ],
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('<H3 ADD_DATE="1234567890" LAST_MODIFIED="1234567891">My Folder</H3>');
      expect(html).toContain('<DL><p>');
      expect(html).toContain('<A HREF="https://example.com"');
    });

    it('should handle empty folders', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            name: 'Empty Folder',
            items: [],
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('<H3>Empty Folder</H3>');
      expect(html).toContain('<DL><p>');
      expect(html).toContain('</DL><p>');
    });

    it('should escape HTML special characters', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            href: 'https://example.com?q=test&value=1',
            name: 'Test & Example < > " \'',
            addDate: 1234567890,
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('&amp;');
      expect(html).toContain('&lt;');
      expect(html).toContain('&gt;');
      expect(html).toContain('&quot;');
      expect(html).not.toContain('<Test');
    });

    it('should handle bookmarks with icons', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            href: 'https://example.com',
            name: 'Example',
            icon: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('ICON=');
      expect(html).toContain('data:image/png;base64');
    });

    it('should handle optional attributes', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            href: 'https://example.com',
            name: 'Example',
            // No addDate, lastModified, or icon
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('<A HREF="https://example.com">Example</A>');
      expect(html).not.toContain('ADD_DATE');
      expect(html).not.toContain('LAST_MODIFIED');
      expect(html).not.toContain('ICON');
    });
  });

  describe('Nested structures', () => {
    it('should serialize deeply nested folders', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            name: 'Level 1',
            items: [
              {
                name: 'Level 2',
                items: [
                  {
                    name: 'Level 3',
                    items: [
                      {
                        href: 'https://example.com',
                        name: 'Bookmark',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const html = serialize(bookmarkFile);
      expect(html).toContain('Level 1');
      expect(html).toContain('Level 2');
      expect(html).toContain('Level 3');
      expect(html).toContain('Bookmark');
      
      // Check indentation structure
      const lines = html.split('\n');
      const level1Index = lines.findIndex((line) => line.includes('Level 1'));
      const level2Index = lines.findIndex((line) => line.includes('Level 2'));
      const level3Index = lines.findIndex((line) => line.includes('Level 3'));
      const bookmarkIndex = lines.findIndex((line) => line.includes('Bookmark'));

      expect(level1Index).toBeLessThan(level2Index);
      expect(level2Index).toBeLessThan(level3Index);
      expect(level3Index).toBeLessThan(bookmarkIndex);
    });
  });
});

