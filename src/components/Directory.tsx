import For from "jsx/components/For";
import Thumbnail from "./Thumbnail";

type FileInfo = { name: string, path: string } & ({
  isDir: false,
} | ({
  isDir: true,
} & DirInfo));

export type DirInfo = { name: string, files: FileInfo[], parent?: DirInfo };

type DirectoryProps = {
  root: string,
  dir: DirInfo,
  "on:navigate": (file: DirInfo) => void,
  "on:file-select": (path: string) => void,
  "on:root-change": (paths: string[]) => void,
};

export default function Directory(props: DirectoryProps) {
  function readDirectory(this: HTMLInputElement) {
    if (this.files) {
      props["on:root-change"](Array.from(this.files!).map(file => file.webkitRelativePath));
    }
  }

  function openFile(file: FileInfo) {
    if (file.isDir) {
      props["on:navigate"](file);
    }
    else {
      props["on:file-select"](join(props.root, file.path));
    }
  }

  return (
    <article class:Directory class:g-rows>
      <label class:g-btn>
        <i></i> Select directory
        <input class:g-active-hidden type="file" webkitdirectory multiple on:change={readDirectory} />
      </label>
      <article class:files>
        <header>
          <button
            on:click={() => props.dir.parent && props["on:navigate"](props.dir.parent)}
            $disabled={!props.dir.parent}
          >
            <i></i><strong>{props.dir.parent?.name}</strong>
          </button>
          <strong class:title>{props.dir.name}</strong>
          <em>{props.dir.files.length} files</em>
        </header>
        <For each={props.dir.files} do={file => (
          <div
            class:file
            class:directory={file().isDir}
            class:g-btn={file().isDir}
            class:g-border
            on:click={() => openFile(file())}
          >
            <Thumbnail
              shown={!file().isDir}
              path={join(props.root, file().path)}
            />
            <strong>
              <i $if={file().isDir}></i> {file().name}
            </strong>
          </div>
        )} />
      </article>
    </article>
  );
}

function join(p1: string, p2: string) {
  return p1 ? `${p1}/${p2}` : p2;
}

export function parseFiles(root: DirInfo, fullPath: string, ...paths: string[]) {
  for (const path of paths) {
    const idx = path.indexOf("/");
    if (idx === -1) {
      root.files.push({ name: path, path: join(fullPath, path), isDir: false });
      continue;
    }

    const name = path.slice(0, idx);
    const dir = root.files.find(f => f.name === name);
    if (dir && dir.isDir) {
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    }
    else {
      const dir = { name, path: join(fullPath, name), isDir: true, parent: root, files: [] };
      root.files.push(dir);
      parseFiles(dir, join(fullPath, name), path.slice(idx + 1));
    }
  }
}
