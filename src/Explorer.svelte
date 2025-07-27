<script lang="ts">
  import Thumbnail from "./Thumbnail.svelte";
  import { findRoute, getPath, navigate } from "./utils";
  import type { DirInfo, FileDetails, FileInfo } from "./types";

  type Props = {
    root: string;
    rootDir: DirInfo;
    dir: DirInfo;
    selectedFile: FileDetails;
  };

  let {
    root,
    rootDir,
    dir = $bindable(),
    selectedFile = $bindable(),
  }: Props = $props();

  const isMedia = (file: FileInfo) => !file.isDir && file.type !== "other";
  const isFile = (file: FileInfo) => !file.isDir && file.type === "other";
  const fileType = (file: FileInfo) => (file.isDir ? "other" : file.type);

  $effect(() => {
    const file = selectedFile;
    if (file.path === dir.path || typeof file === "string") return;

    if (file.isDir) {
      dir = file;
    } else {
      if (file.parent && file.parent.isDir) {
        dir = file.parent;
      }
      if (isMedia(file)) {
        selectedFile = file;
      }
    }
  });
</script>

<svelte:window
  on:hashchange={() => (selectedFile = findRoute(root, rootDir))}
/>
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
  {#each dir.files as file (file.path)}
    <button
      class:file
      class:directory={file.isDir}
      class:unknown={isFile(file)}
      class="button no-color"
      onclick={() => {
        navigate(file.path);
        console.log(file.path);
      }}
    >
      <Thumbnail
        shown={isMedia(file)}
        path={getPath(root, file.path)}
        ftype={fileType(file)}
      />
      {#if file.isDir || isFile(file)}
        <i></i>
      {/if}
      <strong class="break-all">{file.name}</strong>
    </button>
  {/each}
</article>
