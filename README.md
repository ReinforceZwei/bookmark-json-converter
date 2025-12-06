# Bookmark JSON Converter

A TypeScript library for converting browser bookmark files between HTML (Netscape Bookmark format) and JSON. Supports both Chrome and Firefox bookmark exports.

## Features

- **Parse HTML bookmarks**: Convert Netscape bookmark HTML files to structured JSON
- **Serialize to HTML**: Convert JSON bookmark structures back to Netscape HTML format
- **Cross-browser support**: Works with Chrome and Firefox bookmark exports
- **Nested folders**: Full support for hierarchical bookmark organization
- **Metadata preservation**: Maintains bookmark metadata including timestamps and icons
- **TypeScript support**: Fully typed with TypeScript definitions
- **Zero dependencies** (except cheerio for HTML parsing)

## Installation

```bash
npm install bookmark-json-converter
```

## Usage

### Basic Usage

```typescript
import { parse, serialize } from 'bookmark-json-converter';

// Parse HTML bookmark file to JSON
const htmlContent = `<your bookmark HTML content>`;
const bookmarkJson = parse(htmlContent);

// Serialize JSON back to HTML
const htmlOutput = serialize(bookmarkJson);
```

### Working with Files

```typescript
import { parse, serialize } from 'bookmark-json-converter';
import { readFileSync, writeFileSync } from 'fs';

// Read and parse bookmark file
const htmlContent = readFileSync('bookmarks.html', 'utf8');
const bookmarks = parse(htmlContent);

// Modify bookmarks (example: add a new bookmark)
bookmarks.items.push({
  href: 'https://example.com',
  name: 'Example Site',
  addDate: Math.floor(Date.now() / 1000)
});

// Write back to HTML
const updatedHtml = serialize(bookmarks);
writeFileSync('bookmarks-updated.html', updatedHtml, 'utf8');
```

## API Reference

### `parse(html: string): BookmarkFile`

Parses Netscape bookmark HTML content into a structured JSON object.

**Parameters:**
- `html`: String containing the Netscape bookmark HTML content

**Returns:** A `BookmarkFile` object representing the parsed bookmarks

### `serialize(bookmarkFile: BookmarkFile): string`

Serializes a bookmark JSON object back into Netscape HTML format.

**Parameters:**
- `bookmarkFile`: The bookmark structure to serialize

**Returns:** String containing the HTML representation

## Data Types

### `BookmarkFile`
```typescript
interface BookmarkFile {
  name: string;
  items: (Bookmark | Folder)[];
}
```

### `Bookmark`
```typescript
interface Bookmark {
  href: string;
  name: string;
  addDate?: number;      // Unix timestamp
  lastModified?: number; // Unix timestamp
  icon?: string;         // Base64 encoded icon data
  iconUri?: string;      // Icon URI (Firefox)
}
```

### `Folder`
```typescript
interface Folder {
  name: string;
  addDate?: number;           // Unix timestamp
  lastModified?: number;      // Unix timestamp
  personalToolbarFolder?: boolean; // Chrome-specific
  items: (Bookmark | Folder)[];
}
```

## Browser Compatibility

### Chrome Bookmarks
- ✅ Nested folders
- ✅ Bookmark metadata (add date, last modified)
- ✅ Base64 encoded icons
- ✅ Personal toolbar folder attribute

### Firefox Bookmarks
- ✅ Nested folders
- ✅ Bookmark metadata (add date, last modified)
- ✅ Base64 encoded icons
- ✅ Icon URI references

## Examples

### Extract all bookmarks from a folder

```typescript
import { parse } from 'bookmark-json-converter';

const bookmarks = parse(htmlContent);

function extractBookmarks(items: (Bookmark | Folder)[]): Bookmark[] {
  const bookmarks: Bookmark[] = [];

  for (const item of items) {
    if ('href' in item) {
      bookmarks.push(item);
    } else {
      bookmarks.push(...extractBookmarks(item.items));
    }
  }

  return bookmarks;
}

const allBookmarks = extractBookmarks(bookmarks.items);
```

### Find bookmarks by URL pattern

```typescript
import { parse } from 'bookmark-json-converter';

const bookmarks = parse(htmlContent);

function findBookmarksByDomain(bookmarks: (Bookmark | Folder)[], domain: string): Bookmark[] {
  const matches: Bookmark[] = [];

  function search(items: (Bookmark | Folder)[]): void {
    for (const item of items) {
      if ('href' in item && item.href.includes(domain)) {
        matches.push(item);
      } else if ('items' in item) {
        search(item.items);
      }
    }
  }

  search(bookmarks.items);
  return matches;
}

const githubBookmarks = findBookmarksByDomain(bookmarks, 'github.com');
```

### Create a new bookmark structure

```typescript
import { serialize } from 'bookmark-json-converter';

const newBookmarks = {
  name: 'My Bookmarks',
  items: [
    {
      name: 'Favorites',
      addDate: Math.floor(Date.now() / 1000),
      items: [
        {
          href: 'https://github.com',
          name: 'GitHub',
          addDate: Math.floor(Date.now() / 1000)
        },
        {
          href: 'https://stackoverflow.com',
          name: 'Stack Overflow',
          addDate: Math.floor(Date.now() / 1000)
        }
      ]
    }
  ]
};

const html = serialize(newBookmarks);
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
npm test
```

### Running tests with UI

```bash
npm run test:ui
```

## Exporting Bookmarks from Browsers

### Chrome
1. Open Chrome and go to `chrome://bookmarks/`
2. Click the three-dot menu (⋮) in the top right
3. Select "Export bookmarks"
4. Choose a location to save the HTML file

### Firefox
1. Open Firefox and go to `about:config`
2. Search for `browser.bookmarks.autoExportHTML` and set it to `true`
3. Or manually export: `Bookmarks` → `Manage Bookmarks` → `Import and Backup` → `Export Bookmarks to HTML`

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT License - see LICENSE file for details.