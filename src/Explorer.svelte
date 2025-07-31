<script lang="ts">
  import Thumbnail from "./Thumbnail.svelte";
  import {
    disableSpace,
    findRoute,
    getPath,
    localStorageGet,
    localStorageSet,
    navigate,
  } from "./utils";
  import type { DirInfo, FileDetails, FileInfo } from "./types";
  import RangeInput from "./RangeInput.svelte";

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

  type ViewStyle = "grid" | "list";
  let viewStyle = $state<ViewStyle>(
    localStorageGet("explorer-view-style", (v) => v as ViewStyle) || "grid",
  );
  let numCols = $state(localStorageGet("explorer-cols", Number) || 8);

  const thumbnailSize = $derived(window.innerWidth / numCols - 30);

  $effect(() => {
    dir.files.sort((a, b) => {
      if (a.isDir !== b.isDir) {
        return +b.isDir - +a.isDir;
      }
      return a.name.localeCompare(b.name);
    });
  });

  $effect(() => localStorageSet("explorer-view-style", viewStyle, String));
  $effect(() => localStorageSet("explorer-cols", numCols, String));

  const isMedia = (file: FileInfo) => !file.isDir && file.type !== "other";
  const isFile = (file: FileInfo) => !file.isDir && file.type === "other";
  const fileType = (file: FileInfo) => (file.isDir ? "other" : file.type);
  const fileIcon = (file: FileInfo) => {
    if (file.isDir) return "";
    if (file.type === "video") return "";
    if (file.type === "image") return "";
    return "";
  };

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
<article
  class="explorer"
  class:list-view={viewStyle === "list"}
  style:--thumbnail-size={`${thumbnailSize}px`}
>
  <header class:z-10={selectedFile.isDir}>
    <button
      onclick={() => dir.parent && navigate(dir.parent.path)}
      disabled={!dir.parent}
    >
      <i></i>
      <strong>{dir.parent?.name || "No parent"}</strong>
    </button>
    <strong class="title">{dir.path}</strong>
    <em>{dir.files.length} files</em>
    <div style:flex={1}></div>
    {#if viewStyle === "grid"}
      <strong>{numCols} columns</strong>
      <RangeInput
        bind:value={numCols}
        min={1}
        max={12}
        step={1}
        formatter={(v) => Math.round(v)}
      />
    {/if}
    <fieldset class="flex" aria-label="Toggle between grid and list views">
      {#snippet displayOption(icon: string, view: ViewStyle)}
        <label
          class="flex items-center gap-2 p-2 cursor-pointer has-checked:text-zinc-900 has-checked:bg-amber-300 rounded-lg"
        >
          <input
            type="radio"
            name="view"
            value={view}
            aria-label={`${view} view`}
            class="sr-only"
            checked={viewStyle === view}
            onchange={(v) => v.currentTarget.checked && (viewStyle = view)}
          />
          <i class="block px-4 py-2">
            {icon}
          </i>
          {#if viewStyle === view}
            <span class="capitalize">{view}</span>
          {/if}
        </label>
      {/snippet}

      {@render displayOption("", "grid")}
      {@render displayOption("", "list")}
    </fieldset>
  </header>
  {#each dir.files as file (file.path)}
    <button
      class="file compact no-color"
      class:directory={file.isDir}
      class:unknown={isFile(file)}
      onclick={() => navigate(file.path)}
      onkeydown={disableSpace}
    >
      {#if viewStyle === "grid"}
        <Thumbnail
          shown={isMedia(file)}
          path={getPath(root, file.path)}
          ftype={fileType(file)}
          size={thumbnailSize}
        />
        {#if file.isDir || isFile(file)}
          <i></i>
        {/if}
      {:else if viewStyle === "list"}
        <i>{fileIcon(file)}</i>
      {/if}
      <strong class="break-all">{file.name}</strong>
    </button>
  {/each}
</article>
