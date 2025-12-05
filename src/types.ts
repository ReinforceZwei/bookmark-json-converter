export interface Bookmark {
    href: string;
    name: string;
    addDate?: number;
    lastModified?: number;
    icon?: string;
    iconUri?: string;
}

export interface Folder {
    name: string;
    addDate?: number;
    lastModified?: number;
    personalToolbarFolder?: boolean; // only for chrome
    items: (Bookmark | Folder)[];
}

export type BookmarkFile = Folder;

