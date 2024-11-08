import { ref, watch } from "jsx";
import For from "jsx/components/For";

const LOCAL_KEY_ROOT_DIR = createLocalKey("rootDir");

const [rootDir, setRootDir] = ref(localStorage.getItem(LOCAL_KEY_ROOT_DIR) || "");
const [files, setFiles] = ref<FileInfo[]>([]);

watch(() => localStorage.setItem(LOCAL_KEY_ROOT_DIR, rootDir()));

function createLocalKey<T extends string>(name: T): `loclplyr__${T}` {
  return `loclplyr__${name}`;
}

type FileInfo = { name: string } & ({
  isDir: false,
} | {
  isDir: true,
  files: FileInfo[],
});

function parseFiles(root: FileInfo[], ...paths: string[]) {
  for (const path of paths) {
    const idx = path.indexOf("/");
    if (idx === -1) {
      root.push({ name: path, isDir: false });
      continue;
    }

    const name = path.slice(0, idx);
    const dir = root.find(f => f.name === name);
    if (dir && dir.isDir) {
      parseFiles(dir.files, path.slice(idx + 1));
    }
    else {
      const files: FileInfo[] = [];
      root.push({ name, isDir: true, files });
      parseFiles(files, path.slice(idx + 1));
    }
  }
}

function updateRoot(this: HTMLInputElement) {
  const value = this.value.replaceAll(/\/+$/g, "");
  setRootDir(this.value.startsWith("file://") ? value : `file://${value}`);
}

function readDirectory(this: HTMLInputElement) {
  if (this.files) {
    const paths = Array.from(this.files!).map(file => file.webkitRelativePath);
    setFiles.byRef(files => parseFiles(files, ...paths));
  }
}

function Directory(props: { dir: FileInfo[] }) {
  return (
    <ul>
      <For each={props.dir} do={file => (
        <li style:color={file().isDir ? "skyblue" : "white"}>
          {file().name}
          <template $if={file().isDir}>
            <Directory dir={(file() as { files: FileInfo[] }).files} />
          </template>
        </li>
      )} />
    </ul>
  );
}

document.body.append(
  <main>
    <label class:Input>
      <input
        class:g-delegated
        on:change={updateRoot}
        value={rootDir()}
        placeholder="-"
      />
      <em class:placeholder><i></i> Root directory</em>
    </label>
    <label class:DirInput class:g-btn>
      <i></i> Select directory
      <input class:g-active-hidden type="file" webkitdirectory multiple on:change={readDirectory} />
    </label>
    <h1>{rootDir()}</h1>
    <Directory dir={files()} />
  </main>,
);
