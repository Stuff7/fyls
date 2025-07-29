<script lang="ts">
  import RangeInput from "./RangeInput.svelte";
  import type { DirInfo, FileDetails } from "./types";
  import {
    disableSpace,
    navigate,
    saturateNum,
    withDelayedCleanup,
  } from "./utils";
  import VideoControls from "./VideoControls.svelte";

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

  const MAX_ZOOM = 500;

  let container = $state<HTMLElement>();
  let imageElement = $state<HTMLImageElement>();
  let videoElement = $state<HTMLVideoElement>();

  let translation = $state({ x: 0, y: 0 });
  let rotation = $state(0);
  let zoom = $state(100);
  let zoomFactor = $derived(zoom / 100);
  let isFullscreen = $state(false);
  let ctrlsVisible = $state(false);
  let isDragging = $state(false);
  let showShortcuts = $state(false);
  let lockControls = $state(false);

  const shortcuts = [
    // General
    { key: "H", description: "Toggle this list of shortcuts" },
    { key: "Esc", description: "Close overlay or exit fullscreen" },
    { key: "R", description: "Reset zoom and position" },

    // Navigation
    { key: "←", description: "Previous image" },
    { key: "→", description: "Next image" },

    // View Mode
    { key: "F", description: "Toggle fullscreen" },
    { key: "Dbl Click", description: "Toggle fullscreen" },

    // Rotation
    { key: "Q", description: "Rotate left 90°" },
    { key: "E", description: "Rotate right 90°" },

    // Zooming
    { key: "Z", description: "Reset zoom" },
    { key: "X", description: "Zoom out" },
    { key: "C", description: "Zoom in" },
    { key: "Wheel", description: "Zoom in or out" },

    // Panning
    { key: "W", description: "Pan up" },
    { key: "A", description: "Pan left" },
    { key: "S", description: "Pan down" },
    { key: "D", description: "Pan right" },
    { key: "Mid+Drag", description: "Move (pan) image" },
  ];

  $effect(() => {
    if (zoom === 100) translation = { x: 0, y: 0 };
  });

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
    zoom = 100;
    translation.x = translation.y = 0;
  }

  function getMediaBounds() {
    if (!container) return null;

    const containerRect = container.getBoundingClientRect();
    let mediaRect: DOMRect;

    if (!selectedFile || selectedFile.isDir) return;

    if (selectedFile.type === "image" && imageElement) {
      mediaRect = imageElement.getBoundingClientRect();
    } else if (selectedFile.type === "video" && videoElement) {
      mediaRect = videoElement.getBoundingClientRect();
    } else {
      return null;
    }

    return {
      container: containerRect,
      media: mediaRect,
    };
  }

  function zoomAtPoint(newZoom: number, clientX: number, clientY: number) {
    const bounds = getMediaBounds();
    if (!bounds) return;

    const { container: containerRect, media: mediaRect } = bounds;

    const cursorX = clientX - containerRect.left;
    const cursorY = clientY - containerRect.top;

    const mediaCenterX =
      mediaRect.left + mediaRect.width / 2 - containerRect.left;
    const mediaCenterY =
      mediaRect.top + mediaRect.height / 2 - containerRect.top;

    const offsetX = cursorX - mediaCenterX;
    const offsetY = cursorY - mediaCenterY;

    const zoomFactorChange = newZoom / zoom;

    const strength = 1.2;
    translation.x -= offsetX * (zoomFactorChange - 1) * strength;
    translation.y -= offsetY * (zoomFactorChange - 1) * strength;

    zoom = newZoom;
  }

  function doWheelZoom(e: WheelEvent) {
    if (!selectedFile || selectedFile.isDir) return;

    e.preventDefault();

    const zoomStep = 5;
    let newZoom: number;

    if (e.deltaY < 0) {
      newZoom = Math.min(zoom + zoomStep, MAX_ZOOM);
    } else {
      newZoom = Math.max(zoom - zoomStep, 5);
    }

    zoomAtPoint(newZoom, e.clientX, e.clientY);
  }

  function doDrag(e: MouseEvent) {
    if (!isDragging) {
      return;
    }
    translation.x += e.movementX;
    translation.y += e.movementY;
  }

  function navToPrevFile() {
    for (let i = fileIdx - 1; i >= 0; i--) {
      const f = dir.files[i];
      if (f.isDir) continue;
      navigate(f.path);
      break;
    }
  }

  function navToNextFile() {
    for (let i = fileIdx + 1; i < dir.files.length; i++) {
      const f = dir.files[i];
      if (f.isDir) continue;
      navigate(f.path);
      break;
    }
  }

  function rotate(rel: number) {
    rotation = saturateNum(rotation + rel, 0, 360);
  }

  function ctrlsListener(e: KeyboardEvent) {
    if (!container) return;
    showControls();
    const k = e.key.toLowerCase();
    if (k === "f") {
      toggleFullscreen(container);
    } else if (k === "l") {
      lockControls = !lockControls;
    } else if (k === "q") {
      rotate(-90);
    } else if (k === "e") {
      rotate(90);
    } else if (k === "z") {
      resetZoom();
    } else if (k === "x") {
      zoom = Math.max(zoom - 5, 5);
    } else if (k === "c") {
      zoom = Math.min(zoom + 5, MAX_ZOOM);
    } else if (k === "w") {
      translation.y += zoomFactor * 16;
    } else if (k === "a") {
      translation.x += zoomFactor * 16;
    } else if (k === "s") {
      translation.y -= zoomFactor * 16;
    } else if (k === "d") {
      translation.x -= zoomFactor * 16;
    } else if (k === "r") {
      zoom = 100;
      translation = { x: 0, y: 0 };
    } else if (k === "h") {
      showShortcuts = !showShortcuts;
    } else if (e.key === "Escape") {
      if (selectedFile?.parent?.path) navigate(selectedFile.parent.path);
    }

    if (e.shiftKey) return true;
    if (e.key === "ArrowLeft") {
      navToPrevFile();
    } else if (e.key === "ArrowRight") {
      navToNextFile();
    } else {
      return true;
    }
  }
