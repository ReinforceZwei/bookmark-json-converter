import * as cheerio from "cheerio";
import type { BookmarkFile, Folder, Bookmark } from "./types";
import type { Element } from "domhandler";

export function parse(html: string): BookmarkFile {
  const $ = cheerio.load(html);
  const rootFolderName = $("H1").text();
  const items = parseItems($, $("H1 + DL"));
  const bookmarkFile: BookmarkFile = {
    name: rootFolderName,
    items: items,
  };
  return bookmarkFile;
}

function parseItem(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<Element>
): Bookmark | null {
  const href = $el.attr("href");
  const name = $el.text();
  const addDate = $el.attr("add_date");
  const lastModified = $el.attr("last_modified");
  const icon = $el.attr("icon");
  const iconUri = $el.attr("icon_uri");
  if (!href) return null;
  return {
    href,
    name,
    addDate: addDate ? Number(addDate) : undefined,
    lastModified: lastModified ? Number(lastModified) : undefined,
    icon,
    iconUri,
  };
}

function parseItems(
  $: cheerio.CheerioAPI,
  $el: cheerio.Cheerio<Element>
): (Bookmark | Folder)[] {
  const items: (Bookmark | Folder)[] = [];
  // expect $el to be DL container with DT elements
  $el.children("DT").each((i, el) => {
    const $dt = $(el);
    if (isFolder(el)) {
      // $dt is DT > H3
      const folderName = $dt.children("H3").text();
      const addDate = $dt.children("H3").attr("add_date");
      const lastModified = $dt.children("H3").attr("last_modified");
      const personalToolbarFolder = $dt.children("H3").attr("personal_toolbar_folder");
      const folderItems = $dt.children("H3").next();
      // next sibling should be DL
      if (folderItems.children().length > 0) {
        const childItems = parseItems($, folderItems);

        items.push({
          name: folderName,
          addDate: addDate ? Number(addDate) : undefined,
          lastModified: lastModified ? Number(lastModified) : undefined,
          personalToolbarFolder: personalToolbarFolder ? true : undefined,
          items: childItems,
        });
      }
    } else {
      // $dt is DT > A
      const bookmark = parseItem($, $dt.children("A"));
      if (bookmark) {
        items.push(bookmark);
      }
    }
  });
  return items;
}

function isFolder(el: Element): boolean {
  return (el.children[0] as Element).name?.toLowerCase() === "h3";
}
