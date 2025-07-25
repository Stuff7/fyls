<script lang="ts">
  import Thumbnail from "./Thumbnail.svelte";
  import { join, navigate } from "./utils";
  import type { DirInfo, FileInfo, NonDirInfo } from "./types";

  type Props = {
    root: string;
    dir: DirInfo;
    onFileSelect: (path: string, file: NonDirInfo) => void;
  };

  let { root, dir = $bindable(), onFileSelect }: Props = $props();

  const croot = dir as FileInfo;
  let currFile = $state(findRoute());

  function findRoute() {
    const hash = decodeURI(location.hash);
    const files = hash.slice(1).split("/");
    let file: FileInfo | undefined = croot;

    for (const name of files) {
      if (!file?.isDir) {
        break;
      }
      file = file.files.find((f) => f.name === name);
      if (!file) {
        break;
      }
    }

    return file || croot;
  }

  const isMedia = (file: FileInfo) => !file.isDir && file.type !== "other";
  const isFile = (file: FileInfo) => !file.isDir && file.type === "other";
  const fileType = (file: FileInfo) => (file.isDir ? "other" : file.type);

  $effect(() => {
    const file = currFile;
    if (file === dir) return;
    if (typeof file === "string") return;
    if (file.isDir) {
      dir = file;
    } else {
      if (file.parent && file.parent.isDir) {
        dir = file.parent;
      }
      if (isMedia(file)) {
        onFileSelect(join(root, file.path), file);
      }
    }
  });
</script>

<svelte:window on:hashchange={() => (currFile = findRoute())} />
<article class="explorer">
  <header>
    <button
      onclick={() => dir.parent && navigate(dir.parent.path)}
      disabled={!dir.parent}
    >
      <i></i>
      <strong>{dir.parent?.name || "No parent"}</strong>
    </button>
    <strong class="title">{dir.name}</strong>
    <em>{dir.files.length} files</em>
  </header>
  {#each dir.files as file}
    <button
      class:file
      class:directory={file.isDir}
      class:unknown={isFile(file)}
      class="button no-color"
      onclick={() => navigate(file.path)}
    >
      <Thumbnail
        shown={isMedia(file)}
        path={join(root, file.path)}
        ftype={fileType(file)}
      />
      {#if file.isDir || isFile(file)}
        <i></i>
      {/if}
      <strong>{file.name}</strong>
    </button>
  {/each}
</article>
