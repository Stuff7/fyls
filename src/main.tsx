import { ref, watch } from "jsx";
import Directory, { DirInfo, parseFiles } from "./components/Directory";
import { FILES_KEY, navigate, storedRef } from "./utils";
import Video from "./components/Video";

const [videoPath, setVideoPath] = ref("");
const [rootPath, setRootPath] = storedRef("rootDir", v => v || "", v => v);
const [videoOpen, setVideoOpen] = ref(false);

const [rootDir, setRootDir] = ref<DirInfo>((() => {
  const root: DirInfo = { name: "Root", path: "", isDir: true, files: [] };
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

function updateRootDir(this: HTMLInputElement) {
  if (this.files) {
    const paths = Array.from(this.files!).map(file => file.webkitRelativePath);
    localStorage.setItem(FILES_KEY, JSON.stringify(paths));
    setRootDir.byRef(dir => {
      dir.files.length = 0;
      parseFiles(dir, "", ...paths);
    });
  }
}

document.body.append(
  <main class:Home>
    <header>
      <button
        class:title
        class:g-border
        class:g-transparent
        style:padding="0"
        on:click={() => navigate("")}
      >
        <i></i> <strong>Fyls</strong>
      </button>
      <label class:Input>
        <input
          class:g-delegated
          on:change={updateRootPath}
          value={rootPath()}
          placeholder="-"
        />
        <em class:placeholder><i></i> Root directory</em>
      </label>
      <label class:g-btn>
        <i></i> Select directory
        <input class:g-active-hidden type="file" webkitdirectory multiple on:change={updateRootDir} />
      </label>
    </header>
    <Directory
      root={rootPath()}
      dir={currDir()}
      on:navigate={setCurrDir}
      on:file-select={path => {
        setVideoPath(path);
        setVideoOpen(true);
      }}
    />
  </main>,
  <Video src={videoPath()} open={videoOpen()} on:toggle={setVideoOpen} />,
);
