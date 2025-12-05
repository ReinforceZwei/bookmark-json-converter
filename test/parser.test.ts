import { describe, it, expect } from 'vitest';
import { parse } from '../src/parser';
import { readFileSync } from 'fs';
import { join } from 'path';

describe('Parser', () => {
  describe('Chrome bookmarks', () => {
    const chromeHtml = readFileSync(join(__dirname, 'bookmark-chrome.html'), 'utf8');
    const chromeJson = JSON.parse(readFileSync(join(__dirname, 'bookmark-chrome.json'), 'utf8'));

    it('should parse Chrome bookmark HTML correctly', () => {
      const result = parse(chromeHtml);
      expect(result).toEqual(chromeJson);
    });

    it('should extract the correct root folder name', () => {
      const result = parse(chromeHtml);
      expect(result.name).toBe('Bookmarks');
    });

    it("should parse bookmarks with all attributes", () => {
      const result = parse(chromeHtml);
      const bookmark = result.items.find(
        (item) =>
          "items" in item &&
          item.items.find(
            (item) => "href" in item && item.name.includes("GitHub")
          )
      );
      expect(bookmark).toBeDefined();
      if (bookmark && "href" in bookmark) {
        expect(bookmark.href).toBe("https://github.com/");
        expect(bookmark.addDate).toBeDefined();
      }
    });

    it('should parse folders correctly', () => {
      const result = parse(chromeHtml);
      const folder = result.items.find(item => 'items' in item && item.name === 'Bookmarks bar');
      expect(folder).toBeDefined();
      if (folder && 'items' in folder) {
        expect(folder.items).toBeInstanceOf(Array);
        expect(folder.items.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Firefox bookmarks', () => {
    const firefoxHtml = readFileSync(join(__dirname, 'bookmark-firefox.html'), 'utf8');
    const firefoxJson = JSON.parse(readFileSync(join(__dirname, 'bookmark-firefox.json'), 'utf8'));

    it('should parse Firefox bookmark HTML correctly', () => {
      const result = parse(firefoxHtml);
      expect(result).toEqual(firefoxJson);
    });

    it('should extract the correct root folder name', () => {
      const result = parse(firefoxHtml);
      expect(result.name).toBe('Bookmarks Menu');
    });
  });

  describe('Edge cases', () => {
    it('should handle empty bookmark file', () => {
      const emptyHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Empty Bookmarks</TITLE>
<H1>Empty Bookmarks</H1>
<DL><p>
</DL><p>`;

      const result = parse(emptyHtml);
      expect(result.name).toBe('Empty Bookmarks');
      expect(result.items).toEqual([]);
    });

    it('should handle bookmarks without optional attributes', () => {
      const simpleHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Simple</TITLE>
<H1>Simple</H1>
<DL><p>
    <DT><A HREF="https://example.com">Example</A>
</DL><p>`;

      const result = parse(simpleHtml);
      expect(result.items).toHaveLength(1);
      const bookmark = result.items[0];
      if ('href' in bookmark) {
        expect(bookmark.href).toBe('https://example.com');
        expect(bookmark.name).toBe('Example');
        expect(bookmark.addDate).toBeUndefined();
        expect(bookmark.icon).toBeUndefined();
      }
    });

    it('should handle nested folders', () => {
      const nestedHtml = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<TITLE>Nested</TITLE>
<H1>Nested</H1>
<DL><p>
    <DT><H3>Folder 1</H3>
    <DL><p>
        <DT><H3>Subfolder</H3>
        <DL><p>
            <DT><A HREF="https://deep.com">Deep Link</A>
        </DL><p>
    </DL><p>
</DL><p>`;

      const result = parse(nestedHtml);
      expect(result.items).toHaveLength(1);
      const folder1 = result.items[0];
      if ('items' in folder1) {
        expect(folder1.items).toHaveLength(1);
        const subfolder = folder1.items[0];
        if ('items' in subfolder) {
          expect(subfolder.items).toHaveLength(1);
          const bookmark = subfolder.items[0];
          if ('href' in bookmark) {
            expect(bookmark.href).toBe('https://deep.com');
            expect(bookmark.name).toBe('Deep Link');
          }
        }
      }
    });
  });
});