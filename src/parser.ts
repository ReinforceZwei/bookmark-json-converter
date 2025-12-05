import * as cheerio from 'cheerio';
import type { Bookmark, Folder, BookmarkFile } from './types.js';

/**
 * Parses a NETSCAPE-Bookmark-file-1 HTML file into a hierarchical JSON structure
 * @param html - The HTML content of the bookmark file
 * @returns A Folder object representing the root of the bookmark hierarchy
 */
export function parse(html: string): BookmarkFile {
  const $ = cheerio.load(html, {
    xml: {
      decodeEntities: false,
    },
  });

  // Find the root DL element
  const rootDl = $('DL').first();
  if (rootDl.length === 0) {
    throw new Error('Invalid bookmark file: No root DL element found');
  }

  // Create root folder (unnamed, contains all top-level items)
  const rootFolder: Folder = {
    name: '',
    items: [],
  };

  // Parse the root DL element
  parseDlElement($, rootDl, rootFolder);

  return rootFolder;
}

/**
 * Recursively parses a DL (definition list) element and its children
 */
function parseDlElement(
  $: cheerio.CheerioAPI,
  dlElement: cheerio.Cheerio<any>,
  parentFolder: Folder
): void {
  // Bookmark files wrap content in <p> tags, so we need to look inside them
  // Get all DT elements that are direct children of <p> tags within this DL
  // or direct children of the DL itself
  const dtElements = dlElement.find('> DT, > p > DT');
  
  // Also handle case where DL contains multiple <p> tags, each with DTs
  // We need to process them in order, so let's get all <p> tags and their DTs
  const pTags = dlElement.children('p');
  const dtList: cheerio.Cheerio<any>[] = [];
  
  pTags.each((_, pTag) => {
    const $p = $(pTag);
    $p.children('DT').each((_, dt) => {
      dtList.push($(dt));
    });
  });
  
  // Also add direct DT children (if any)
  dlElement.children('DT').each((_, dt) => {
    dtList.push($(dt));
  });
  
  // Process all collected DTs
  dtList.forEach(($dt) => {
    const h3 = $dt.children('H3').first();
    const a = $dt.children('A').first();

    if (h3.length > 0) {
      // This is a folder
      const folder = parseFolder($, h3);
      parentFolder.items.push(folder);

      // The nested DL can be:
      // 1. A sibling of the H3, inside the DT element (when DT is inside <p>)
      // 2. A sibling of the DT itself (when DT is direct child of DL)
      let nestedDl = h3.nextAll('DL').first();
      
      // If not found inside DT, check if DL is a sibling of the DT
      if (nestedDl.length === 0) {
        nestedDl = $dt.next('DL').first();
      }
      
      if (nestedDl.length > 0) {
        parseDlElement($, nestedDl, folder);
      }
    } else if (a.length > 0) {
      // This is a bookmark
      const bookmark = parseBookmark($, a);
      parentFolder.items.push(bookmark);
    }
  });
}

/**
 * Parses an H3 element representing a folder
 */
function parseFolder($: cheerio.CheerioAPI, h3: cheerio.Cheerio<any>): Folder {
  const name = h3.text().trim();
  const addDate = parseTimestamp(h3.attr('ADD_DATE'));
  const lastModified = parseTimestamp(h3.attr('LAST_MODIFIED'));

  return {
    name,
    addDate,
    lastModified,
    items: [],
  };
}

/**
 * Parses an A element representing a bookmark
 */
function parseBookmark($: cheerio.CheerioAPI, a: cheerio.Cheerio<any>): Bookmark {
  const href = a.attr('HREF') || '';
  const name = a.text().trim();
  const addDate = parseTimestamp(a.attr('ADD_DATE'));
  const lastModified = parseTimestamp(a.attr('LAST_MODIFIED'));
  
  // Extract icon - prefer ICON attribute, fallback to ICON_URI (Firefox)
  let icon = a.attr('ICON');
  if (!icon) {
    const iconUri = a.attr('ICON_URI');
    // If ICON_URI is a data URI, extract it; otherwise ignore
    if (iconUri && iconUri.startsWith('data:')) {
      icon = iconUri;
    }
  }

  return {
    href,
    name,
    addDate,
    lastModified,
    icon: icon || undefined,
  };
}

/**
 * Parses a timestamp string to a number
 */
function parseTimestamp(timestamp: string | undefined): number | undefined {
  if (!timestamp) {
    return undefined;
  }
  const parsed = parseInt(timestamp, 10);
  return isNaN(parsed) ? undefined : parsed;
}

