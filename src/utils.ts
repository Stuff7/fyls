import type { DirInfo, FileInfo, FileType } from "./types";

const createLocalKey = (name: string) => `fyls__${name}`;
export const FILES_KEY = createLocalKey("files");

export function localStorageGet<T>(
  key: string,
  deserialize: (v: string | null) => T,
) {
  return deserialize(localStorage.getItem(createLocalKey(key)));
}

export function localStorageSet<T>(
  key: string,
  val: T,
  serialize: (v: T) => string = (v) => v as string,
) {
  localStorage.setItem(createLocalKey(key), serialize(val));
}

export function navigate(path: string) {
  location.hash = path ? encodeURI(`#${path}`) : "";
}

export function getFileType(name: string): FileType {
  const idx = name.lastIndexOf(".");
  const ext = idx === -1 ? "" : name.slice(idx);

  if (/\.(mp4|mkv|webm|mov|avi|flv|wmv|m4v)$/i.test(ext)) {
    return "video";
  }
  if (/\.(jpe?g|png|gif|bmp|webp|tiff?|svg)$/i.test(ext)) {
    return "image";
  }
  return "other";
}

export function join(p1: string, p2: string) {
  return p1 ? `${p1}/${p2}` : p2;
}

export function parseFiles(
  root: DirInfo,
  fullPath: string,
  ...paths: string[]
) {
  for (const path of paths) {
    const idx = path.indexOf("/");
    if (idx === -1) {
      root.files.push({
        name: path,
        path: join(fullPath, path),
        type: getFileType(path),
        parent: root,
        isDir: false,
      });
      continue;
    }

    const name = path.slice(0, idx);
    const dir = root.files.find((f) => f.name === name);
    if (dir && dir.isDir) {
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    } else {
      const dir: FileInfo = {
        name,
        path: join(fullPath, name),
        isDir: true,
        parent: root,
        files: [],
      };
      root.files.push(dir);
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    }
  }
}