</script>

<svelte:window
  onkeydown={ctrlsListener}
  onpointerup={() => (isDragging = false)}
  onfullscreenchange={() =>
    (isFullscreen = document.fullscreenElement === container)}
/>

{#if selectedFile && !selectedFile.isDir}
  <section
    class={`gallery ${selectedFile.type}`}
    class:hidden-ctrls={!lockControls && !ctrlsVisible}
    bind:this={container}
    role="dialog"
    tabindex="0"
    onwheel={doWheelZoom}
    onpointerdown={(e) => e.button === 1 && (isDragging = true)}
    onpointermove={(e) => {
      showControls();
      doDrag(e);
    }}
    onpointerenter={showControls}
    onpointerleave={() => (ctrlsVisible = false)}
    ondblclick={(e) => {
      if (
        e.target instanceof HTMLElement &&
        e.target.closest("button, input") &&
        !e.target.classList.contains("play")
      ) {
        return;
      }
      toggleFullscreen(container);
    }}
  >
    <header>
      <h1>{selectedFile.name}</h1>
      <span class="control horizontal">
        <strong>{zoom}%</strong>
        <button
          class="icon"
          title="Reset Zoom"
          onclick={resetZoom}
          onkeydown={disableSpace}></button
        >
        <RangeInput
          min={1}
          max={MAX_ZOOM}
          bind:value={zoom}
          step={1}
          formatter={(v) => `${Math.round(v)}%`}
        />
      </span>
      <button
        class="icon"
        title="Lock Controls"
        onclick={() => (lockControls = !lockControls)}
        onkeydown={disableSpace}
      >
        {lockControls ? "" : ""}
      </button>
      <button
        class="icon"
        title="Rotate Right"
        onclick={() => rotate(90)}
        onkeydown={disableSpace}
      >
        
      </button>
      <button
        class="icon"
        title="Rotate Left"
        onclick={() => rotate(-90)}
        onkeydown={disableSpace}
      >
        
      </button>
      <button
        class="icon"
        title="Prev File"
        onclick={navToPrevFile}
        onkeydown={disableSpace}
      >
        
      </button>
      <button
        class="icon"
        title="Next File"
        onclick={navToNextFile}
        onkeydown={disableSpace}
      >
        
      </button>
      <button
        class="icon"
        title="Keyboard Shortcuts"
        onclick={() => (showShortcuts = !showShortcuts)}
        onkeydown={disableSpace}
      >
        ?
      </button>
      <button
        class="icon no-color"
        onclick={() => navigate(selectedFile!.parent!.path)}
        onkeydown={disableSpace}
      >
        
      </button>
    </header>
    {#snippet controlsSnippet()}
      <button
        class="icon"
        title="Toggle Fullscreen"
        onclick={() => toggleFullscreen(container)}
        onkeydown={disableSpace}
      >
        {isFullscreen ? "" : ""}
      </button>
    {/snippet}
    {#if selectedFile.type === "video"}
      <VideoControls
        bind:video={videoElement}
        {zoomFactor}
        {rotation}
        src={selectedFile.src}
        {translation}
      >
        {#snippet controls()}{@render controlsSnippet()}{/snippet}
      </VideoControls>
    {:else if selectedFile.type === "image"}
      <img
        bind:this={imageElement}
        class="src"
        src={selectedFile.src}
        class:horizontal={rotation === 90 || rotation === 270}
        style:rotate={`${rotation}deg`}
        style:scale={zoomFactor}
        style:translate={`${translation.x}px ${translation.y}px`}
        style:object-fit="contain"
        alt={selectedFile.name}
        onloadedmetadata={resetAll}
      />
      <footer>
        {@render controlsSnippet()}
      </footer>
    {/if}
    {#if showShortcuts}
      <div
        role="dialog"
        class="absolute z-50 p-6 rounded-lg bg-black/90 left-4 bottom-4 text-white shadow-xl max-w-5xl max-h-[80vh] overflow-y-auto opacity-100!"
      >
        <h1 class="font-bold text-lg mb-4 text-center">Keyboard Shortcuts</h1>
        <div
          class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-1"
        >
          {#each shortcuts as shortcut}
            <div class="grid grid-cols-[5.2rem_1fr] gap-3 items-center py-1">
              <kbd
                class="bg-white/15 border border-white/25 text-white px-2 py-1 rounded font-mono text-xs text-center whitespace-nowrap"
              >
                {shortcut.key}
              </kbd>
              <span class="text-white/90 text-sm leading-tight"
                >{shortcut.description}</span
              >
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </section>
{/if}
