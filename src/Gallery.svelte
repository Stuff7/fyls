<script lang="ts">
  import {
    controlsListener,
    doDrag,
    doWheelZoom,
    endDrag,
    getControls,
    isFullscreen,
    isHorizontal,
    MAX_ZOOM,
    resetAllControls,
    resetZoom,
    rotationDeg,
    startDrag,
    toggleFullscreen,
    translationPx,
  } from "./controls";
  import RangeInput from "./RangeInput.svelte";
  import type { DirInfo } from "./types";
  import { getNameFromPath, percentify, join } from "./utils";

  type Props = {
    root: string;
    src: string;
    open: boolean;
    dir: DirInfo;
  };

  let { root, src = $bindable(), open = $bindable(), dir }: Props = $props();

  let container = $state<HTMLElement>();
  const controls = $state(getControls());
</script>

<svelte:window
  onkeydown={(e) => {
    controlsListener(controls, e, container);
    if (e.key === "ArrowLeft") {
      const idx = dir.files.findIndex((f) => join(root, f.path) === src);
      if (idx > 0) src = join(root, dir.files[idx - 1].path);
    } else if (e.key === "ArrowRight") {
      const idx = dir.files.findIndex((f) => join(root, f.path) === src);
      if (idx < dir.files.length) src = join(root, dir.files[idx + 1].path);
    }
  }}
  onfullscreenchange={() => (controls.isFullscreen = isFullscreen(container))}
/>
{#if open}
  <section
    class="media gallery"
    role="dialog"
    tabindex="0"
    bind:this={container}
    onwheel={(e) => doWheelZoom(controls, e)}
    onmousedown={(e) => startDrag(controls, e)}
    onmousemove={(e) => {
      controls.showControls();
      doDrag(controls, e);
    }}
    onmouseup={() => endDrag(controls)}
    ondblclick={() => toggleFullscreen(container)}
  >
    <header>
      <strong class="title">{getNameFromPath(src)} | Q / E to rotate</strong>
      <button class="icon no-color" onclick={() => (open = !open)}>  </button>
    </header>
    <footer>
      <span class="control">
        <strong>{percentify(controls.zoom)}</strong>
        <button class="icon" onclick={() => resetZoom(controls)}>  </button>
        <RangeInput
          min={0.1}
          max={MAX_ZOOM}
          bind:value={controls.zoom}
          step={0.1}
          onKeyDown={(e) => e.preventDefault()}
        />
      </span>
      <button class="control icon" onclick={() => toggleFullscreen(container)}>
        {controls.isFullscreen ? "" : ""}
      </button>
    </footer>
    <img
      class:src
      {src}
      class:horizontal={isHorizontal(controls)}
      style:rotate={rotationDeg(controls)}
      style:scale={controls.zoom}
      style:translate={translationPx(controls)}
      style:object-fit="contain"
      alt="Gallery"
      onloadedmetadata={() => resetAllControls(controls)}
    />
  </section>
{/if}
