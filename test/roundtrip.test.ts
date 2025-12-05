import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { parse, serialize } from '../src/index.js';
import type { BookmarkFile } from '../src/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Round-trip conversion', () => {
  let chromeHtml: string;
  let firefoxHtml: string;

  beforeAll(() => {
    chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf-8');
    firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf-8');
  });

  describe('Chrome bookmark file', () => {
    it('should preserve structure after round-trip', () => {
      const original = parse(chromeHtml);
      const serialized = serialize(original);
      const reparsed = parse(serialized);

      expect(reparsed.items.length).toBe(original.items.length);
      
      // Check that bookmarks bar exists in both
      const originalBar = original.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;
      
      const reparsedBar = reparsed.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      expect(originalBar).toBeDefined();
      expect(reparsedBar).toBeDefined();
      expect(originalBar?.items.length).toBe(reparsedBar?.items.length);
    });

    it('should preserve bookmark data', () => {
      const original = parse(chromeHtml);
      const serialized = serialize(original);
      const reparsed = parse(serialized);

      const originalBar = original.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const originalGoogle = originalBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      const reparsedBar = reparsed.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const reparsedGoogle = reparsedBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      expect(originalGoogle).toBeDefined();
      expect(reparsedGoogle).toBeDefined();

      if (originalGoogle && !('items' in originalGoogle) && 
          reparsedGoogle && !('items' in reparsedGoogle)) {
        expect(reparsedGoogle.href).toBe(originalGoogle.href);
        expect(reparsedGoogle.name).toBe(originalGoogle.name);
        expect(reparsedGoogle.addDate).toBe(originalGoogle.addDate);
        expect(reparsedGoogle.icon).toBe(originalGoogle.icon);
      }
    });

    it('should preserve nested folder structure', () => {
      const original = parse(chromeHtml);
      const serialized = serialize(original);
      const reparsed = parse(serialized);

      const originalBar = original.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const originalFolder1 = originalBar?.items.find(
        (item) => 'items' in item && item.name === 'Folder 1'
      ) as BookmarkFile | undefined;

      const originalNested = originalFolder1?.items.find(
        (item) => 'items' in item && item.name === 'Nested Folder 1'
      ) as BookmarkFile | undefined;

      const reparsedBar = reparsed.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const reparsedFolder1 = reparsedBar?.items.find(
        (item) => 'items' in item && item.name === 'Folder 1'
      ) as BookmarkFile | undefined;

      const reparsedNested = reparsedFolder1?.items.find(
        (item) => 'items' in item && item.name === 'Nested Folder 1'
      ) as BookmarkFile | undefined;

      expect(originalNested).toBeDefined();
      expect(reparsedNested).toBeDefined();
      expect(originalNested?.addDate).toBe(reparsedNested?.addDate);
      expect(originalNested?.lastModified).toBe(reparsedNested?.lastModified);
    });
  });

  describe('Firefox bookmark file', () => {
    it('should preserve structure after round-trip', () => {
      const original = parse(firefoxHtml);
      const serialized = serialize(original);
      const reparsed = parse(serialized);

      expect(reparsed.items.length).toBe(original.items.length);
    });

    it('should preserve bookmark data including icons', () => {
      const original = parse(firefoxHtml);
      const serialized = serialize(original);
      const reparsed = parse(serialized);

      const originalBar = original.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const originalGoogle = originalBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      const reparsedBar = reparsed.items.find(
        (item) => 'items' in item && item.name === 'Bookmarks bar'
      ) as BookmarkFile | undefined;

      const reparsedGoogle = reparsedBar?.items.find(
        (item) => !('items' in item) && item.name === 'Google'
      );

      expect(originalGoogle).toBeDefined();
      expect(reparsedGoogle).toBeDefined();

      if (originalGoogle && !('items' in originalGoogle) && 
          reparsedGoogle && !('items' in reparsedGoogle)) {
        expect(reparsedGoogle.href).toBe(originalGoogle.href);
        expect(reparsedGoogle.name).toBe(originalGoogle.name);
        expect(reparsedGoogle.addDate).toBe(originalGoogle.addDate);
        expect(reparsedGoogle.lastModified).toBe(originalGoogle.lastModified);
        expect(reparsedGoogle.icon).toBe(originalGoogle.icon);
      }
    });
  });

  describe('Complex structures', () => {
    it('should handle multiple folders and bookmarks', () => {
      const bookmarkFile: BookmarkFile = {
        name: '',
        items: [
          {
            name: 'Folder A',
            addDate: 1000,
            items: [
              {
                href: 'https://a.com',
                name: 'Link A',
                addDate: 1001,
              },
              {
                name: 'Subfolder A',
                items: [
                  {
                    href: 'https://suba.com',
                    name: 'Sub Link A',
                    addDate: 1002,
                  },
                ],
              },
            ],
          },
          {
            name: 'Folder B',
            addDate: 2000,
            items: [
              {
                href: 'https://b.com',
                name: 'Link B',
                addDate: 2001,
              },
            ],
          },
        ],
      };

      const serialized = serialize(bookmarkFile);
      const reparsed = parse(serialized);

      expect(reparsed.items.length).toBe(2);
      expect(reparsed.items[0]).toHaveProperty('name', 'Folder A');
      expect(reparsed.items[1]).toHaveProperty('name', 'Folder B');

      const folderA = reparsed.items[0] as BookmarkFile;
      expect(folderA.items.length).toBe(2);
      expect(folderA.addDate).toBe(1000);
    });
  });
});

