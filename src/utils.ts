import type { DirInfo, FileDetails, FileInfo, FileType } from "./types";

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

export function padNum(n: number, len = 2) {
  return n.toString().padStart(len, "0");
}

export function timestamp(seconds: number) {
  let s = seconds / 60;
  let m = Math.floor(s);
  s = Math.round((s - m) * 60);
  const h = Math.floor(m / 60);
  m -= h * 60;

  return (h ? [h, m, s] : [m, s]).map((n) => padNum(n, 2)).join(":");
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

export function getNameFromPath(path: string) {
  const idx = path.lastIndexOf("/");
  if (idx === -1) {
    return path;
  }

  return path.slice(idx + 1);
}

export function percentify(n: number) {
  return `${Math.round(n * 100)}%`;
}

export function saturateNum(n: number, min: number, max: number) {
  if (n < min) {
    return saturateNum(max - (min - n), min, max);
  }
  if (n > max) {
    return saturateNum(min + (n - max), min, max);
  }
  return n;
}

export function withDelayedCleanup(
  action: () => void,
  cleanup: () => void,
  delay = 1e3,
) {
  let hideTimeout = 0;
  return () => {
    action();
    clearTimeout(hideTimeout);
    hideTimeout = window.setTimeout(cleanup, delay);
  };
}

export function getPath(root: string, filepath: string) {
  return encodeURI(join(root, filepath));
}

export function findRoute(root: string, rootDir: DirInfo) {
  const hash = decodeURI(location.hash);
  const files = hash.slice(1).split("/");
  const parent = {
    ...rootDir,
    src: getPath(root, rootDir.path),
  };
  let file: FileDetails | undefined = parent;

  for (const name of files) {
    if (!file?.isDir) {
      break;
    }

    const match = file.files.find((f) => f.name === name);
    console.log("MATCH ", name, { ...file }, match ? { ...match } : match);
    if (!match) {
      file = undefined;
      break;
    }
    file = { ...match, src: getPath(root, match.path) };
  }

  console.log("RET", hash, file || { ...parent });
  return file || parent;
}
