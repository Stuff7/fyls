export type FileType = "video" | "image" | "other";

export type NonDirInfo = PathInfo & {
  isDir: false;
  type: FileType;
};

type PathInfo = { name: string; path: string; parent?: DirInfo };
type FileInfo = NonDirInfo | DirInfo;

export type DirInfo = PathInfo & { files: FileInfo[]; isDir: true };
