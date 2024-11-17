import For from "jsx/components/For";
import Thumbnail from "./Thumbnail";
import { ref, watchFn } from "jsx";
import { navigate } from "~/utils";

export type FileType = "video" | "image" | "other";

type PathInfo = { name: string, path: string, parent?: DirInfo };

type FileInfo = NonDirInfo | DirInfo;

export type NonDirInfo = PathInfo & {
    isDir: false;
    type: FileType;
};
export type DirInfo = PathInfo & { files: FileInfo[], isDir: true };

type DirectoryProps = {
  root: string,
  dir: DirInfo,
  "on:navigate": (file: DirInfo) => void,
  "on:file-select": (path: string, file: NonDirInfo) => void,
};

export default function Directory(props: DirectoryProps) {
  const root = props.dir as FileInfo;
  const [currFile, setCurrFile] = ref(findRoute());

  function findRoute() {
    const files = location.hash.slice(1).split("/");
    let file: FileInfo | undefined = root;

    for (const name of files) {
      if (!file?.isDir) { break }
      file = file.files.find(f => f.name === name);
      if (!file) { break }
    }

    return file || root;
  }

  const isMedia = (file: FileInfo) => !file.isDir && file.type !== "other";
  const isFile = (file: FileInfo) => !file.isDir && file.type === "other";
  const fileType = (file: FileInfo) => file.isDir ? "other" : file.type;

  watchFn(currFile, () => {
    const file = currFile();
    if (file === props.dir) {
      return;
    }
    if (file.isDir) {
      props["on:navigate"](file);
    }
    else {
      if (file.parent && file.parent.isDir) {
        props["on:navigate"](file.parent);
      }
      if(isMedia(file)) {
        props["on:file-select"](join(props.root, file.path), file);
      }
    }
  });

  return (
    <article class:Directory class:g-rows g:onhashchange={() => setCurrFile(findRoute())}>
      <header>
        <button
          on:click={() => props.dir.parent && navigate(props.dir.parent.path)}
          $disabled={!props.dir.parent}
        >
          <i></i><strong>{props.dir.parent?.name || "No parent"}</strong>
        </button>
        <strong class:title>{props.dir.name}</strong>
        <em>{props.dir.files.length} files</em>
      </header>
      <For each={props.dir.files} do={file => (
        <button
          class:file
          class:directory={file().isDir}
          class:unknown={isFile(file())}
          class:g-btn
          class:g-border
          class:g-transparent
          on:click={() => navigate(file().path)}
        >
          <Thumbnail
            shown={isMedia(file())}
            path={join(props.root, file().path)}
            type={fileType(file())}
          />
          <i $if={file().isDir || isFile(file())} />
          <strong>{file().name}</strong>
        </button>
      )} />
    </article>
  );
}

function join(p1: string, p2: string) {
  return p1 ? `${p1}/${p2}` : p2;
}

function getFileType(name: string): FileType {
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

export function parseFiles(root: DirInfo, fullPath: string, ...paths: string[]) {
  for (const path of paths) {
    const idx = path.indexOf("/");
    if (idx === -1) {
      root.files.push({ name: path, path: join(fullPath, path), type: getFileType(path), parent: root, isDir: false });
      continue;
    }

    const name = path.slice(0, idx);
    const dir = root.files.find(f => f.name === name);
    if (dir && dir.isDir) {
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    }
    else {
      const dir: FileInfo = { name, path: join(fullPath, name), isDir: true, parent: root, files: [] };
      root.files.push(dir);
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    }
  }
}
