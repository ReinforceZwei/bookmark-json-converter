export interface Bookmark {
  href: string;
  name: string;
  addDate?: number;
  lastModified?: number;
  icon?: string; // Base64 encoded icon data
}

export interface Folder {
  name: string;
  addDate?: number;
  lastModified?: number;
  items: (Bookmark | Folder)[];
}

// Final Result - Format 2 (hierarchical structure)
export type BookmarkFile = Folder;

