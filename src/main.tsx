import { ref, watch } from "jsx";
import Directory, { DirInfo, parseFiles } from "./components/Directory";
import { FILES_KEY, storedRef } from "./utils";

const [videoPath, setVideoPath] = ref("");
const [rootPath, setRootPath] = storedRef("rootDir", v => v || "", v => v);

const [rootDir, setRootDir] = ref<DirInfo>((() => {
  const root = { name: "Root", isDir: true, files: [] };
  const paths = JSON.parse(localStorage.getItem(FILES_KEY) || "[]");
  parseFiles(root, "", ...paths);
  return root;
})());

const [currDir, setCurrDir] = ref<DirInfo>(rootDir());
watch(() => setCurrDir(rootDir()));

function updateRootPath(this: HTMLInputElement) {
  const value = this.value.replaceAll(/\/+$/g, "");
  setRootPath(this.value.startsWith("file://") ? value : `file://${value}`);
}

function updateRootDir(paths: string[]) {
  localStorage.setItem("loclplyr__files", JSON.stringify(paths));
  setRootDir.byRef(dir => {
    dir.files.length = 0;
    parseFiles(dir, "", ...paths);
  });
}

document.body.append(
  <main>
    <label class:Input>
      <input
        class:g-delegated
        on:change={updateRootPath}
        value={rootPath()}
        placeholder="-"
      />
      <em class:placeholder><i></i> Root directory</em>
    </label>
    <div>
      <video $if={!!videoPath()} $src={videoPath()} controls />
    </div>
    <button on:click={() => localStorage.removeItem(FILES_KEY)}>Clear</button>
    <h1>{rootPath()}</h1>
    <Directory
      root={rootPath()}
      dir={currDir()}
      on:navigate={setCurrDir}
      on:root-change={updateRootDir}
      on:file-select={setVideoPath}
    />
  </main>,
);
