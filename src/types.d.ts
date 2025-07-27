export type FileType = "video" | "image" | "other";

type PathInfo = { name: string; path: string; parent?: DirInfo };

export type DirInfo = PathInfo & { files: FileInfo[]; isDir: true };

export type NonDirInfo = PathInfo & {
  isDir: false;
  type: FileType;
};

type FileInfo = NonDirInfo | DirInfo;

export type FileDetails = FileInfo & { src: string };
