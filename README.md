# bookmark-json-converter

A js library to convert HTML bookmark file to json and convert back.

## Design choice

```ts
interface Bookmark {
  href: string;
  name: string;
  addDate?: number;
  lastModified?: number;
  icon?: string; // Base64
}
```

Format 1:
```ts
interface Folder {
  name: string;
  addDate?: number;
  lastModified?: number;
  level: number;
}

interface BookmarkWithFolder extends Bookmark {
  folder: Folder[];
}

// Final Result
type Result = BookmarkWithFolder[];
```

Example
```json
[
  {
    "name": "Google",
    "href": "https://www.google.com/",
    "addDate": 1764747568,
    "icon": "base64...",
    "folder": [
      {
        "name": "Bookmarks bar",
        "addDate": 1761205082,
        "lastModified": 1764747611,
        "level": 1
      },
      {
        "name": "Folder 1",
        "addDate": 1764747589,
        "lastModified": 1764747677,
        "level": 2
      }
    ]
  }
]
```

Format 2:
```ts
interface Folder {
  name: string;
  addDate?: number;
  lastModified?: number;
  items: (Bookmark | Folder)[];
}

// Final Result
type Result = Folder;
```