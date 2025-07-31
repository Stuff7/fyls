<script lang="ts">
  import Explorer from "./Explorer.svelte";
  import Gallery from "./Gallery.svelte";
  import type { DirInfo } from "./types";
  import {
    deserializeTree,
    FILES_KEY,
    findRoute,
    localStorageGet,
    localStorageSet,
    navigate,
    parseFiles,
    serializeTree,
  } from "./utils";

  let rootPath = $state(localStorageGet("rootDir", (v) => v || ""));
  $effect(() => localStorageSet("rootDir", rootPath));

  const rootDir = $state<DirInfo>(
    (() => {
      const raw = localStorage.getItem(FILES_KEY);

      if (!raw) {
        return {
          name: "Root",
          path: "",
          isDir: true,
          files: [],
        };
      }

      return deserializeTree(raw);
    })(),
  );

  let currDir = $state<DirInfo>(rootDir);
  let selectedFile = $derived(findRoute(rootPath, rootDir));

  $effect(() => {
    localStorage.setItem(FILES_KEY, serializeTree(rootDir));
  });

  function updateRootPath(this: HTMLInputElement) {
    if (!this.value) return (rootPath = this.value);
    const value = this.value.replaceAll(/\/+$/g, "");
    rootPath = this.value.startsWith("file://") ? value : `file://${value}`;
  }

  function findCurrDir(currDirPath: string, d = rootDir.files) {
    for (const f of d) {
      if (!f.isDir) continue;

      if (f.path === currDirPath) {
        currDir = f;
        break;
      }

      if (currDirPath.startsWith(f.path)) {
        findCurrDir(currDirPath, f.files);
        break;
      }
    }
  }

  function updateRootDir(this: HTMLInputElement) {
    if (this.files) {
      const paths = Array.from(this.files!).map(
        (file) => file.webkitRelativePath,
      );

      const currDirPath = currDir.path;
      rootDir.files.length = 0;

      parseFiles(rootDir, "", ...paths);
      findCurrDir(currDirPath);
    }
  }
</script>

<header
  class="
    grid grid-cols-[auto_1fr_auto] items-center gap-3
    bg-zinc-900/50 p-3 has-[input:focus]:pt-7 transition-[padding]
  "
>
  <button class="plain text-3xl text-amber-300" onclick={() => navigate("")}>
    <i></i> <strong>Fyls</strong>
  </button>
  <label class="named-input text-sm">
    <input onchange={updateRootPath} value={rootPath} placeholder="-" />
    <em class="placeholder"><i></i> Root directory</em>
  </label>
  <label class="button h-full items-center flex gap-2">
    <i></i> Select directory
    <input
      class="invisible absolute -left-[9999px]"
      type="file"
      webkitdirectory
      multiple
      onchange={updateRootDir}
    />
  </label>
</header>
<Explorer root={rootPath} {rootDir} bind:dir={currDir} bind:selectedFile />
<Gallery bind:selectedFile dir={currDir} />
