<script lang="ts">
  import RangeInput from "./RangeInput.svelte";
  import type { DirInfo, FileDetails } from "./types";
  import {
    navigate,
    percentify,
    saturateNum,
    withDelayedCleanup,
  } from "./utils";

  type Props = {
    dir: DirInfo;
    selectedFile?: FileDetails;
  };

  let { dir, selectedFile = $bindable() }: Props = $props();

  const fileIdx = $derived(
    selectedFile
      ? dir.files.findIndex((f) => f.path === selectedFile!.path)
      : -1,
  );

  const MAX_ZOOM = 5;

  let container = $state<HTMLElement>();
  let translation = $state({ x: 0, y: 0 });
  let rotation = $state(0);
  let zoom = $state(1);
  let isFullscreen = $state(false);
  let ctrlsVisible = $state(false);
  let isDragging = $state(false);

  const showControls = withDelayedCleanup(
    () => (ctrlsVisible = true),
    () => (ctrlsVisible = false),
  );

  function toggleFullscreen(elem?: Element) {
    if (!elem) return;
    if (document.fullscreenElement === elem) {
      document.exitFullscreen();
    } else {
      elem.requestFullscreen();
    }
  }

  function resetAll() {
    rotation = 0;
    resetZoom();
  }

  function resetZoom() {
    zoom = 1;
    translation.x = translation.y = 0;
  }

  function doWheelZoom(e: WheelEvent) {
    if (e.deltaY < 0) zoom = Math.min(zoom + 0.1, MAX_ZOOM);
    else zoom = Math.max(zoom - 0.1, 0.1);
  }

  function doDrag(e: MouseEvent) {
    if (!isDragging) {
      return;
    }
    translation.x += e.movementX;
    translation.y += e.movementY;
  }

  function ctrlsListener(e: KeyboardEvent) {
    if (!container) return;
    showControls();
    const k = e.key.toLowerCase();
    if (k === "f") {
      toggleFullscreen(container);
    } else if (k === "q") {
      rotation = saturateNum(rotation - 90, 0, 360);
    } else if (k === "e") {
      rotation = saturateNum(rotation + 90, 0, 360);
    } else if (k === "z") {
      resetZoom();
    } else if (k === "x") {
      zoom = Math.max(zoom - 0.1, 0.1);
    } else if (k === "c") {
      zoom = Math.min(zoom + 0.1, MAX_ZOOM);
    } else if (k === "w") {
      translation.y += zoom * 16;
    } else if (k === "a") {
      translation.x += zoom * 16;
    } else if (k === "s") {
      translation.y -= zoom * 16;
    } else if (k === "d") {
      translation.x -= zoom * 16;
    } else if (e.key === "ArrowLeft") {
      for (let i = fileIdx - 1; i >= 0; i--) {
        const f = dir.files[i];
        if (f.isDir) continue;
        navigate(f.path);
        break;
      }
    } else if (e.key === "ArrowRight") {
      for (let i = fileIdx + 1; i < dir.files.length; i++) {
        const f = dir.files[i];
        if (f.isDir) continue;
        navigate(f.path);
        break;
      }
    } else if (e.key === "Escape") {
      if (selectedFile?.parent?.path) navigate(selectedFile.parent.path);
    } else {
      return true;
    }
  }
</script>

<svelte:window
  onkeydown={ctrlsListener}
  onfullscreenchange={() =>
    (isFullscreen = document.fullscreenElement === container)}
/>

{#if selectedFile && !selectedFile.isDir}
  <section
    bind:this={container}
    role="dialog"
    tabindex="0"
    class={`gallery ${selectedFile.type}`}
    class:hidden-ctrls={!ctrlsVisible}
    onwheel={doWheelZoom}
    onpointerdown={(e) => e.button === 1 && (isDragging = true)}
    onpointermove={(e) => {
      showControls();
      doDrag(e);
    }}
    onpointerenter={showControls}
    onpointerleave={() => (ctrlsVisible = false)}
    onpointerup={() => (isDragging = false)}
    ondblclick={() => toggleFullscreen(container)}
  >
    <header>
      <h1 class="title">{selectedFile.name}</h1>
      <button
        class="icon no-color"
        onclick={() => navigate(selectedFile!.parent!.path)}
      >
        
      </button>
    </header>
    <footer>
      <span class="control">
        <strong>{percentify(zoom)}</strong>
        <button class="icon" onclick={resetZoom}>  </button>
        <RangeInput
          min={0.1}
          max={MAX_ZOOM}
          bind:value={zoom}
          step={0.1}
          onKeyDown={(e) => e.preventDefault()}
        />
      </span>
      <button class="control icon" onclick={() => toggleFullscreen(container)}>
        {isFullscreen ? "" : ""}
      </button>
    </footer>
    <img
      class="src"
      src={selectedFile.src}
      class:horizontal={rotation === 90 || rotation === 270}
      style:rotate={`${rotation}deg`}
      style:scale={zoom}
      style:translate={`${translation.x}px ${translation.y}px`}
      style:object-fit="contain"
      alt={selectedFile.name}
      onloadedmetadata={resetAll}
    />
  </section>
{/if}
