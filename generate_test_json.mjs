import { parse } from './dist/parser.js';
import fs from 'fs';

// For Firefox
const firefoxHtml = fs.readFileSync('test/bookmark-firefox.html', 'utf8');
const firefoxBookmarkFile = parse(firefoxHtml);
fs.writeFileSync(
  'test/bookmark-firefox.json',
  JSON.stringify(firefoxBookmarkFile, null, 2),
  'utf8'
);

// For Chrome
const chromeHtml = fs.readFileSync('test/bookmark-chrome.html', 'utf8');
const chromeBookmarkFile = parse(chromeHtml);
fs.writeFileSync(
  'test/bookmark-chrome.json',
  JSON.stringify(chromeBookmarkFile, null, 2),
  'utf8'
);